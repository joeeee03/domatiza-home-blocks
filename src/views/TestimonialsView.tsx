import { Star } from 'lucide-react';
import type { HostImageComponent } from '../host/hostTypes';

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

export function TestimonialsView({ testimonials, Image }: TestimonialsViewProps) {
  return (
    <section className="testimonials">
      <div className="container">
        <div className="section-header">
          <h2>Lo que dicen quienes ya operaron con nosotros</h2>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((testimonial) => (
            <div className="testimonial-card" key={testimonial.id}>
              {testimonial.rating !== null && (
                <div
                  className="testimonial-rating"
                  role="img"
                  aria-label={`Calificación: ${testimonial.rating} de 5 estrellas`}
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={i < (testimonial.rating ?? 0) ? 'star-filled' : 'star-empty'}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              )}
              <p className="testimonial-text">&quot;{testimonial.content}&quot;</p>
              <div className="testimonial-author">
                <Image
                  src={testimonial.photoUrl || '/images/property-placeholder.svg'}
                  alt=""
                  className="author-avatar"
                  width={48}
                  height={48}
                />
                <div className="testimonial-author-info">
                  <span className="author-name">{testimonial.name}</span>
                  {testimonial.role && <span className="author-type">{testimonial.role}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
