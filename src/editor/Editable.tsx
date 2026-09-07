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

  function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
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
  const showOverlay = canEdit && hovered && !editing;
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
      className={`${className ?? ''} hb-editable-target${editing ? ' hb-editing' : ''}${isEmpty ? ' hb-empty' : ''}`.trim()}
      style={{ ...style, position: 'relative', ...inlineTagFix }}
      contentEditable={canEdit && editing}
      suppressContentEditableWarning
      onMouseEnter={() => canEdit && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={
        canEdit
          ? (e: ReactMouseEvent) => {
              e.stopPropagation();
              startEditing();
            }
          : undefined
      }
      onBlur={canEdit ? commit : undefined}
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
  /** Achica el overlay (sin texto) para áreas de imagen chicas. Ver `EditableImageOverlay`. */
  compact?: boolean;
}

export function EditableImageArea({ as, fieldPath, label, className, style, hasImage, compact }: EditableImageAreaProps) {
  const Tag = (as ?? 'div') as any; // eslint-disable-line @typescript-eslint/no-explicit-any -- componente polimorfico: Tag recibe cualquier tipo de elemento pasado por quien llama
  const editor = useHomeBlocksEditor();
  const [hovered, setHovered] = useState(false);

  if (!editor) {
    return <Tag className={className} style={style} />;
  }

  const canEdit = editor.canEditField(fieldPath);

  return (
    <Tag
      data-hb-editable={canEdit ? 'true' : undefined}
      className={className}
      style={{ ...style, cursor: canEdit ? 'pointer' : undefined }}
      onMouseEnter={() => canEdit && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={
        canEdit
          ? (e: ReactMouseEvent) => {
              e.stopPropagation();
              editor.onImageRequest(fieldPath);
            }
          : undefined
      }
    >
      {canEdit && hovered && (
        <EditableImageOverlay
          label={label}
          hasImage={hasImage}
          compact={compact}
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

  if (!editor) return <>{children}</>;

  const canEdit = editor.canEditField(fieldPath);

  return (
    <span
      data-hb-editable={canEdit ? 'true' : undefined}
      className={wrapperClassName}
      style={{ ...wrapperStyle, position: 'relative', cursor: canEdit ? 'pointer' : undefined }}
      onMouseEnter={() => canEdit && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
      {canEdit && hovered && (
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
      style={{ position: 'relative' }}
      role={canEdit ? undefined : 'img'}
      aria-label={canEdit ? undefined : `Calificación: ${value} de 5 estrellas`}
      onMouseEnter={() => canEdit && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
      {canEdit && hovered && <EditableOverlay label={label} color="orange" />}
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const Icon = resolveIcon(iconName);

  if (!editor) {
    return <Icon aria-hidden="true" className={className} />;
  }

  const canEdit = editor.canEditField(fieldPath);

  return (
    <span
      data-hb-editable={canEdit ? 'true' : undefined}
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => canEdit && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
      {canEdit && hovered && !pickerOpen && <EditableOverlay label={label} color="orange" />}
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

  if (!editor) {
    return <Tag className={className}>{children}</Tag>;
  }

  const canEdit = editor.canEditField(fieldPath);

  return (
    <Tag
      data-hb-editable={canEdit ? 'true' : undefined}
      className={className}
      style={{ position: 'relative' }}
      onMouseEnter={() => canEdit && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {canEdit && hovered && (
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