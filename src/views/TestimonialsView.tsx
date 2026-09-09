import type { HostImageComponent } from '../host/hostTypes';
import { EditableRating, EditableText, EditableImageSlot } from '../editor/Editable';
import { useHomeBlocksEditor } from '../editor/EditorContext';

export interface TestimonialsViewItem {
  id: string;
  name: string;
  role: string | null;
  content: string;
  rating: number | null;
  photoUrl: string | null;
}

export interface TestimonialsViewProps {
  testimonials: TestimonialsViewItem[];
  Image: HostImageComponent;
}

/**
 * Los 3 testimonios son filas fijas (no se agregan ni se borran desde
 * acá, ver `TestimonialsSectionPanel.tsx` viejo) — por eso ningún
 * `EditableRow` alrededor de la tarjeta, sólo campos sueltos: foto,
 * calificación, texto, nombre y rol/servicio.
 */
export function TestimonialsView({ testimonials, Image }: TestimonialsViewProps) {
  const editor = useHomeBlocksEditor();

  return (
    <section className="testimonials">
      <div className="container">
        <div className="section-header">
          <h2>Lo que dicen quienes ya operaron con nosotros</h2>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((testimonial) => {
            const fieldPath = `testimonials.${testimonial.id}`;
            return (
              <div className="testimonial-card" key={testimonial.id}>
                <EditableRating fieldPath={`${fieldPath}.rating`} value={testimonial.rating} label="Calificación" />
                {/* Las comillas van por CSS (`.testimonial-quote::before/::after`
                    en 15-testimonials.css), nunca como texto literal acá.
                    Motivo: en el admin, `EditableText` con `as="span"` +
                    `singleLine={false}` fuerza `display:inline-block` sobre
                    el propio span (fix del contorno del overlay, ver
                    `Editable.tsx`) para que el testimonio pueda envolver en
                    varias líneas. Ese span pasa a ocupar casi todo el ancho
                    de la tarjeta, así que si las comillas quedan como
                    HERMANAS de afuera (texto suelto en este `<p>`), el
                    navegador no tiene lugar para ellas en la misma línea y
                    manda cada una a su propia línea (apertura sola arriba,
                    cierre sola abajo) — se ve distinto que en el público,
                    donde ese mismo span es simplemente inline. Puestas como
                    `::before`/`::after` DEL PROPIO span quedan siempre
                    pegadas al primer/último carácter del texto (público Y
                    admin), y sin tocar el valor guardado: el contenido
                    generado por CSS nunca forma parte de `.innerText`, que
                    es lo que lee/escribe `EditableText` al confirmar. */}
                <p className="testimonial-text">
                  <EditableText
                    as="span"
                    className="testimonial-quote"
                    fieldPath={`${fieldPath}.content`}
                    label="Testimonio"
                    value={testimonial.content}
                    placeholder="Escribir testimonio…"
                    singleLine={false}
                  />
                </p>
                <div className="testimonial-author">
                  <EditableImageSlot
                    fieldPath={`${fieldPath}.photo`}
                    label="Foto"
                    hasImage={!!testimonial.photoUrl}
                    compact
                    wrapperStyle={{ display: 'inline-flex', flexShrink: 0, borderRadius: '9999px', overflow: 'hidden' }}
                  >
                    <Image
                      src={testimonial.photoUrl || '/images/property-placeholder.svg'}
                      alt=""
                      className="author-avatar"
                      width={48}
                      height={48}
                    />
                  </EditableImageSlot>
                  <div className="testimonial-author-info">
                    <EditableText
                      as="span"
                      className="author-name"
                      fieldPath={`${fieldPath}.name`}
                      label="Nombre"
                      value={testimonial.name}
                      placeholder="Nombre"
                    />
                    {/* Igual que antes: sin editor activo (público) y sin rol
                        cargado, no se renderiza nada — nunca un
                        `<span className="author-type">` vacío. Con el editor
                        activo sí se muestra (aunque esté vacío) para poder
                        tocarlo y cargar uno. */}
                    {(editor || testimonial.role) && (
                      <EditableText
                        as="span"
                        className="author-type"
                        fieldPath={`${fieldPath}.role`}
                        label="Servicio"
                        value={testimonial.role ?? ''}
                        placeholder="Servicio (opcional)"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}