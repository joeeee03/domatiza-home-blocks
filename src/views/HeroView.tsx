import type { HostLinkComponent } from '../host/hostTypes';
import { SearchFormView } from './SearchFormView';

export interface HeroViewProps {
  title: string;
  subtitle: string;
  imageUrl: string | null;
  Link: HostLinkComponent;
}

/**
 * Si no hay `imageUrl` (el tenant no personalizó la imagen), no se
 * pisa el `background` inline y queda el definido en `07-hero.css` —
 * mismo criterio que tenía el contenedor original: no duplicar un
 * valor por defecto en dos lugares.
 */
export function HeroView({ title, subtitle, imageUrl, Link }: HeroViewProps) {
  return (
    <section className="hero">
      <div
        className="hero-background"
        style={
          imageUrl
            ? {
                background: `linear-gradient(180deg, rgba(13, 55, 51, 0.78) 0%, rgba(13, 55, 51, 0.5) 40%, rgba(13, 55, 51, 0.72) 100%), url('${imageUrl}') center/cover no-repeat`,
              }
            : undefined
        }
      ></div>
      <div className="container">
        <div className="hero-content">
          <h1>{title}</h1>
          <p className="hero-subtitle">{subtitle}</p>

          <SearchFormView />

          <div className="hero-cta">
            <Link href="/tasar-propiedad" className="btn btn-tertiary">
              Tasá tu propiedad gratis
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
