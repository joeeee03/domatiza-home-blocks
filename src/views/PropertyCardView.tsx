import { Layers, MessageCircle, Bed, Maximize } from 'lucide-react';
import type { HostLinkComponent, HostImageComponent } from '../host/hostTypes';
import { whatsappLink } from '../lib/whatsappLink';
import { PropertyCardImageView } from './PropertyCardImageView';
import { PropertyCardRevealView } from './PropertyCardRevealView';

export interface PropertyCardViewData {
  id: string | number;
  slug: string;
  operation: 'venta' | 'alquiler';
  title: string;
  images: string[];
  /** Ya formateado — ej. "USD 120.000". Quién sabe convertir ARS→USD según la cotización es decisión del contenedor, no de la vista. */
  priceLabel: string;
  /** Ya formateado — ej. "120 m²" / "3 ha". */
  surfaceLabel: string;
  /** `null` = el tipo de propiedad no usa este campo — no se renderiza el span, en vez de mostrar "0 amb". */
  rooms: number | null;
  bedrooms: number | null;
  /** `agent.whatsapp ?? agent.phone`, ya resuelto. `undefined` = sin botón de WhatsApp visible. */
  whatsappNumber: string | undefined;
}

export interface PropertyCardViewProps {
  property: PropertyCardViewData;
  /** Posición dentro de su grilla (0-based) — para el `transitionDelay` del fade-in y para decidir la prioridad de carga de la foto. */
  index?: number;
  Link: HostLinkComponent;
  Image: HostImageComponent;
  /**
   * REVISIÓN DE PERFORMANCE: cuántas tarjetas de la grilla cargan su
   * foto con prioridad alta (preload) en vez de lazy loading.
   *
   * Depende de DÓNDE se monta la grilla, y por eso es un prop y no una
   * constante:
   *
   *   - En el HOME ("Propiedades destacadas") el valor correcto es 0.
   *     Esa sección está bien abajo del pliegue: el LCP del Home es la
   *     foto del hero, y marcar las destacadas como prioritarias las
   *     pondría a competir contra ella, empeorando justo la métrica que
   *     se quiere mejorar.
   *
   *   - En un listado donde las tarjetas SON lo primero que se ve
   *     (/propiedades), el valor correcto es 2 o 3.
   *
   * Default 0 = el comportamiento seguro (nada prioritario).
   */
  priorityCards?: number;
}

export function PropertyCardView({
  property,
  index = 0,
  Link,
  Image,
  priorityCards = 0,
}: PropertyCardViewProps) {
  const badgeClass = property.operation === 'venta' ? 'badge-sale' : 'badge-rent';
  const badgeLabel = property.operation === 'venta' ? 'Venta' : 'Alquiler';
  const waMessage = `Hola, quiero más información sobre "${property.title}"`;
  const propertyHref = `/propiedades/${property.slug}`;

  return (
    <PropertyCardRevealView propertyId={property.id} index={index}>
      <PropertyCardImageView
        images={property.images}
        title={property.title}
        href={propertyHref}
        badgeClass={badgeClass}
        badgeLabel={badgeLabel}
        Link={Link}
        Image={Image}
        priority={index < priorityCards}
      />
      <div className="property-content">
        <div className="property-price">{property.priceLabel}</div>
        <h3>{property.title}</h3>
        <div className="property-specs">
          <span>
            <Maximize aria-hidden="true" size={16} className="property-specs-icon" /> {property.surfaceLabel}
          </span>
          {property.rooms != null && (
            <span>
              <Layers aria-hidden="true" size={16} className="property-specs-icon" /> {property.rooms} amb
            </span>
          )}
          {property.bedrooms != null && (
            <span>
              <Bed aria-hidden="true" size={16} className="property-specs-icon" /> {property.bedrooms} dorm
            </span>
          )}
        </div>
        <div className="property-actions">
          <Link href={propertyHref} className="btn btn-secondary btn-sm">
            Ver más
          </Link>
          <a
            href={whatsappLink(waMessage, property.whatsappNumber)}
            className="btn btn-whatsapp btn-sm"
            target="_blank"
            rel="noopener"
            aria-label={`Consultar por WhatsApp sobre ${property.title}`}
          >
            <MessageCircle aria-hidden="true" size={18} />
          </a>
        </div>
      </div>
    </PropertyCardRevealView>
  );
}