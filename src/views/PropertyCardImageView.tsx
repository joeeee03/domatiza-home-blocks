'use client';

import { useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type TouchEvent, type TransitionEvent } from 'react';
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

const AXIS_LOCK_THRESHOLD = 8;
const SWIPE_DISTANCE_THRESHOLD = 40;
const SWIPE_VELOCITY_THRESHOLD = 0.5; // px/ms — flick corto y rápido, aunque no llegue a la distancia mínima
const MIN_FLICK_DISTANCE = 12; // evita que un toque tembloroso/tap cuente como flick por velocidad
const TRANSITION_MS = 190;
const TRANSITION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

const SLIDE_BASE_STYLE: CSSProperties = {
  position: 'relative',
  height: '100%',
  flexShrink: 0,
  flexGrow: 0,
};

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
 *
 * BUGFIX (Sep 2026, v2): seguía quedando un hilo de la foto siguiente
 * asomando del lado derecho al terminar de deslizar. La causa: el ancho
 * de cada foto (`width: calc(100% / 3)`) y el desplazamiento del track
 * (`translateX(calc(-100% / 3))`) son dos porcentajes que, en teoría,
 * salen del mismo cálculo — pero el motor de layout redondea el ancho
 * de cada slide al pixel de dispositivo más cercano para que la grilla
 * de la pantalla quede nítida, mientras que `transform` interpola en
 * punto flotante sin ese mismo redondeo. Con anchos de tarjeta que no
 * son múltiplos exactos de 3 (la gran mayoría), esos dos redondeos no
 * coinciden y dejan un hueco de uno o dos píxeles con la foto siguiente
 * asomando — más notorio al terminar de deslizar porque ahí la tarjeta
 * queda quieta y el ojo lo detecta.
 *
 * La solución definitiva: dejar de calcular en porcentaje y medir el
 * ancho real del contenedor en píxeles (`slideWidth`, vía
 * `ResizeObserver`) una única vez por tamaño de pantalla, y usar ESE
 * MISMO NÚMERO tanto para el ancho de cada foto como para el
 * desplazamiento del track. Al ser literalmente el mismo valor no hay
 * dos redondeos independientes que puedan desalinearse — encastra pixel
 * perfect sin importar el ancho real de la tarjeta. Mientras el ancho
 * todavía no se midió (primer render antes de que corra el efecto) se
 * usa el porcentaje como respaldo, para no dejar la foto en 0px.
 *
 * Al soltar: si el gesto superó el umbral (distancia o velocidad, ver
 * BUGFIX v3), se anima el resto del camino hasta el borde (con
 * transición CSS, activada sólo en ese momento vía `isAnimating`) y al
 * terminar la animación (`onTransitionEnd`) recién ahí cambia el
 * `index`, `commitDir` vuelve a 0 y la posición vuelve al centro sin
 * transición — la foto del borde que se ve en ese instante es la misma
 * que pasa a ser la del centro, así que el cambio es invisible (el
 * truco clásico del carrusel infinito). Si no superó el umbral, se
 * anima de vuelta al centro sin cambiar de foto.
 *
 * BUGFIX (Sep 2026, v3) — dos problemas reportados:
 *  a) "Cambia muy lento": la transición bajó de 280ms a 190ms y ahora
 *     además hay un umbral por VELOCIDAD (`SWIPE_VELOCITY_THRESHOLD`),
 *     no sólo por distancia — un flick corto y rápido (como en apps
 *     nativas) también cambia de foto, no hace falta arrastrar 45px.
 *  b) "Si deslizo muy rápido a veces no funciona": pasaba cuando un
 *     segundo swipe empezaba ANTES de que terminara la animación de
 *     "commit" del primero. Al cortar la transición a mano
 *     (`isAnimating -> false`) el navegador NO dispara `transitionend`
 *     (sólo se dispara si la transición llega a destino), que era el
 *     único lugar donde se actualizaba `index`. Resultado: el índice
 *     quedaba pegado y el próximo gesto arrancaba desde una posición
 *     inconsistente. Ahora `handleTouchStart` resuelve a mano cualquier
 *     commit pendiente (`commitDir !== 0`) apenas entra un dedo nuevo,
 *     antes de arrancar el nuevo gesto — así nunca queda un swipe a
 *     medio resolver, sin importar cuán rápido se encadenen.
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
  const [slideWidth, setSlideWidth] = useState(0);

  // Medido en píxeles reales del contenedor — ver BUGFIX v2 más arriba.
  // useLayoutEffect (no useEffect) para que corra antes del primer
  // paint del navegador y no haya un parpadeo con el ancho en 0.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || !hasMultipleImages) return;
    const updateWidth = () => setSlideWidth(el.offsetWidth);
    updateWidth();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMultipleImages]);

  const touchRef = useRef<{ x: number; y: number; time: number; axis: 'x' | 'y' | null } | null>(null);
  const [dragX, setDragX] = useState(0);
  const [commitDir, setCommitDir] = useState<0 | 1 | -1>(0);
  const [isAnimating, setIsAnimating] = useState(false);

  function handleTouchStart(e: TouchEvent) {
    if (!hasMultipleImages) return;
    const t = e.touches[0];
    if (!t) return;
    // Ver BUGFIX v3: si entra un dedo nuevo mientras todavía había un
    // commit pendiente de resolverse (swipes encadenados muy rápido),
    // lo resolvemos ya mismo en vez de dejarlo colgado — cortar la
    // transición a mano no dispara `transitionend`, así que sin esto el
    // índice se queda pegado.
    if (commitDir !== 0) {
      setIndex((i) => (commitDir === 1 ? (i + 1) % total : (i - 1 + total) % total));
      setCommitDir(0);
    }
    touchRef.current = { x: t.clientX, y: t.clientY, time: e.timeStamp, axis: null };
    setIsAnimating(false);
    setDragX(0);
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
    // Umbral doble (BUGFIX v3): por distancia (arrastre largo, clásico) o
    // por velocidad (flick corto y rápido, como en apps nativas) — así un
    // deslizón veloz pero corto también cambia de foto.
    const elapsedMs = Math.max(1, e.timeStamp - state.time);
    const velocity = Math.abs(deltaX) / elapsedMs;
    const isSwipe =
      Math.abs(deltaX) >= SWIPE_DISTANCE_THRESHOLD ||
      (Math.abs(deltaX) >= MIN_FLICK_DISTANCE && velocity >= SWIPE_VELOCITY_THRESHOLD);
    setIsAnimating(true);
    if (isSwipe) {
      setCommitDir(deltaX < 0 ? 1 : -1);
    }
    setDragX(0);
  }

  function handleTrackTransitionEnd(e: TransitionEvent<HTMLDivElement>) {
    if (e.propertyName !== 'transform') return;
    if (commitDir !== 0) {
      setIndex((i) => (commitDir === 1 ? (i + 1) % total : (i - 1 + total) % total));
    }
    setCommitDir(0);
    setIsAnimating(false);
  }

  // Todo en la misma unidad que el ancho real de cada foto (px) — así
  // el desplazamiento del track siempre encastra exacto con el borde de
  // la foto, sin depender de que dos porcentajes redondeen igual.
  // `slideWidth === 0` sólo pasa en el primer render, antes de que el
  // efecto mida el contenedor: ahí se usa el porcentaje de siempre como
  // respaldo transitorio.
  const hasMeasuredWidth = slideWidth > 0;
  const trackWidthPx = slideWidth * 3;
  const restShiftPx = -slideWidth;
  const nextShiftPx = -slideWidth * 2;
  const prevShiftPx = 0;
  const commitShiftPx = commitDir === 1 ? nextShiftPx : commitDir === -1 ? prevShiftPx : restShiftPx;
  const trackShift = commitDir === 1 ? '-200% / 3' : commitDir === -1 ? '0%' : '-100% / 3';
  const trackWidthStyle = hasMeasuredWidth ? `${trackWidthPx}px` : '300%';
  const trackTransform = hasMeasuredWidth
    ? `translateX(${commitShiftPx + dragX}px)`
    : `translateX(calc(${trackShift} + ${dragX}px))`;
  const slideWidthStyle = hasMeasuredWidth ? `${slideWidth}px` : 'calc(100% / 3)';

  const MAX_VISIBLE_DOTS = 5;
  const dotCount = Math.min(total, MAX_VISIBLE_DOTS);
  const activeDot =
    total <= MAX_VISIBLE_DOTS ? index : Math.round((index / (total - 1)) * (MAX_VISIBLE_DOTS - 1));

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
              width: trackWidthStyle,
              height: '100%',
              transform: trackTransform,
              transition: isAnimating ? `transform ${TRANSITION_MS}ms ${TRANSITION_EASING}` : 'none',
              willChange: 'transform',
            }}
          >
            <div style={{ ...SLIDE_BASE_STYLE, width: slideWidthStyle }} aria-hidden="true">
              <Image src={prevImage} alt="" fill sizes={CARD_IMAGE_SIZES} style={{ objectFit: 'cover' }} loading="eager" />
            </div>
            <div style={{ ...SLIDE_BASE_STYLE, width: slideWidthStyle }}>
              <Image src={currentImage} alt={title} fill sizes={CARD_IMAGE_SIZES} style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ ...SLIDE_BASE_STYLE, width: slideWidthStyle }} aria-hidden="true">
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

      {hasMultipleImages && (
        <div className="property-image-dots" aria-hidden="true">
          {Array.from({ length: dotCount }).map((_, i) => (
            <span
              key={i}
              className={`property-image-dot${i === activeDot ? ' property-image-dot--active' : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}