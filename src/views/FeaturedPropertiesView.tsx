import type { HostLinkComponent, HostImageComponent } from '../host/hostTypes';
import { PropertyCardView, type PropertyCardViewData } from './PropertyCardView';

export interface FeaturedPropertiesViewProps {
  properties: PropertyCardViewData[];
  Link: HostLinkComponent;
  Image: HostImageComponent;
}

export function FeaturedPropertiesView({ properties, Link, Image }: FeaturedPropertiesViewProps) {
  return (
    <section className="featured">
      <div className="container">
        <div className="section-header">
          <h2>Propiedades destacadas</h2>
          <p className="section-subtitle">
            Una selección de lo último que sumamos al catálogo. Precios siempre en USD.
          </p>
        </div>

        <div className="properties-grid" aria-live="polite">
          {properties.map((property, index) => (
            <PropertyCardView key={property.id} property={property} index={index} Link={Link} Image={Image} />
          ))}
        </div>

        <div className="section-cta">
          <Link href="/propiedades" className="btn btn-secondary">
            Ver todo el catálogo
          </Link>
        </div>
      </div>
    </section>
  );
}
