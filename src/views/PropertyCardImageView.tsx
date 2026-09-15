'use client';

import { useRef, useState, type CSSProperties, type MouseEvent, type TouchEvent, type TransitionEvent } from 'react';
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

const CARD_IMAGE_SIZES = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';

const SLIDE_STYLE: CSSProperties = {
  position: 'relative',
  width: 'calc(100% / 3)',
  height: '100%',
  flexShrink: 0,
  flexGrow: 0,
};

const AXIS_LOCK_THRESHOLD = 8;
const SWIPE_THRESHOLD = 45;

/**
 * Navegación de fotos dentro de la tarjeta (flechas prev/next sin salir
 * del listado, más swipe táctil) — la única parte de `PropertyCardView`
 * que necesita estado, por eso vive en su propio Client Component chico
 * (mismo patrón que `SearchFormView`).
 *
 * El swipe sólo existe en pantallas táctiles (con mouse/trackpad no se
 * dispara ningún handler de touch) y convive con las flechas sin
 * reemplazarlas: las flechas cambian de foto al instante, sin animación;
 * el swipe arrastra visualmente la foto detrás del dedo y sólo se anima
 * al soltar.
 *
 * Para que el swipe horizontal no quede "peleando" con el scroll
 * vertical de la lista (el problema reportado — antes sólo se miraba el
 * gesto completo en `touchend`, sin feedback visual durante el
 * arrastre, así que un dedo con algo de deriva vertical rompía el
 * swipe):
 *  1. `touchAction: 'pan-y'` en el contenedor le dice al navegador que
 *     el scroll vertical con el dedo lo sigue resolviendo él mismo de
 *     forma nativa, pero que NO reserve el gesto horizontal para
 *     scrollear — así un swipe horizontal no compite con la decisión de
 *     scroll del navegador y responde al instante, sin lag inicial.
 *  2. En JS, los primeros píxeles de cada toque deciden el eje del
 *     gesto (`AXIS_LOCK_THRESHOLD`): si domina el vertical, no se toca
 *     la posición de la tarjeta y se deja que el scroll nativo (punto
 *     1) haga lo suyo; si domina el horizontal, recién ahí la tarjeta
 *     empieza a seguir al dedo 1 a 1 (`dragX`).
 * Nunca se llama a `preventDefault`, así el listener queda pasivo (sin
 * warnings de React) y el scroll de la página nunca se bloquea.
 *
 * Implementación del arrastre: un "track" flex de 3 fotos (anterior /
 * actual / siguiente, cada una 1/3 del ancho del track) que se traduce
 * con `translateX`. En reposo muestra la del medio; mientras se arrastra,
 * `dragX` (px) se suma a esa posición para que siga al dedo sin demora.
 * Al soltar: si el gesto superó `SWIPE_THRESHOLD`, se anima el resto del
 * camino hasta el borde (con transición CSS, activada sólo en ese
 * momento vía `isAnimating`) y al terminar la animación (`onTransitionEnd`)
 * recién ahí cambia el `index` y la posición vuelve al centro sin
 * transición — la foto del borde que se ve en ese instante es la misma
 * que pasa a ser la del centro, así que el cambio es invisible (el
 * truco clásico del carrusel infinito). Si no superó el umbral, se anima
 * de vuelta al centro sin cambiar de foto.
 */
export function PropertyCardImageView({ images, title, href, badgeClass, badgeLabel, Link, Image }: PropertyCardImageViewProps) {
  const [index, setIndex] = useState(0);
  const hasMultipleImages = images.length > 1;
  const total = images.length;
  const currentImage = images[index] ?? images[0] ?? '/images/property-placeholder.svg';
  const prevImage = hasMultipleImages ? images[(index - 1 + total) % total] ?? currentImage : currentImage;
  const nextImage = hasMultipleImages ? images[(index + 1) % total] ?? currentImage : currentImage;

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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchRef = useRef<{ x: number; y: number; axis: 'x' | 'y' | null } | null>(null);
  const pendingDirRef = useRef<0 | 1 | -1>(0);
  const [dragX, setDragX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  function handleTouchStart(e: TouchEvent) {
    if (!hasMultipleImages) return;
    const t = e.touches[0];
    if (!t) return;
    touchRef.current = { x: t.clientX, y: t.clientY, axis: null };
    pendingDirRef.current = 0;
    setIsAnimating(false);
  }

  function handleTouchMove(e: TouchEvent) {
    const state = touchRef.current;
    const t = e.touches[0];
    if (!state || !t) return;
    const deltaX = t.clientX - state.x;
    const deltaY = t.clientY - state.y;
    if (state.axis === null) {
      if (Math.abs(deltaX) < AXIS_LOCK_THRESHOLD && Math.abs(deltaY) < AXIS_LOCK_THRESHOLD) return;
      state.axis = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y';
    }
    if (state.axis !== 'x') return;
    setDragX(deltaX);
  }

  function handleTouchEnd(e: TouchEvent) {
    const state = touchRef.current;
    touchRef.current = null;
    if (!state || state.axis !== 'x') {
      setDragX(0);
      return;
    }
    const t = e.changedTouches[0];
    const deltaX = t ? t.clientX - state.x : 0;
    setIsAnimating(true);
    if (Math.abs(deltaX) >= SWIPE_THRESHOLD) {
      const width = containerRef.current?.offsetWidth ?? 0;
      if (deltaX < 0) {
        pendingDirRef.current = 1;
        setDragX(-width);
      } else {
        pendingDirRef.current = -1;
        setDragX(width);
      }
    } else {
      pendingDirRef.current = 0;
      setDragX(0);
    }
  }

  function handleTrackTransitionEnd(e: TransitionEvent<HTMLDivElement>) {
    if (e.propertyName !== 'transform') return;
    const dir = pendingDirRef.current;
    pendingDirRef.current = 0;
    if (dir !== 0) {
      setIndex((i) => (dir === 1 ? (i + 1) % total : (i - 1 + total) % total));
    }
    setDragX(0);
    setIsAnimating(false);
  }

  return (
    <div
      ref={containerRef}
      className="property-image"
      style={{
        position: 'relative',
        aspectRatio: '16/9',
        overflow: 'hidden',
        touchAction: hasMultipleImages ? 'pan-y' : undefined,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <span className={`property-badge ${badgeClass}`}>{badgeLabel}</span>
      <Link
        href={href}
        className="property-image-link"
        aria-label={`Ver detalles de ${title}`}
        style={{ position: 'relative', display: 'block', width: '100%', height: '100%', overflow: 'hidden' }}
      >
        {hasMultipleImages ? (
          <div
            className="property-image-track"
            onTransitionEnd={handleTrackTransitionEnd}
            style={{
              display: 'flex',
              width: '300%',
              height: '100%',
              transform: `translateX(calc(-100% / 3 + ${dragX}px))`,
              transition: isAnimating ? 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
              willChange: 'transform',
            }}
          >
            <div style={SLIDE_STYLE} aria-hidden="true">
              <Image src={prevImage} alt="" fill sizes={CARD_IMAGE_SIZES} style={{ objectFit: 'cover' }} loading="eager" />
            </div>
            <div style={SLIDE_STYLE}>
              <Image src={currentImage} alt={title} fill sizes={CARD_IMAGE_SIZES} style={{ objectFit: 'cover' }} />
            </div>
            <div style={SLIDE_STYLE} aria-hidden="true">
              <Image src={nextImage} alt="" fill sizes={CARD_IMAGE_SIZES} style={{ objectFit: 'cover' }} loading="eager" />
            </div>
          </div>
        ) : (
          <Image src={currentImage} alt={title} fill sizes={CARD_IMAGE_SIZES} style={{ objectFit: 'cover' }} />
        )}
      </Link>

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