'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { Copy, Pencil, Plus, Settings, Star, Trash2 } from 'lucide-react';
import { useHomeBlocksEditor } from './EditorContext';
import { resolveIcon } from '../icons/resolveIcon';
import { searchIcons } from './curatedIconNames';

/* =========================================================================
 * Overlay compartido (chip + toolbar) — interno, no se exporta.
 * =======================================================================*/

interface EditableOverlayProps {
  label: string;
  color: 'orange' | 'blue';
  onSettings?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

function stop<T extends ReactMouseEvent>(event: T, fn: () => void) {
  event.preventDefault();
  event.stopPropagation();
  fn();
}

function EditableOverlay({ label, color, onSettings, onDuplicate, onDelete }: EditableOverlayProps) {
  return (
    <span
      data-hb-overlay="true"
      className={`hb-editable-overlay hb-editable-overlay-${color}`}
      contentEditable={false}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span className="hb-editable-chip">{label}</span>
      <span className="hb-editable-toolbar">
        {onSettings && (
          <button type="button" className="hb-editable-btn" title="Configurar" aria-label="Configurar" onClick={(e) => stop(e, onSettings)}>
            <Settings aria-hidden="true" />
          </button>
        )}
        {onDuplicate && (
          <button type="button" className="hb-editable-btn" title="Duplicar" aria-label="Duplicar" onClick={(e) => stop(e, onDuplicate)}>
            <Copy aria-hidden="true" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className="hb-editable-btn hb-editable-btn-danger"
            title="Eliminar"
            aria-label="Eliminar"
            onClick={(e) => stop(e, onDelete)}
          >
            <Trash2 aria-hidden="true" />
          </button>
        )}
      </span>
    </span>
  );
}

/* =========================================================================
 * Lectura/reversión de texto de un nodo en edición — separado de
 * `EditableText` porque el propio overlay (chip + toolbar de
 * `EditableOverlay`) vive como HIJO DEL DOM del nodo `contentEditable`
 * (necesario para poder posicionarlo `absolute` sobre el campo sin
 * envolver el tag original — ver el comentario grande de
 * `EditableText` más abajo). Eso significa que `node.innerText` a
 * secas devuelve el texto real MÁS la etiqueta del chip pegada al
 * final (ej. escribir en el título daba "Bienvenidos a la
 * inmobiliariaTítulo", y en un párrafo de "Sobre nosotros",
 * "...Párrafo") — el bug de "aparecen palabras sueltas que no tienen
 * nada que ver" reportado por el usuario. Estas dos funciones son la
 * única fuente de verdad para leer/revertir el contenido: excluyen
 * SIEMPRE el nodo marcado `data-hb-overlay` antes de tocar el texto.
 * =======================================================================*/

/**
 * Texto real tipeado por el usuario, sin la etiqueta del chip
 * (`data-hb-overlay`). Oculta el overlay con `display:none` justo
 * antes de leer `innerText` (que sí respeta ese estilo al calcular el
 * texto "visible") y lo restaura enseguida — nunca queda un cambio de
 * estilo colgado esperando el próximo render de React.
 */
function readEditedText(node: HTMLElement): string {
  const overlay = node.querySelector<HTMLElement>('[data-hb-overlay]');
  const previousDisplay = overlay?.style.display ?? '';
  if (overlay) overlay.style.display = 'none';
  const text = (node.innerText ?? '').replace(/\u00A0/g, ' ').trim();
  if (overlay) overlay.style.display = previousDisplay;
  return text;
}

/**
 * Revierte el nodo a `text` plano al cancelar (Escape), preservando el
 * nodo del overlay si está presente (en vez de `node.innerText = text`,
 * que borraría TODOS los hijos, overlay incluido). Es clave conservar
 * el mismo nodo del overlay: React sigue creyendo que ese elemento
 * exacto sigue en el árbol, y si el mouse sigue sobre el campo (caso
 * normal al presionar Escape) el próximo render lo deja tal cual; si
 * ya no corresponde mostrarlo, React lo saca él solo sin error. Borrar
 * y recrear ese nodo a mano acá rompería esa cuenta y podía tirar
 * "Failed to execute removeChild" más tarde.
 */
function restoreEditedText(node: HTMLElement, text: string) {
  const overlay = node.querySelector<HTMLElement>('[data-hb-overlay]');
  Array.from(node.childNodes).forEach((child) => {
    if (child !== overlay) node.removeChild(child);
  });
  node.insertBefore(document.createTextNode(text), node.firstChild);
}

/* =========================================================================
 * EditableText — título/subtítulo/párrafos/textos cortos. Misma técnica
 * en toda la Fase: renderiza el MISMO tag que ya existía (polimórfico
 * vía `as`), nunca lo envuelve en un `<div>` extra — así ninguna regla
 * de layout que dependa de la posición real entre hermanos (mismo
 * motivo documentado en `PageEditorPage.tsx`/`SECTION_CLASS_NAMES` del
 * admin) se rompe por agregar edición. El overlay se agrega como un
 * hijo MÁS adentro del propio tag, posicionado absoluto — no altera el
 * flujo del contenido real.
 * =======================================================================*/

/**
 * Tags "inline" (no "block") entre las que puede venir `as` — sólo
 * importa para el fix de acá abajo (contorno roto en texto que
 * envuelve en varias líneas), el resto del componente no distingue.
 */
const INLINE_TAGS = new Set(['span', 'a', 'b', 'i', 'em', 'strong', 'label']);

export interface EditableTextProps {
  as?: ElementType;
  fieldPath: string;
  value: string;
  label: string;
  className?: string;
  style?: CSSProperties;
  /** Enter confirma y sale (por defecto `true` — títulos/textos cortos de una línea). En `false`, Enter inserta un salto de línea normal (párrafos largos). */
  singleLine?: boolean;
  placeholder?: string;
  /**
   * Reemplaza el `editor.onTextCommit(fieldPath, value)` por defecto —
   * pensado para el caso de "Sobre nosotros", donde varios `<p>`
   * comparten un mismo campo `about.text` en la base (un texto único
   * separado en párrafos por líneas en blanco): cada `<p>` sigue
   * siendo su propio `EditableText`, pero al confirmar uno hay que
   * releer TODOS los párrafos hermanos y stagear el texto combinado,
   * no sólo el de este nodo. Ver `AboutView.tsx`.
   */
  onCommit?: (value: string) => void;
}

export function EditableText({
  as,
  fieldPath,
  value,
  label,
  className,
  style,
  singleLine = true,
  placeholder = 'Escribir…',
  onCommit,
}: EditableTextProps) {
  const Tag = (as ?? 'div') as any; // eslint-disable-line @typescript-eslint/no-explicit-any -- componente polimorfico: Tag recibe cualquier tipo de elemento pasado por quien llama
  const editor = useHomeBlocksEditor();
  const [hovered, setHovered] = useState(false);
  // Foco por teclado (Tab) — aditivo a `hovered`, mismo criterio que el
  // resto de los primitivos de este archivo (ver comentario grande en
  // `EditableRow` más abajo para el porqué de tocar sólo esto y no
  // `EditorContext.tsx`).
  const [focused, setFocused] = useState(false);
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const initialValueRef = useRef(value);

  const canEdit = !!editor && editor.canEditField(fieldPath);

  function startEditing() {
    if (!canEdit || editing) return;
    initialValueRef.current = value;
    setEditing(true);
  }

  function commit() {
    const node = ref.current;
    setEditing(false);
    if (!node || !editor) return;
    const next = readEditedText(node);
    if (next !== initialValueRef.current) {
      if (onCommit) onCommit(next);
      else editor.onTextCommit(fieldPath, next);
    }
  }

  function cancel() {
    if (ref.current) restoreEditedText(ref.current, initialValueRef.current);
    setEditing(false);
  }

  /**
   * `onBlur` ya disparaba `commit()` (confirma el valor tipeado al salir
   * del campo). Acá nada más se le suma apagar `focused` en el mismo
   * handler — un único punto en vez de dos handlers separados en el
   * mismo evento, para no depender de en qué orden los llame React.
   */
  function handleBlur() {
    setFocused(false);
    commit();
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (!editing) {
      // NUEVO: antes de agregar `tabIndex` (ver el JSX de abajo) este
      // campo no era alcanzable por Tab, así que esta rama nunca
      // corría. Ahora que sí lo es, llegar acá por teclado y presionar
      // Enter tiene que abrir edición — igual que ya hace el click —
      // porque si no Enter caía en la rama de abajo (pensada para
      // cuando YA se está editando) y sacaba el foco sin haber llegado
      // a escribir nada. Sólo Enter, no Espacio: este campo se lee como
      // texto, no como un botón, y tipear un espacio por error antes de
      // haber entrado en modo edición no debería activar nada.
      if (event.key === 'Enter') {
        event.preventDefault();
        startEditing();
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
      ref.current?.blur();
    } else if (singleLine && event.key === 'Enter') {
      event.preventDefault();
      ref.current?.blur();
    }
  }

  // Al entrar en modo edición: foco + cursor al final del texto. Se
  // declara ACÁ (nunca después de un `return` condicional) a
  // propósito: React exige que todo componente llame exactamente los
  // mismos hooks, en el mismo orden, en TODOS sus renders — así
  // `editor` sea `null` (público) o no. El propio callback ya
  // resuelve el no-op solo (`if (!editing) return`, y en el público
  // `editing` nunca pasa a `true` porque no hay ningún `onClick` que
  // lo dispare).
  useEffect(() => {
    if (!editing || !ref.current) return;
    const node = ref.current;
    node.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [editing]);

  // Público (o cualquier consumidor sin Provider): markup idéntico al
  // de siempre, cero overhead — ver el comentario grande de
  // `EditorContext.tsx`. El chequeo va DESPUÉS de declarar todos los
  // hooks de arriba, nunca antes.
  if (!editor) {
    return <Tag className={className} style={style}>{value}</Tag>;
  }

  // El chip/toolbar naranja es SOLO para "esto se puede editar,
  // tocalo" — una vez que arranca la edición no debe seguir tapando
  // el campo. En modo edición el contorno pasa a celeste (clase
  // `.hb-editing` en 24-editable-overlay.css, aplicada directo sobre
  // el propio Tag) y no hace falta ningún botón de "confirmar": el
  // commit ya viaja por `onBlur` (clickear afuera, tabular a otro
  // campo, etc. lo dispara solo) y por Enter/Escape en
  // `handleKeyDown` — acá abajo. El guardado real contra la base
  // sigue siendo un paso aparte (botón "Guardar" del Editor de
  // página): esto sólo saca la fricción visual de tener que confirmar
  // cada campo uno por uno mientras se escribe.
  const showOverlay = canEdit && (hovered || focused) && !editing;
  const isEmpty = !editing && !value;

  // Fix del contorno mal marcado en campos de varias líneas (auditoría
  // del Editor de página): el chip/contorno naranja (`EditableOverlay`,
  // clase `.hb-editable-overlay`) es `position: absolute; inset: 0`
  // sobre ESTE MISMO tag (`position: relative` acá abajo). Eso anda
  // perfecto en tags de bloque (`h1`, `p`, el `Tag` por defecto es
  // `div`) porque generan una sola caja aunque el texto adentro
  // envuelva en varias líneas.
  //
  // El problema es sólo con `as="span"` (u otro tag inline): un
  // elemento `display: inline` que envuelve en 2+ líneas NO genera una
  // caja rectangular única — genera un fragmento por línea, con forma
  // rara (ancho de la primera línea, alto de todas) — es la caja
  // contenedora que usa el overlay `absolute`, así que el contorno
  // termina cubriendo cualquier cosa menos el texto real. Pasa
  // puntualmente en el contenido de un Testimonio (`TestimonialsView`,
  // `as="span"` + `singleLine={false}`, casi siempre 2-3 líneas) y,
  // más angosto, en el texto de un ítem de Barra de confianza
  // (`TrustBarView`, `as="span"`).
  //
  // El fix: forzar `display: inline-block` en el propio tag cuando es
  // inline. Un `inline-block` sí genera una única caja rectangular
  // aunque su contenido envuelva adentro — mismo motivo por el que
  // funciona bien un `<button>` con texto largo. Sólo afecta el
  // render DENTRO del canvas del editor (esta rama del componente ya
  // está después del `if (!editor) return ...` de arriba) — el sitio
  // público nunca pasa por acá, así que este ajuste no le puede
  // cambiar un pixel al layout real.
  const inlineTagFix = typeof as === 'string' && INLINE_TAGS.has(as) ? { display: 'inline-block' as const } : undefined;

  return (
    <Tag
      ref={ref}
      data-hb-editable={canEdit ? 'true' : undefined}
      // NUEVO: sin esto el campo no entraba nunca en el orden de Tab
      // (un `div`/`h1`/`p`/`span` sin `tabIndex` no es foco-alcanzable
      // por más que después, ya en edición, `contentEditable` lo vuelva
      // editable). `.hb-editable-target { outline: none }`
      // (`24-editable-overlay.css`, sin tocar) ya suprime el anillo
      // azul nativo del navegador en todos los estados de este tag —
      // el propio `EditableOverlay` de abajo es el único indicador
      // visual también para foco de teclado, así que no hace falta
      // ningún ajuste de estilo adicional acá.
      tabIndex={canEdit ? 0 : undefined}
      className={`${className ?? ''} hb-editable-target${editing ? ' hb-editing' : ''}${isEmpty ? ' hb-empty' : ''}`.trim()}
      style={{ ...style, position: 'relative', ...inlineTagFix }}
      contentEditable={canEdit && editing}
      suppressContentEditableWarning
      onMouseEnter={() => canEdit && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={canEdit ? () => setFocused(true) : undefined}
      onClick={
        canEdit
          ? (e: ReactMouseEvent) => {
              e.stopPropagation();
              startEditing();
            }
          : undefined
      }
      onBlur={canEdit ? handleBlur : undefined}
      onKeyDown={canEdit ? handleKeyDown : undefined}
    >
      {editing ? value : value || (canEdit ? placeholder : '')}
      {showOverlay && <EditableOverlay label={label} color="orange" />}
    </Tag>
  );
}

/* =========================================================================
 * EditableImageOverlay — overlay específico para imágenes (interno, no
 * se exporta). A diferencia del overlay de texto (contorno fino +
 * chip con el nombre del campo), acá la señal principal es un velo
 * oscuro sobre toda la imagen con una píldora centrada — ícono de
 * lápiz + "Cambiar imagen"/"Agregar imagen" — el patrón que ya usan
 * los editores visuales tipo Wix/Canva/Webflow para dejar clarísimo
 * que esa zona es una imagen y que tocarla abre el selector. El botón
 * de eliminar (si corresponde) queda aparte, en la esquina superior
 * derecha, para no competir con la acción principal.
 *
 * El velo tiene `pointer-events: none`: el click en cualquier punto
 * (incluida la píldora) atraviesa el overlay y llega al elemento real
 * de abajo, que ya tiene su propio `onClick` → `editor.onImageRequest`
 * (ver `EditableImageArea`/`EditableImageSlot`). Sólo el botón de
 * eliminar habilita `pointer-events: auto` para poder frenar la
 * propagación y no disparar el picker de imagen al borrar.
 *
 * `compact` se usa en imágenes chicas (ej. el avatar de un testimonio,
 * 48px): esconde el texto y achica el ícono/botón para que entren
 * bien en el espacio disponible.
 * =======================================================================*/

interface EditableImageOverlayProps {
  label: string;
  hasImage: boolean;
  compact?: boolean;
  onDelete?: () => void;
}

function EditableImageOverlay({ label, hasImage, compact, onDelete }: EditableImageOverlayProps) {
  return (
    <span
      data-hb-overlay="true"
      className={`hb-image-overlay${compact ? ' hb-image-overlay-compact' : ''}`}
      contentEditable={false}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span className="hb-image-overlay-action">
        <Pencil aria-hidden="true" />
        {!compact && <span className="hb-image-overlay-label">{hasImage ? 'Cambiar imagen' : 'Agregar imagen'}</span>}
      </span>
      {onDelete && (
        <button
          type="button"
          className="hb-image-overlay-delete"
          title={`Eliminar ${label.toLowerCase()}`}
          aria-label={`Eliminar ${label.toLowerCase()}`}
          onClick={(e) => stop(e, onDelete)}
        >
          <Trash2 aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

/* =========================================================================
 * EditableImageAreaOverlay — overlay específico de `EditableImageArea`
 * (imagen de fondo que ocupa TODA la sección — hoy sólo el fondo del
 * Hero). NO usa el patrón de `EditableImageOverlay` (velo oscuro +
 * píldora centrada): justo arriba/en el medio de esa misma área va el
 * título/subtítulo/buscador del Hero (`hero-content`), así que el velo
 * + píldora centrada quedaba literalmente atrás del título — un choque
 * visual raro (reportado por el usuario) en vez de una señal clara de
 * "esto es una imagen". Acá se usa el mismo criterio que el overlay de
 * TEXTO (`EditableOverlay`, arriba de este archivo): contorno fino +
 * una etiqueta chica, sin tapar nada.
 *
 * Único ajuste respecto al overlay de texto: ese chip vive en
 * `top: -28px` (por AFUERA de la caja, arriba) porque los campos de
 * texto son chicos y tienen lugar libre alrededor. Acá el contenedor
 * es la sección entera del Hero, con `overflow: hidden`
 * (`section.hero` en `07-hero.css`) — un chip en `-28px` quedaría
 * cortado. Por eso el chip vive ADENTRO del contorno, pegado a la
 * esquina superior izquierda, con un `top` lo bastante grande como
 * para quedar SIEMPRE debajo del header fijo (76px de alto en
 * desktop / 56px en mobile, `z-index: 1000` — flota encima de todo,
 * así que a una altura menor quedaría tapado). Ver
 * `.hb-image-area-overlay`/`.hb-image-area-chip` en
 * `24-editable-overlay.css`.
 * =======================================================================*/

interface EditableImageAreaOverlayProps {
  label: string;
  onDelete?: () => void;
}

function EditableImageAreaOverlay({ label, onDelete }: EditableImageAreaOverlayProps) {
  return (
    <span
      data-hb-overlay="true"
      className="hb-image-area-overlay"
      contentEditable={false}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span className="hb-image-area-chip">
        <Pencil aria-hidden="true" />
        {label}
      </span>
      {onDelete && (
        <button
          type="button"
          className="hb-image-area-delete"
          title={`Eliminar ${label.toLowerCase()}`}
          aria-label={`Eliminar ${label.toLowerCase()}`}
          onClick={(e) => stop(e, onDelete)}
        >
          <Trash2 aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

/* =========================================================================
 * EditableImageArea — para una imagen que viaja como `background` CSS
 * inline sobre un `<div>` ya existente (el fondo del Hero) — el `<div>`
 * en sí es el target, sin ningún wrapper nuevo.
 * =======================================================================*/

export interface EditableImageAreaProps {
  as?: ElementType;
  fieldPath: string;
  label: string;
  className?: string;
  style?: CSSProperties;
  hasImage: boolean;
}

export function EditableImageArea({ as, fieldPath, label, className, style, hasImage }: EditableImageAreaProps) {
  const Tag = (as ?? 'div') as any; // eslint-disable-line @typescript-eslint/no-explicit-any -- componente polimorfico: Tag recibe cualquier tipo de elemento pasado por quien llama
  const editor = useHomeBlocksEditor();
  const [hovered, setHovered] = useState(false);
  // Foco por teclado (Tab) — aditivo a `hovered`, mismo criterio en
  // todo el archivo.
  const [focused, setFocused] = useState(false);

  if (!editor) {
    return <Tag className={className} style={style} />;
  }

  const canEdit = editor.canEditField(fieldPath);

  return (
    <Tag
      data-hb-editable={canEdit ? 'true' : undefined}
      // Ver el comentario del mismo cambio en `EditableIcon`: sin
      // `outline: 'none'` acá, foco de teclado agregaría el anillo
      // nativo del navegador encima del contorno propio de
      // `EditableImageAreaOverlay`.
      tabIndex={canEdit ? 0 : undefined}
      className={className}
      style={{ ...style, cursor: canEdit ? 'pointer' : undefined, outline: focused ? 'none' : undefined }}
      onMouseEnter={() => canEdit && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => canEdit && setFocused(true)}
      onBlur={() => setFocused(false)}
      onClick={
        canEdit
          ? (e: ReactMouseEvent) => {
              e.stopPropagation();
              editor.onImageRequest(fieldPath);
            }
          : undefined
      }
    >
      {/* NO VERIFICADO EN DISPOSITIVO REAL — mismo comentario que en
          `EditableIcon`: el picker de imagen se sigue abriendo sólo con
          click/tap, no agregué activación por teclado (Enter/Espacio)
          para no decidir unilateralmente ese alcance. */}
      {canEdit && (hovered || focused) && (
        <EditableImageAreaOverlay
          label={label}
          onDelete={hasImage && editor.onImageRemove ? () => editor.onImageRemove!(fieldPath) : undefined}
        />
      )}
    </Tag>
  );
}

/* =========================================================================
 * EditableImageSlot — para imágenes que viajan por el componente
 * `Image` de la capa de host (no aceptan hijos, así que acá SÍ hace
 * falta un wrapper — pero sólo cuando la edición está activa; sin
 * Provider, el `<Image>` sale exactamente como antes, sin envolver
 * nada). `wrapperStyle`/`wrapperClassName` los define cada vista según
 * el layout puntual donde vive esa imagen (ver comentarios en
 * AboutView/TestimonialsView).
 * =======================================================================*/

export interface EditableImageSlotProps {
  fieldPath: string;
  label: string;
  hasImage: boolean;
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
  /** Achica el overlay (sin texto) para imágenes chicas, ej. el avatar de un testimonio. Ver `EditableImageOverlay`. */
  compact?: boolean;
  children: ReactNode;
}

export function EditableImageSlot({
  fieldPath,
  label,
  hasImage,
  wrapperClassName,
  wrapperStyle,
  compact,
  children,
}: EditableImageSlotProps) {
  const editor = useHomeBlocksEditor();
  const [hovered, setHovered] = useState(false);
  // Foco por teclado (Tab) — aditivo a `hovered`, mismo criterio en
  // todo el archivo.
  const [focused, setFocused] = useState(false);

  if (!editor) return <>{children}</>;

  const canEdit = editor.canEditField(fieldPath);

  return (
    <span
      data-hb-editable={canEdit ? 'true' : undefined}
      // Ver el comentario del mismo cambio en `EditableIcon`: sin
      // `outline: 'none'` acá, foco de teclado agregaría el anillo
      // nativo del navegador encima del velo/píldora de
      // `EditableImageOverlay`.
      tabIndex={canEdit ? 0 : undefined}
      className={wrapperClassName}
      style={{ ...wrapperStyle, position: 'relative', cursor: canEdit ? 'pointer' : undefined, outline: focused ? 'none' : undefined }}
      onMouseEnter={() => canEdit && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => canEdit && setFocused(true)}
      onBlur={() => setFocused(false)}
      onClick={
        canEdit
          ? (e: ReactMouseEvent) => {
              e.stopPropagation();
              editor.onImageRequest(fieldPath);
            }
          : undefined
      }
    >
      {children}
      {/* NO VERIFICADO EN DISPOSITIVO REAL — mismo comentario que en
          `EditableIcon`: el picker de imagen se sigue abriendo sólo con
          click/tap, no agregué activación por teclado (Enter/Espacio)
          para no decidir unilateralmente ese alcance. */}
      {canEdit && (hovered || focused) && (
        <EditableImageOverlay
          label={label}
          hasImage={hasImage}
          compact={compact}
          onDelete={hasImage && editor.onImageRemove ? () => editor.onImageRemove!(fieldPath) : undefined}
        />
      )}
    </span>
  );
}

/* =========================================================================
 * EditableRating — estrellas de un testimonio. Renderiza las 5
 * estrellas por sí mismo (mismo JSX/clases que `TestimonialsView` ya
 * usaba) para poder colgar el click de cada una — no es un wrapper de
 * `children`, a diferencia del resto.
 * =======================================================================*/

export interface EditableRatingProps {
  fieldPath: string;
  value: number | null;
  label: string;
}

export function EditableRating({ fieldPath, value, label }: EditableRatingProps) {
  const editor = useHomeBlocksEditor();
  const [hovered, setHovered] = useState(false);
  // Foco por teclado (Tab) — aditivo a `hovered`, mismo criterio en
  // todo el archivo.
  const [focused, setFocused] = useState(false);

  if (!editor) {
    if (value === null) return null;
    return (
      <div className="testimonial-rating" role="img" aria-label={`Calificación: ${value} de 5 estrellas`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={i < value ? 'star-filled' : 'star-empty'} aria-hidden="true" />
        ))}
      </div>
    );
  }

  const canEdit = editor.canEditField(fieldPath);
  if (value === null && !canEdit) return null;
  const display = value ?? 0;

  return (
    <div
      className="testimonial-rating"
      data-hb-editable={canEdit ? 'true' : undefined}
      // Ver el comentario del mismo cambio en `EditableIcon`: sin
      // `outline: 'none'` acá, foco de teclado agregaría el anillo
      // nativo del navegador encima del contorno de `EditableOverlay`.
      tabIndex={canEdit ? 0 : undefined}
      style={{ position: 'relative', outline: focused ? 'none' : undefined }}
      role={canEdit ? undefined : 'img'}
      aria-label={canEdit ? undefined : `Calificación: ${value} de 5 estrellas`}
      onMouseEnter={() => canEdit && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => canEdit && setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={i < display ? 'star-filled' : 'star-empty'}
          aria-hidden="true"
          style={canEdit ? { cursor: 'pointer' } : undefined}
          onClick={
            canEdit
              ? (e: ReactMouseEvent) => {
                  e.stopPropagation();
                  editor.onRatingChange(fieldPath, i + 1);
                }
              : undefined
          }
        />
      ))}
      {/* NO VERIFICADO EN DISPOSITIVO REAL — mismo comentario que en
          `EditableIcon`: cambiar la calificación se sigue haciendo sólo
          con click/tap sobre una estrella puntual; no agregué manejo de
          teclado (ej. flechas para mover entre estrellas + Enter para
          elegir, patrón ARIA "radiogroup") para no decidir
          unilateralmente ese diseño de interacción. */}
      {canEdit && (hovered || focused) && <EditableOverlay label={label} color="orange" />}
    </div>
  );
}

/* =========================================================================
 * EditableIcon — ícono de un ítem de Barra de confianza/¿Por qué
 * elegirnos?. Tocarlo abre un selector chico con búsqueda (ver
 * `IconPickerPopover` más abajo).
 * =======================================================================*/

export interface EditableIconProps {
  fieldPath: string;
  iconName: string;
  label: string;
  className?: string;
}

export function EditableIcon({ fieldPath, iconName, label, className }: EditableIconProps) {
  const editor = useHomeBlocksEditor();
  const [hovered, setHovered] = useState(false);
  // Foco por teclado (Tab) — aditivo a `hovered`, mismo criterio en
  // todo el archivo.
  const [focused, setFocused] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const Icon = resolveIcon(iconName);

  if (!editor) {
    return <Icon aria-hidden="true" className={className} />;
  }

  const canEdit = editor.canEditField(fieldPath);

  return (
    <span
      data-hb-editable={canEdit ? 'true' : undefined}
      // NUEVO: a diferencia de `EditableText`, este `<span>` no tiene
      // ninguna clase con `outline: none` ya declarada en
      // `24-editable-overlay.css` — sin `outline: 'none'` acá, foco de
      // teclado dibujaría el anillo azul nativo del navegador AL MISMO
      // TIEMPO que el contorno naranja de `EditableOverlay`, un doble
      // indicador redundante. Se aplica sólo cuando `focused` es
      // `true` (nunca a la fuerza), así que con mouse (sólo `hovered`)
      // no cambia nada.
      tabIndex={canEdit ? 0 : undefined}
      style={{ position: 'relative', display: 'inline-flex', outline: focused ? 'none' : undefined }}
      onMouseEnter={() => canEdit && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => canEdit && setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <Icon
        aria-hidden="true"
        className={className}
        style={canEdit ? { cursor: 'pointer' } : undefined}
        onClick={
          canEdit
            ? (e: ReactMouseEvent) => {
                e.stopPropagation();
                setPickerOpen((open) => !open);
              }
            : undefined
        }
      />
      {/*
        NO VERIFICADO EN DISPOSITIVO REAL: este `<span>` queda foco-
        alcanzable y el overlay ahora se ve al llegar por Tab (pedido
        del ticket), pero el picker de íconos se sigue abriendo sólo
        con click/tap sobre el `<Icon>` — no agregué un `onKeyDown`
        (Enter/Espacio) que dispare `setPickerOpen`, porque eso ya no es
        "mostrar el affordance" (lo pedido acá) sino "operarlo por
        teclado", un cambio de comportamiento que el ticket no pide
        explícitamente y que preferí no decidir unilateralmente (ver
        RESUMEN MÍNIMO de la respuesta).
      */}
      {canEdit && (hovered || focused) && !pickerOpen && <EditableOverlay label={label} color="orange" />}
      {canEdit && pickerOpen && (
        <IconPickerPopover
          value={iconName}
          onChange={(name) => {
            editor.onIconChange(fieldPath, name);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </span>
  );
}

function IconPickerPopover({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (name: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) onClose();
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [onClose]);

  // Búsqueda multi-idioma (auditoría del Editor de página): antes esto
  // filtraba `CURATED_ICON_NAMES` (~90 nombres, sólo en inglés) por
  // substring literal. `searchIcons()` (`curatedIconNames.ts`) busca
  // contra los ~1460 nombres seguros de `allIconNames.ts` Y contra
  // `iconSynonyms.ts` (español), sin texto escrito devuelve el mismo
  // set curado chico de antes — ver el comentario grande de ese
  // archivo para el porqué de cada parte.
  const results = searchIcons(query);

  return (
    <span
      ref={containerRef}
      className="hb-icon-popover"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar ícono… (ej: casa, seguridad, dinero)"
        className="hb-icon-popover-search"
      />
      <span className="hb-icon-popover-grid">
        {results.map((name) => {
          const OptionIcon = resolveIcon(name);
          return (
            <button
              key={name}
              type="button"
              title={name}
              aria-label={name}
              className={`hb-icon-popover-btn${name === value ? ' hb-icon-popover-btn-active' : ''}`}
              onClick={() => onChange(name)}
            >
              <OptionIcon aria-hidden="true" />
            </button>
          );
        })}
        {results.length === 0 && <span className="hb-icon-popover-empty">Sin resultados</span>}
      </span>
    </span>
  );
}

/* =========================================================================
 * EditableRow — una fila/tarjeta repetible (ítem de Barra de confianza
 * o de ¿Por qué elegirnos?). Misma técnica de "mismo tag, sin
 * wrapper" que `EditableText` — así la tarjeta sigue siendo el hijo
 * DIRECTO de la grilla (`.trust-items`/`.why-grid`, CSS Grid), nunca
 * queda un `<div>` de más entre medio.
 * =======================================================================*/

export interface EditableRowProps {
  as?: ElementType;
  fieldPath: string;
  label: string;
  className?: string;
  children: ReactNode;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export function EditableRow({ as, fieldPath, label, className, children, onDuplicate, onDelete }: EditableRowProps) {
  const Tag = (as ?? 'div') as any; // eslint-disable-line @typescript-eslint/no-explicit-any -- componente polimorfico: Tag recibe cualquier tipo de elemento pasado por quien llama
  const editor = useHomeBlocksEditor();
  const [hovered, setHovered] = useState(false);
  /**
   * Foco por teclado — a diferencia de los demás primitivos de este
   * archivo, esta fila NO recibe `tabIndex` propio (ver el JSX de
   * abajo): hoy sus únicos dos consumidores (`TrustBarView`,
   * `WhyUsView`) siempre envuelven al menos un `EditableIcon`/
   * `EditableText` como hijo, y esos primitivos SÍ son foco-alcanzables
   * ahora (mismo cambio en este archivo). React 17+ implementa
   * `onFocus`/`onBlur` sobre los eventos nativos `focusin`/`focusout`,
   * que SÍ burbujean — así que tabular hasta el ícono o el texto de
   * adentro dispara este `onFocus` de la fila igual, sin necesitar que
   * la fila en sí sea un target de Tab aparte. Efecto práctico (y
   * buscado): al llegar por teclado a cualquier campo de la fila,
   * también aparecen acá los botones de Duplicar/Eliminar, no sólo el
   * contorno del campo puntual. Si en el futuro existiera un tipo de
   * fila sin NINGÚN hijo foco-alcanzable, este mecanismo no alcanzaría
   * por sí solo — no es el caso hoy en ninguna vista.
   */
  const [focused, setFocused] = useState(false);
  /**
   * "Fila activa por tacto" (punto 2 del pedido): un tap sólo deja el
   * elemento en estado `:focus`/`focused` de forma persistente cuando
   * cae sobre un elemento REALMENTE foco-alcanzable — acá eso son el
   * ícono/texto de adentro, nunca el espacio vacío de la propia
   * tarjeta. Y no hay ningún equivalente táctil de `:hover`. Por eso
   * hace falta un estado propio: `touchActive` se prende/apaga con un
   * tap sobre el espacio de la fila (no sobre un campo) y se apaga solo
   * al tocar afuera — mismo patrón de "click afuera cierra" que ya usa
   * `IconPickerPopover` más arriba en este archivo (reutilizado tal
   * cual, no es un mecanismo nuevo).
   */
  const [touchActive, setTouchActive] = useState(false);
  const rowRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!touchActive) return;
    function onPointerDown(event: PointerEvent) {
      if (rowRef.current && !rowRef.current.contains(event.target as Node)) setTouchActive(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [touchActive]);

  if (!editor) {
    return <Tag className={className}>{children}</Tag>;
  }

  const canEdit = editor.canEditField(fieldPath);
  const showOverlay = canEdit && (hovered || focused || touchActive);

  return (
    <Tag
      ref={rowRef}
      data-hb-editable={canEdit ? 'true' : undefined}
      className={className}
      style={{ position: 'relative' }}
      onMouseEnter={() => canEdit && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => canEdit && setFocused(true)}
      onBlur={() => setFocused(false)}
      // Alterna `touchActive`. Deliberadamente NO llama a
      // `event.stopPropagation()` ni chequea a mano en qué elemento
      // cayó el click: cada campo editable de adentro (`EditableText`/
      // `EditableIcon`/`EditableImageArea`/`EditableImageSlot`/
      // `EditableRating`, todos en este mismo archivo) YA frena la
      // propagación en su propio `onClick` antes de hacer lo suyo — así
      // que este handler de la fila sólo llega a ejecutarse cuando el
      // tap cayó de verdad en el espacio propio de la tarjeta (padding,
      // fondo), nunca sobre un campo real. Confirmado por revisión de
      // código en los cinco primitivos de arriba (VERIFICADO); no
      // probado con un tap real en dispositivo (NO VERIFICADO, ver
      // sección final de la respuesta).
      //
      // Restricción #4 del pedido (nada de detectar "es touch" a nivel
      // de dispositivo): este mismo `onClick` también corre con mouse.
      // Un click de mouse sobre el espacio vacío de la fila (no sobre
      // ningún campo) va a prender `touchActive` igual que un tap —
      // hoy ese click no hacía nada, así que es un comportamiento
      // nuevo, pero acotado: las dos filas que existen hoy
      // (`TrustBarView`/`WhyUsView`) están casi completamente ocupadas
      // por el ícono + texto(s), así que en la práctica queda muy poco
      // "espacio vacío" para que un mouse lo toque sin querer.
      onClick={canEdit ? () => setTouchActive((active) => !active) : undefined}
    >
      {children}
      {showOverlay && (
        <EditableOverlay
          label={label}
          color="blue"
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      )}
    </Tag>
  );
}

/* =========================================================================
 * AddRowTile — tarjeta fantasma al final de una lista para agregar una
 * fila nueva. `editor.onRowAdd` ausente = la lista no admite altas
 * inline (no se muestra nada, en vez de un botón muerto).
 * =======================================================================*/

export interface AddRowTileProps{ 
  as?: ElementType;
  listFieldPath: string;
  label: string;
  className?: string;
}

export function AddRowTile({ as, listFieldPath, label, className }: AddRowTileProps) {
  const Tag = (as ?? 'div') as any; // eslint-disable-line @typescript-eslint/no-explicit-any -- componente polimorfico: Tag recibe cualquier tipo de elemento pasado por quien llama
  const editor = useHomeBlocksEditor();

  if (!editor || !editor.onRowAdd) return null;
  const canAdd = editor.canEditField(listFieldPath) && (editor.canAddRow ? editor.canAddRow(listFieldPath) : true);
  if (!canAdd) return null;

  return (
    <Tag
      data-hb-editable="true"
      className={`hb-add-row-tile ${className ?? ''}`.trim()}
      role="button"
      tabIndex={0}
      onClick={() => editor.onRowAdd!(listFieldPath)}
      onKeyDown={(e: ReactKeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          editor.onRowAdd!(listFieldPath);
        }
      }}
    >
      <Plus aria-hidden="true" />
      <span>{label}</span>
    </Tag>
  );
}