export interface PlaceholderSectionProps {
  /**
   * Nombre de clase REAL de la sección en el CSS compartido (ej.
   * `"services"`, `"final-cta"`) — así el placeholder hereda el mismo
   * `padding`/ancho que tendría la sección real, sin necesitar sus
   * datos, y el canvas no da un salto de layout raro entre esta
   * sección y las de al lado.
   */
  className: string;
  /** Label de la sección, tal como aparece en `sectionsConfig.ts` del admin. */
  label: string;
}

/**
 * Placeholder para Servicios, Propiedades destacadas, Herramientas,
 * Novedades del blog y CTA final (Etapa 14) — las 5 secciones del
 * Home sin contenido editable en esta fase (ver §3.1 del prompt
 * maestro). Migrarlas también al motor compartido con datos reales es
 * la Etapa 23, opcional.
 */
export function PlaceholderSection({ className, label }: PlaceholderSectionProps) {
  return (
    <section className={className}>
      <div className="container">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '160px',
            border: '1px dashed currentColor',
            borderRadius: '8px',
            opacity: 0.5,
            padding: '2rem 1rem',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            {label} — esta sección no tiene contenido editable en el editor visual.
          </p>
        </div>
      </div>
    </section>
  );
}
