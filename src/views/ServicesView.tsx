import type { HostLinkComponent, HostImageComponent } from '../host/hostTypes';

const SERVICES = [
  {
    href: '/propiedades?tipo=venta',
    image: 'https://images.unsplash.com/photo-1758448756207-54505680d130?q=80&w=900&auto=format&fit=crop',
    alt: 'Fachada de una casa moderna en venta',
    title: 'Venta de Propiedades',
  },
  {
    href: '/propiedades?tipo=alquiler',
    image: 'https://images.unsplash.com/photo-1722487631997-cf1e0f92c2c4?q=80&w=900&auto=format&fit=crop',
    alt: 'Persona sosteniendo las llaves de una propiedad en alquiler',
    title: 'Alquiler de Propiedades',
  },
  {
    href: '/tasar-propiedad',
    image: 'https://images.unsplash.com/photo-1728825445493-1a6e89164511?q=80&w=900&auto=format&fit=crop',
    alt: 'Calculadora y maqueta de casa sobre un escritorio, tasación de propiedades',
    title: 'Tasaciones',
  },
];

export interface ServicesViewProps {
  Link: HostLinkComponent;
  Image: HostImageComponent;
}

/**
 * Etapa 23 (opcional): extracción trivial — el contenido de esta
 * sección está 100% hardcodeado (mismas 3 tarjetas para cualquier
 * tenant), así que la vista no recibe ninguna prop de datos, sólo la
 * capa de adaptación de host.
 */
export function ServicesView({ Link, Image }: ServicesViewProps) {
  return (
    <section className="services">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Nuestros servicios</span>
          <h2>Todo lo que necesitás para tu próxima operación inmobiliaria</h2>
        </div>

        <div className="services-grid">
          {SERVICES.map((service) => (
            <Link className="service-card" href={service.href} key={service.title} style={{ position: 'relative' }}>
              <Image
                className="service-card-bg"
                src={service.image}
                alt={service.alt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'cover' }}
              />
              <div className="service-card-content">
                <h3>{service.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}