import { EditableRow, EditableIcon, EditableText, AddRowTile } from '../editor/Editable';
import { useHomeBlocksEditor } from '../editor/EditorContext';

export interface TrustBarItem {
  id: string;
  icon: string;
  text: string;
}

export interface TrustBarViewProps {
  items: TrustBarItem[];
}

/**
 * El contenedor (`TrustBar.tsx`) decide si esta sección se monta o no
 * (visibilidad + "sin ítems no hay sección") — la vista pura no
 * necesita saber nada de eso, sólo dibuja lo que le pasan. Si algún
 * día conviene mostrar la sección igual con la lista vacía (ej. en el
 * canvas del admin, para no tener un salto de layout raro), eso se
 * decide del lado del contenedor/canvas, no acá.
 *
 * Editor inline: cada ítem es una fila editable (`EditableRow`, azul,
 * duplicar/eliminar) que envuelve el MISMO `<div className="trust-item">`
 * de siempre — nunca un wrapper nuevo, para no romper `.trust-items`
 * (CSS Grid: cada tarjeta tiene que seguir siendo hija directa). Adentro,
 * ícono y texto son campos propios (`EditableIcon`/`EditableText`,
 * naranja). Al final de la grilla, una tarjeta fantasma para agregar un
 * ítem nuevo — sólo aparece si `editor.onRowAdd` existe y todavía no se
 * llegó al tope de ítems (lo resuelve `editor.canAddRow`, del lado del
 * admin). Sin Provider (público) todo esto cae a exactamente el JSX de
 * siempre.
 */
export function TrustBarView({ items }: TrustBarViewProps) {
  const editor = useHomeBlocksEditor();

  return (
    <section className="trust-bar">
      <div className="container">
        <div className="trust-items">
          {items.map((item) => {
            const fieldPath = `trust_bar.item.${item.id}`;
            return (
              <EditableRow
                as="div"
                key={item.id}
                className="trust-item"
                fieldPath={fieldPath}
                label="Fila"
                onDuplicate={editor?.onRowDuplicate ? () => editor.onRowDuplicate!(fieldPath) : undefined}
                onDelete={editor?.onRowDelete ? () => editor.onRowDelete!(fieldPath) : undefined}
              >
                <EditableIcon fieldPath={`${fieldPath}.icon`} iconName={item.icon} label="Ícono" />
                <EditableText as="span" fieldPath={`${fieldPath}.text`} label="Texto" value={item.text} placeholder="Texto" />
              </EditableRow>
            );
          })}
          <AddRowTile as="div" listFieldPath="trust_bar.item" label="Agregar ítem" />
        </div>
      </div>
    </section>
  );
}