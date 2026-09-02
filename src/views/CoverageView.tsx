import { MapPin } from 'lucide-react';
import type { HostLinkComponent } from '../host/hostTypes';
import { EditableText } from '../editor/Editable';

export interface CoverageLocation {
  value: string;
  label: string;
}

export interface CoverageViewProps {
  text: string;
  locations: CoverageLocation[];
  Link: HostLinkComponent;
}

/**
 * Editor inline: sólo el párrafo de texto tiene un campo editable acá
 * (`coverage.text`) — el título fijo ("Operamos en toda la región") y
 * la lista de localidades no se tocan desde este editor (las
 * localidades se administran aparte, en /localidades, tal como ya
 * aclaraba el drawer viejo).
 */
export function CoverageView({ text, locations, Link }: CoverageViewProps) {
  return (
    <section className="coverage">
      <div className="container">
        <div className="section-header">
          <h2>Operamos en toda la región</h2>
          <EditableText
            as="p"
            className="section-subtitle"
            fieldPath="coverage.text"
            label="Texto"
            value={text}
            placeholder="Texto de la sección"
            singleLine={false}
          />
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