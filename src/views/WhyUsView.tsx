import type { HostLinkComponent } from '../host/hostTypes';
import { resolveIcon } from '../icons/resolveIcon';

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

export function WhyUsView({ items, showCta, companyName, Link }: WhyUsViewProps) {
  return (
    <section className="why-us">
      <div className="container">
        <div className="section-header">
          <h2>¿Por qué elegir {companyName}?</h2>
        </div>

        <div className="why-grid why-grid-3">
          {items.map((item) => {
            const Icon = resolveIcon(item.icon);
            return (
              <div className="why-card" key={item.id}>
                <div className="why-icon" aria-hidden="true">
                  <Icon />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            );
          })}
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
