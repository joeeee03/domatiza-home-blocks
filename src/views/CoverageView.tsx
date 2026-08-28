import { MapPin } from 'lucide-react';
import type { HostLinkComponent } from '../host/hostTypes';

export interface CoverageLocation {
  value: string;
  label: string;
}

export interface CoverageViewProps {
  text: string;
  locations: CoverageLocation[];
  Link: HostLinkComponent;
}

export function CoverageView({ text, locations, Link }: CoverageViewProps) {
  return (
    <section className="coverage">
      <div className="container">
        <div className="section-header">
          <h2>Operamos en toda la región</h2>
          <p className="section-subtitle">{text}</p>
        </div>
        {locations.length > 0 && (
          <ul className="coverage-list">
            {locations.map((location) => (
              <li key={location.value}>
                <MapPin aria-hidden="true" /> {location.label}
              </li>
            ))}
          </ul>
        )}
        <div className="coverage-cta">
          <Link href="/propiedades" className="btn btn-primary">
            Ver catálogo de propiedades
          </Link>
        </div>
      </div>
    </section>
  );
}
