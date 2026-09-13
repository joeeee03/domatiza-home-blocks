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
  {
    href: '/servicios#inversiones',
    image: 'https://images.unsplash.com/photo-1759429084833-334282cbd58d?q=80&w=900&auto=format&fit=crop',
    alt: 'Casas en miniatura junto a dinero, inversión inmobiliaria',
    title: 'Inversiones Inmobiliarias',
  },
  {
    href: '/servicios#comercial',
    image: 'https://images.unsplash.com/photo-1551268587-2ce3185fea42?q=80&w=900&auto=format&fit=crop',
    alt: 'Edificio de oficinas con fachada de vidrio, propiedad comercial',
    title: 'Propiedades Comerciales',
  },
  {
    href: '/servicios#proyectos',
    image: 'https://images.unsplash.com/photo-1692101736757-579f547ec36a?q=80&w=900&auto=format&fit=crop',
    alt: 'Grúas de construcción sobre un edificio en desarrollo',
    title: 'Proyectos y Emprendimientos',
  },
];

export interface ServicesViewProps {
  Link: HostLinkComponent;
  Image: HostImageComponent;
}

/**
 * Etapa 23 (opcional): extracción trivial — el contenido de esta
 * sección está 100% hardcodeado (mismas 6 tarjetas para cualquier
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

        <div className="section-cta">
          <Link href="/servicios" className="btn btn-secondary">
            Ver todos los servicios
          </Link>
        </div>
      </div>
    </section>
  );
}