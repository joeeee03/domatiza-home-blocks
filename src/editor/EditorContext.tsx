'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Capa de adaptación de EDICIÓN — hermana de la capa de adaptación de
 * host (`hostTypes.tsx`/`HostComponentsContext.tsx`), mismo patrón
 * (Context con default no-op, "use client" aislado en su propio
 * archivo para no arrastrar a las 6 vistas puras a serlo ellas
 * mismas). Mientras la capa de host resuelve "cómo se navega/renderiza
 * una imagen", esta resuelve "cómo se edita un campo en el lugar,
 * sin ningún formulario aparte" — pedido explícito del rediseño del
 * Editor de página: nunca más un panel lateral, cada campo se edita
 * tocándolo directo.
 *
 * El público NUNCA envuelve su árbol en `<HomeBlocksEditorProvider>` —
 * así que `useHomeBlocksEditor()` ahí siempre devuelve `null`, y cada
 * `Editable*` de `Editable.tsx` cae a un passthrough sin overhead
 * (sin listeners, sin wrapper extra, sin `contentEditable`): el
 * público queda pixel-por-pixel idéntico a como estaba antes de esta
 * capa. Sólo el canvas del admin (`IsolatedCanvas`/`PageEditorPage.tsx`
 * del otro repo) provee un valor real.
 *
 * Todas las escrituras viajan como un único `fieldPath` de texto (ej.
 * `"hero.title"`, `"trust_bar.item.<id>.text"`,
 * `"testimonials.<id>.rating"`) — así ninguna de las 6 vistas puras
 * necesita una prop nueva por campo ni el paquete necesita saber nada
 * de Supabase/tenants/borradores: quien arma el valor del Provider
 * (del lado del admin) es el único que interpreta esos paths. La
 * LECTURA de cada campo sigue viajando 100% por props normales, igual
 * que siempre — esta capa es sólo el canal de escritura.
 */
export interface HomeBlocksEditorHandlers {
  /**
   * Si este campo puntual se puede editar — normalmente un chequeo de
   * permisos (`can(section, 'manage')`) resuelto por quien arma el
   * Provider. `false` no oculta el campo: sólo apaga el hover/click
   * (el contenido se sigue viendo normal, de sólo lectura).
   */
  canEditField: (fieldPath: string) => boolean;
  /** Confirma un valor de texto nuevo (blur, Enter en campo de una línea, o Escape revierte antes de llamar a esto). */
  onTextCommit: (fieldPath: string, value: string) => void;
  /** Se tocó una imagen editable — el admin abre el selector de archivo + recorte y stagea al terminar. */
  onImageRequest: (fieldPath: string) => void;
  /** Se pidió quitar la imagen actual (volver a placeholder/sin imagen). Si falta, no se muestra el control de quitar. */
  onImageRemove?: (fieldPath: string) => void;
  /** Se tocó una estrella — `value` es la calificación 1-5 elegida. */
  onRatingChange: (fieldPath: string, value: number) => void;
  /** Se eligió un ícono nuevo del selector inline. */
  onIconChange: (fieldPath: string, iconName: string) => void;
  /** Duplicar una fila de una lista (Barra de confianza/¿Por qué elegirnos?). Si falta, no se muestra el botón. */
  onRowDuplicate?: (fieldPath: string) => void;
  /** Borrar una fila de una lista. Si falta, no se muestra el botón. */
  onRowDelete?: (fieldPath: string) => void;
  /** Si una lista todavía admite otra fila (tope `maxItems`) — gatea el botón "Agregar". */
  canAddRow?: (listFieldPath: string) => boolean;
  /** Agregar una fila nueva al final de una lista, con valores default razonables. */
  onRowAdd?: (listFieldPath: string) => void;
}

const HomeBlocksEditorContext = createContext<HomeBlocksEditorHandlers | null>(null);

/**
 * `null` = edición apagada (público, o cualquier consumidor que
 * todavía no envolvió su árbol en el Provider). Cada `Editable*`
 * chequea esto UNA vez y, si es `null`, se comporta como si no
 * existiera — ver el comentario grande de arriba.
 */
export function useHomeBlocksEditor(): HomeBlocksEditorHandlers | null {
  return useContext(HomeBlocksEditorContext);
}

export function HomeBlocksEditorProvider({
  value,
  children,
}: {
  value: HomeBlocksEditorHandlers;
  children: ReactNode;
}) {
  return <HomeBlocksEditorContext.Provider value={value}>{children}</HomeBlocksEditorContext.Provider>;
}