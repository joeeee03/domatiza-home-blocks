'use client';

import { useRef, useState, type CSSProperties, type MouseEvent, type TouchEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HostLinkComponent, HostImageComponent } from '../host/hostTypes';

interface PropertyCardImageViewProps {
  images: string[];
  title: string;
  href: string;
  badgeClass: string;
  badgeLabel: string;
  Link: HostLinkComponent;
  Image: HostImageComponent;
}

// Mismo `sizes` en la imagen visible y en las precargas ocultas de
// abajo, para que generen la misma URL optimizada y el navegador
// reutilice la respuesta ya cacheada al tocar una flecha.
const CARD_IMAGE_SIZES = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';

// Wrapper "visualmente oculto" para las precargas: 1x1px reales (no
// 0x0) + clip, para que next/image `fill` tenga una caja con tamaño
// definido (evita el warning de Next en dev: "has fill and a height
// value of 0") y siga sin verse ni ocupar espacio en la tarjeta.
const PRELOAD_WRAPPER_STYLE: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  clipPath: 'inset(50%)',
  pointerEvents: 'none',
};

/**
 * Navegación de fotos dentro de la tarjeta (flechas prev/next sin
 * salir del listado) — la única parte de `PropertyCardView` que
 * necesita estado, por eso vive en su propio Client Component chico
 * (mismo patrón que `SearchFormView`), en vez de convertir toda la
 * tarjeta en cliente.
 *
 * Etapa 23 (opcional): en el canvas del admin, las flechas funcionan
 * igual (es JS de verdad, no hace falta el `onClickCapture` del borde
 * del canvas para esto — sólo intercepta que NO navegue de verdad,
 * cosa que este componente ya hace solo con `preventDefault`).
 */
export function PropertyCardImageView({ images, title, href, badgeClass, badgeLabel, Link, Image }: PropertyCardImageViewProps) {
  const [index, setIndex] = useState(0);
  const hasMultipleImages = images.length > 1;
  const total = images.length;
  const currentImage = images[index] ?? images[0] ?? '/images/property-placeholder.svg';

  function goPrev(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i - 1 + total) % total);
  }

  function goNext(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + 1) % total);
  }

  // Swipe horizontal en touch, ADICIONAL a las flechas (que siguen
  // intactas para teclado/switch/mouse) — mismo criterio que se repite
  // en PropertyGallery.tsx (Capa 4): sólo lee posiciones de touch, nunca
  // llama preventDefault, así el listener queda pasivo por defecto y el
  // scroll vertical de la página nunca se bloquea. Sólo se interpreta
  // como swipe si el desplazamiento horizontal domina claramente sobre
  // el vertical y supera un umbral mínimo, para no dispararse por error
  // durante un scroll normal de la lista.
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const SWIPE_THRESHOLD = 45;

  function handleTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e: TouchEvent) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || !hasMultipleImages) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const deltaX = t.clientX - start.x;
    const deltaY = t.clientY - start.y;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    if (deltaX < 0) {
      setIndex((i) => (i + 1) % total);
    } else {
      setIndex((i) => (i - 1 + total) % total);
    }
  }

  // Precarga la foto anterior y la siguiente a la actual — sin esto,
  // la primera vez que se toca una flecha se nota el arranque de la
  // descarga. Con varias tarjetas en el listado, cada una precarga
  // sólo sus dos vecinas (no toda la galería), así que el costo extra
  // de red es mínimo.
  const prevImage = hasMultipleImages ? images[(index - 1 + total) % total] : null;
  const nextImage = hasMultipleImages ? images[(index + 1) % total] : null;

  return (
    <div
      className="property-image"
      style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <span className={`property-badge ${badgeClass}`}>{badgeLabel}</span>
      <Link
        href={href}
        className="property-image-link"
        aria-label={`Ver detalles de ${title}`}
        style={{ position: 'relative', display: 'block', width: '100%', height: '100%' }}
      >
        <Image src={currentImage} alt={title} fill sizes={CARD_IMAGE_SIZES} style={{ objectFit: 'cover' }} />
      </Link>

      {/* Precargas invisibles (0x0, fuera de flujo): no se ven, sólo
          calientan la caché para que las flechas de la tarjeta se
          sientan instantáneas. */}
      {prevImage && prevImage !== currentImage && (
        <div aria-hidden="true" style={PRELOAD_WRAPPER_STYLE}>
          <Image src={prevImage} alt="" fill sizes={CARD_IMAGE_SIZES} loading="eager" />
        </div>
      )}
      {nextImage && nextImage !== currentImage && nextImage !== prevImage && (
        <div aria-hidden="true" style={PRELOAD_WRAPPER_STYLE}>
          <Image src={nextImage} alt="" fill sizes={CARD_IMAGE_SIZES} loading="eager" />
        </div>
      )}

      {hasMultipleImages && (
        <div className="property-image-nav">
          <button type="button" className="property-image-nav-btn property-image-nav-prev" aria-label="Imagen anterior" onClick={goPrev}>
            <ChevronLeft aria-hidden="true" size={18} className="property-image-nav-icon" />
          </button>
          <button type="button" className="property-image-nav-btn property-image-nav-next" aria-label="Imagen siguiente" onClick={goNext}>
            <ChevronRight aria-hidden="true" size={18} className="property-image-nav-icon" />
          </button>
        </div>
      )}
    </div>
  );
}