import type { HostLinkComponent } from '../host/hostTypes';
import { EditableRow, EditableIcon, EditableText, AddRowTile } from '../editor/Editable';
import { useHomeBlocksEditor } from '../editor/EditorContext';

export interface WhyUsItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface WhyUsViewProps {
  items: WhyUsItem[];
  showCta: boolean;
  companyName: string;
  Link: HostLinkComponent;
}

/**
 * Editor inline: mismo patrón que `TrustBarView` — cada tarjeta es una
 * fila editable (`EditableRow`, azul) que envuelve el MISMO
 * `<div className="why-card">` de siempre, para no romper `.why-grid`
 * (CSS Grid). Ícono, título y descripción son campos propios adentro.
 * El título de la sección (`¿Por qué elegir {companyName}?`) NO es
 * editable acá — no tiene una columna propia en la base, es el mismo
 * texto fijo que ya mostraba el sitio.
 */
export function WhyUsView({ items, showCta, companyName, Link }: WhyUsViewProps) {
  const editor = useHomeBlocksEditor();

  return (
    <section className="why-us">
      <div className="container">
        <div className="section-header">
          <h2>¿Por qué elegir {companyName}?</h2>
        </div>

        <div className="why-grid why-grid-3">
          {items.map((item) => {
            const fieldPath = `why_us.item.${item.id}`;
            return (
              <EditableRow
                as="div"
                key={item.id}
                className="why-card"
                fieldPath={fieldPath}
                label="Fila"
                onDuplicate={editor?.onRowDuplicate ? () => editor.onRowDuplicate!(fieldPath) : undefined}
                onDelete={editor?.onRowDelete ? () => editor.onRowDelete!(fieldPath) : undefined}
              >
                <div className="why-icon" aria-hidden="true">
                  <EditableIcon fieldPath={`${fieldPath}.icon`} iconName={item.icon} label="Ícono" className="why-icon-svg" />
                </div>
                <EditableText as="h3" fieldPath={`${fieldPath}.title`} label="Título" value={item.title} placeholder="Título" />
                <EditableText
                  as="p"
                  fieldPath={`${fieldPath}.description`}
                  label="Descripción"
                  value={item.description}
                  placeholder="Descripción"
                  singleLine={false}
                />
              </EditableRow>
            );
          })}
          <AddRowTile as="div" listFieldPath="why_us.item" label="Agregar razón" />
        </div>

        {showCta && (
          <div className="section-cta">
            <Link href="/nosotros" className="btn btn-secondary">
              Conocé más sobre nosotros
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}