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
  /** `null` = el tipo de propiedad no usa este campo (ver Ambientes/Dormitorios en la especificación de tipos) — no se renderiza el span, en vez de mostrar "0 amb". Quién decide null vs. número es el contenedor, esta vista solo confía en lo que le pasan. */
  rooms: number | null;
  bedrooms: number | null;
  /** `agent.whatsapp ?? agent.phone`, ya resuelto. `undefined` = sin botón de WhatsApp visible en la tarjeta (no debería pasar en la práctica, pero la vista no asume que siempre hay). */
  whatsappNumber: string | undefined;
}

export interface PropertyCardViewProps {
  property: PropertyCardViewData;
  /** Posición dentro de su grilla (0-based) — sólo para el `transitionDelay` del fade-in, ver `PropertyCardRevealView.tsx`. */
  index?: number;
  Link: HostLinkComponent;
  Image: HostImageComponent;
}

export function PropertyCardView({ property, index = 0, Link, Image }: PropertyCardViewProps) {
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