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
                {/* Las comillas quedan afuera del campo editable a propósito
                    (texto fijo, no forman parte del valor guardado) — así
                    no hay que sacarlas/volver a ponerlas cada vez que se
                    lee/escribe `.innerText` en `EditableText`. */}
                <p className="testimonial-text">
                  &quot;
                  <EditableText
                    as="span"
                    fieldPath={`${fieldPath}.content`}
                    label="Testimonio"
                    value={testimonial.content}
                    placeholder="Escribir testimonio…"
                    singleLine={false}
                  />
                  &quot;
                </p>
                <div className="testimonial-author">
                  <EditableImageSlot
                    fieldPath={`${fieldPath}.photo`}
                    label="Foto"
                    hasImage={!!testimonial.photoUrl}
                    wrapperStyle={{ display: 'inline-flex', flexShrink: 0 }}
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