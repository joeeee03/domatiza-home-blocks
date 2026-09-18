import {
  Layers,
  MessageCircle,
  Bed,
  Maximize,
  Home,
  Trees,
  Building2,
  Building,
  Store,
  Briefcase,
  Map,
  Tractor,
  Warehouse,
  Car,
  ShoppingCart,
  Landmark,
  Tag,
  Bath,
  Ruler,
  Sprout,
  Zap,
  Umbrella,
  Key,
  Star,
  DollarSign,
  MapPin,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
  /**
   * `null` = el tipo de propiedad no usa este campo — no se renderiza el span, en vez de mostrar "0 amb".
   *
   * BUGFIX (specs duplicados en el Home): para los tipos con ambientes/
   * dormitorios, `specs` (ver más abajo) ya los incluye — abreviados
   * ("Amb."/"Dorm.") y junto con baños/cochera, que estos dos campos
   * nunca cubrieron. Cuando el contenedor manda ambas cosas (como hace
   * hoy `FeaturedProperties.tsx` en PUBLIC), `rooms`/`bedrooms` quedan
   * como fallback y el render los ignora (ver `cardSpecs.length === 0`
   * más abajo) para no mostrar "Amb."/"Dorm." dos veces en la misma
   * card. Sólo se siguen renderizando de verdad cuando el contenedor
   * NO manda `specs` — hoy, el canvas del editor de ADMIN.
   */
  rooms: number | null;
  bedrooms: number | null;
  /** `agent.whatsapp ?? agent.phone`, ya resuelto. `undefined` = sin botón de WhatsApp visible. */
  whatsappNumber: string | undefined;
  /**
   * TARJETAS-4 — tipo + ubicación de la propiedad, ya resueltos por el
   * contenedor (mismo criterio que priceLabel/surfaceLabel: esta vista
   * no decide type→label ni type→ícono, sólo confía en lo que le
   * pasan). `typeIconName` viaja como STRING (nombre de componente
   * lucide-react, ej. "Home") en vez de componente ya resuelto porque
   * esta interfaz vive en un paquete compartido — se resuelve acá
   * abajo con un Record local (ver `ICON_MAP`).
   *
   * OPCIONALES A PROPÓSITO: el canvas del editor de páginas del ADMIN
   * (`fetchFeaturedPropertiesForCanvas()`, `publicSectionsApi.ts`)
   * arma su propio `PropertyCardViewData` con una query aparte a
   * Supabase, en otro repo que no puede importar nada de PUBLIC. Si
   * estos campos fueran obligatorios, el build de ADMIN se rompería
   * apenas actualizara su copia de este paquete, sin que esta capa
   * haya tocado una sola línea de ADMIN. Con `?`, ADMIN sigue
   * compilando tal cual está: el canvas simplemente no muestra
   * todavía tipo/ubicación/specs/"Destacada" (queda para cuando
   * alguien actualice ese fetcher — fuera de alcance acá).
   */
  locationLabel?: string | null;
  featured?: boolean;
  /** Tipo de propiedad (ej. "Casa"). Se muestra como chip sobre la foto, al lado del badge de Venta/Alquiler (ya no debajo del título). */
  typeLabel?: string | null;
  /** Ya no se renderiza (el chip de tipo sobre la foto es sólo texto). Se mantiene en la interfaz para no romper a los contenedores que todavía lo mandan (PUBLIC, `FeaturedProperties.tsx`). */
  typeIconName?: string | null;
  /** Specs compactos ya resueltos (ver `PropertyCardSpec` en format.ts de PUBLIC), mismo criterio de ícono-como-string. */
  specs?: Array<{ iconName: string; value: string; label: string }>;
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

/**
 * TARJETAS-4 — resuelve un nombre de ícono lucide-react (string, ej.
 * "Home", "Bath", "MapPin") al componente real. Cubre tanto el
 * vocabulario de `typeIconName` (13 tipos + fallback "Tag") como el de
 * `specs[].iconName` (ver `SPEC_ICON_LUCIDE_NAMES` en el format.ts de
 * PUBLIC) — mismos 24 nombres en total, un solo Record para no
 * mantener dos mapas. Fallback `Tag` para cualquier nombre
 * desconocido/null, igual que el resto de esta capa.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Trees,
  Building2,
  Building,
  Store,
  Briefcase,
  Map,
  Tractor,
  Warehouse,
  Car,
  ShoppingCart,
  Bed,
  Landmark,
  Tag,
  Maximize,
  Layers,
  Bath,
  Ruler,
  Sprout,
  Zap,
  Umbrella,
  Key,
  Star,
  DollarSign,
};

function resolveIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Tag;
  return ICON_MAP[name] ?? Tag;
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

  // TARJETAS-4 — mismos datos que PropertyCard.tsx (PUBLIC), ya
  // resueltos por el contenedor.
  const locationLabel = property.locationLabel ?? null;
  const typeLabel = property.typeLabel ?? null;
  const cardSpecs = property.specs ?? [];

  return (
    <PropertyCardRevealView propertyId={property.id} index={index}>
      <PropertyCardImageView
        images={property.images}
        title={property.title}
        href={propertyHref}
        badgeClass={badgeClass}
        badgeLabel={badgeLabel}
        typeLabel={typeLabel}
        Link={Link}
        Image={Image}
        priority={index < priorityCards}
      />
      <div className="property-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="property-price">{property.priceLabel}</div>
          {property.featured && (
            <span className="property-featured-tag">
              <Star aria-hidden="true" size={14} fill="currentColor" />
              Destacada
            </span>
          )}
        </div>
        <h3>{property.title}</h3>
        {locationLabel && (
          <div className="property-meta">
            <span>
              <MapPin aria-hidden="true" size={16} className="property-specs-icon" />
              {locationLabel}
            </span>
          </div>
        )}
        <div className="property-specs">
          <span>
            <Maximize aria-hidden="true" size={16} className="property-specs-icon" /> {property.surfaceLabel}
          </span>
          {/* BUGFIX: sólo se usa este fallback si el contenedor no mandó
              `specs` (ver comentario en la interfaz, arriba) — si mandó
              `specs`, ya viene con Amb./Dorm./Baños/Coch. incluidos y
              renderizar esto también los duplicaba en pantalla. */}
          {cardSpecs.length === 0 && property.rooms != null && (
            <span>
              <Layers aria-hidden="true" size={16} className="property-specs-icon" /> {property.rooms} amb
            </span>
          )}
          {cardSpecs.length === 0 && property.bedrooms != null && (
            <span>
              <Bed aria-hidden="true" size={16} className="property-specs-icon" /> {property.bedrooms} dorm
            </span>
          )}
          {cardSpecs.map((spec) => {
            const SpecIcon = resolveIcon(spec.iconName);
            return (
              <span key={spec.label}>
                <SpecIcon aria-hidden="true" size={16} className="property-specs-icon" /> {spec.value} {spec.label}
              </span>
            );
          })}
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