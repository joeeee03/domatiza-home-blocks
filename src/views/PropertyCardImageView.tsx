'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type TouchEvent as ReactTouchEvent,
  type TransitionEvent,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HostLinkComponent, HostImageComponent } from '../host/hostTypes';

interface PropertyCardImageViewProps {
  images: string[];
  title: string;
  href: string;
  badgeClass: string;
  badgeLabel: string;
  /**
   * Tipo de propiedad ya resuelto por el contenedor (ej. "Casa"). Se
   * dibuja SOBRE la foto, al lado del badge de Venta/Alquiler, como un
   * chip aparte del mismo alto y de otro color (`.property-badges` /
   * `.property-type-badge`, ver 12-featured.css), con inicial mayúscula
   * y el resto en minúsculas (ver `formatTypeChipLabel`). Opcional a
   * propósito: sin este dato
   * (hoy, el canvas del editor de ADMIN, que arma su propio
   * `PropertyCardViewData` sin tipo) se renderiza sólo el badge de
   * operación, igual que antes.
   */
  typeLabel?: string | null;
  Link: HostLinkComponent;
  Image: HostImageComponent;
  /**
   * Sólo para la(s) primera(s) tarjeta(s) de una grilla arriba del
   * pliegue: precarga la foto con prioridad alta en vez de dejarla al
   * lazy loading. Lo decide el contenedor, que es el único que sabe la
   * posición. Ver `PropertyCardView`.
   */
  priority?: boolean;
}

const CARD_IMAGE_SIZES = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';

/**
 * A 400-500px de ancho (lo que mide una tarjeta), 70 es visualmente
 * indistinguible de 75 y pesa ~15-20% menos por foto. Tiene que estar
 * declarada en `images.qualities` de `next.config.ts` del consumidor.
 */
const CARD_IMAGE_QUALITY = 70;

/** Cuánto esperar, en reposo, antes de montar las fotos vecinas. */
const NEIGHBOR_PRELOAD_DELAY_MS = 1200;

const AXIS_LOCK_THRESHOLD = 8;
const SWIPE_DISTANCE_THRESHOLD = 40;
const SWIPE_VELOCITY_THRESHOLD = 0.5; // px/ms — flick corto y rápido
const MIN_FLICK_DISTANCE = 12; // evita que un tap tembloroso cuente como flick
const TRANSITION_MS = 190;
const TRANSITION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * Texto del chip de tipo de propiedad: inicial mayúscula y el resto en
 * minúsculas ("Oficina/consultorio"), venga como venga escrito. Las
 * siglas de hasta 3 letras ("PH") se dejan tal cual: en minúsculas
 * quedarían mal ("Ph"). Misma función que en `PropertyCardImage`
 * (repo PUBLIC).
 */
function formatTypeChipLabel(label: string): string {
  const text = label.trim();
  if (text.length <= 3 && text === text.toUpperCase()) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

const SLIDE_BASE_STYLE: CSSProperties = {
  position: 'relative',
  height: '100%',
  flexShrink: 0,
  flexGrow: 0,
};

/**
 * Navegación de fotos dentro de la tarjeta (flechas prev/next sin salir
 * del listado, más swipe táctil) — la única parte de `PropertyCardView`
 * que necesita estado, por eso vive en su propio Client Component.
 *
 * ── REVISIÓN DE PERFORMANCE: las fotos vecinas ya no van "eager" ────
 *
 * El track monta tres fotos (anterior / actual / siguiente) y las dos
 * vecinas iban con `loading="eager"`. En el Home eso son 9 imágenes de
 * golpe para las 3 destacadas (6 de ellas invisibles); en el listado
 * del sitio público, con la copia gemela de este componente, eran 18.
 *
 * Esas imágenes invisibles compiten por ancho de banda y por las
 * conexiones del navegador contra las que sí se están viendo, y contra
 * la foto del hero, que es el LCP del Home.
 *
 * Ahora las vecinas se montan recién con la primera señal de intención
 * (toque, hover, foco en una flecha) o cuando el navegador queda en
 * reposo, y aun entonces van con `loading="lazy"`.
 *
 * El gesto no cambia: el `touchstart` monta las vecinas ANTES de que el
 * dedo recorra los 8px que confirman el eje horizontal
 * (`AXIS_LOCK_THRESHOLD`), así que para cuando la vecina tiene que
 * verse ya está pedida. Los tres `<div>` de slide se siguen
 * renderizando siempre, así que la geometría del track y el ancho
 * medido no cambian en absoluto — cero salto de layout.
 *
 * ── EL RESTO DEL COMPORTAMIENTO (sin cambios) ──────────────────────
 *
 * El swipe sólo existe en pantallas táctiles y convive con las flechas:
 * las flechas cambian de foto al instante; el swipe arrastra la foto
 * detrás del dedo y sólo se anima al soltar.
 *
 * `touchAction: 'pan-y'` + bloqueo de eje en JS evitan que el swipe
 * horizontal pelee con el scroll vertical de la lista. BUGFIX v5: el
 * `touchmove` se registra a mano con `{ passive: false }` porque es la
 * única forma de que `preventDefault()` tenga efecto real (el prop
 * `onTouchMove` de React es pasivo por default).
 *
 * BUGFIX v2: el ancho de cada slide se mide en píxeles reales
 * (`slideWidth`, vía `ResizeObserver`) y ese mismo número se usa para
 * el ancho de la foto y para el desplazamiento del track, así no hay
 * dos redondeos independientes que dejen un hilo asomando.
 *
 * BUGFIX v3: transición de 190ms + umbral por velocidad además del de
 * distancia, y `handleTouchStart` resuelve cualquier commit pendiente
 * para que dos swipes encadenados no dejen el índice pegado.
 *
 * MEJORA v4: los puntitos de posición se interpolan durante el arrastre
 * en vez de saltar de forma binaria (ver el estado `dotAnim`) — mismo
 * comportamiento, línea por línea, que `PropertyCardImage.tsx` (el
 * gemelo de este componente en el repo público), para que "Propiedades
 * destacadas" del Home se sienta idéntico a las cards de /propiedades.
 */
export function PropertyCardImageView({
  images,
  title,
  href,
  badgeClass,
  badgeLabel,
  typeLabel = null,
  Link,
  Image,
  priority = false,
}: PropertyCardImageViewProps) {
  const [index, setIndex] = useState(0);
  const hasMultipleImages = images.length > 1;
  const total = images.length;
  const currentImage = images[index] ?? images[0] ?? '/images/property-placeholder.svg';
  const prevImage = hasMultipleImages ? images[(index - 1 + total) % total] ?? currentImage : currentImage;
  const nextImage = hasMultipleImages ? images[(index + 1) % total] ?? currentImage : currentImage;

  /** ¿Ya se pueden montar las fotos vecinas? Ver el bloque de arriba. */
  const [neighborsReady, setNeighborsReady] = useState(false);

  useEffect(() => {
    if (!hasMultipleImages || neighborsReady) return;

    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const w = window as IdleWindow;

    if (typeof w.requestIdleCallback === 'function') {
      const handle = w.requestIdleCallback(() => setNeighborsReady(true), {
        timeout: NEIGHBOR_PRELOAD_DELAY_MS,
      });
      return () => w.cancelIdleCallback?.(handle);
    }

    const timer = setTimeout(() => setNeighborsReady(true), NEIGHBOR_PRELOAD_DELAY_MS);
    return () => clearTimeout(timer);
  }, [hasMultipleImages, neighborsReady]);

  function goPrev(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setNeighborsReady(true);
    setIndex((i) => (i - 1 + total) % total);
  }

  function goNext(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setNeighborsReady(true);
    setIndex((i) => (i + 1) % total);
  }

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [slideWidth, setSlideWidth] = useState(0);

  // Medido en píxeles reales del contenedor — ver BUGFIX v2.
  // useLayoutEffect para que corra antes del primer paint y no haya un
  // parpadeo con el ancho en 0.
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

  // Se llena más abajo, luego de definir handleTouchMove.
  const handleTouchMoveRef = useRef<(e: TouchEvent) => void>(() => {});

  const touchRef = useRef<{ x: number; y: number; time: number; axis: 'x' | 'y' | null } | null>(null);
  const [dragX, setDragX] = useState(0);
  const [commitDir, setCommitDir] = useState<0 | 1 | -1>(0);
  const [isAnimating, setIsAnimating] = useState(false);

  /**
   * Estado del puntito de posición durante un swipe (MEJORA v4).
   * `null` = reposo: los puntitos no reciben ningún estilo inline y
   * dependen 100% de la clase `.property-image-dot--active`.
   *
   * `dir`: hacia qué vecino (siguiente=1 / anterior=-1) se mueve.
   * `progress`: 0 a 1, cuánto camino recorrió hacia ese vecino.
   * `animate`: false mientras se arrastra (sigue al dedo 1 a 1, sin
   * transición CSS); true al soltar, para animar el tramo final con la
   * misma duración/curva que el track de fotos.
   */
  const [dotAnim, setDotAnim] = useState<{ dir: 1 | -1; progress: number; animate: boolean } | null>(null);

  function handleTouchStart(e: ReactTouchEvent) {
    if (!hasMultipleImages) return;
    const t = e.touches[0];
    if (!t) return;
    // Primera señal de intención: montar las vecinas ya mismo.
    setNeighborsReady(true);
    // Ver BUGFIX v3: resolver a mano cualquier commit pendiente.
    if (commitDir !== 0) {
      setIndex((i) => (commitDir === 1 ? (i + 1) % total : (i - 1 + total) % total));
      setCommitDir(0);
    }
    touchRef.current = { x: t.clientX, y: t.clientY, time: e.timeStamp, axis: null };
    setIsAnimating(false);
    setDragX(0);
    setDotAnim(null);
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
    // BUGFIX v5: con el eje ya confirmado como horizontal, cancelamos
    // el scroll vertical que el navegador pudo haber empezado.
    e.preventDefault();
    setDragX(deltaX);
    // Puntito: sigue al dedo 1 a 1, sin transición (`animate: false`).
    const dir: 1 | -1 | 0 = deltaX < 0 ? 1 : deltaX > 0 ? -1 : 0;
    if (dir === 0) {
      setDotAnim(null);
    } else {
      setDotAnim({
        dir,
        progress: slideWidth > 0 ? Math.min(1, Math.abs(deltaX) / slideWidth) : 0,
        animate: false,
      });
    }
  }
  handleTouchMoveRef.current = handleTouchMove;

  // BUGFIX v5: registrado a mano, única forma de que preventDefault
  // tenga efecto real.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || !hasMultipleImages) return;
    const listener = (e: TouchEvent) => handleTouchMoveRef.current(e);
    el.addEventListener('touchmove', listener, { passive: false });
    return () => el.removeEventListener('touchmove', listener);
  }, [hasMultipleImages]);

  function handleTouchEnd(e: ReactTouchEvent) {
    const state = touchRef.current;
    touchRef.current = null;
    if (!state || state.axis !== 'x') {
      setDragX(0);
      setDotAnim(null);
      return;
    }
    const t = e.changedTouches[0];
    const deltaX = t ? t.clientX - state.x : 0;
    // Umbral doble (BUGFIX v3): por distancia o por velocidad.
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
    // Puntito: fija el destino final con `animate: true` — misma
    // duración/curva que el track, para que terminen en sincro.
    const dir: 1 | -1 | 0 = deltaX < 0 ? 1 : deltaX > 0 ? -1 : 0;
    if (dir === 0) {
      setDotAnim(null);
    } else {
      setDotAnim({ dir, progress: isSwipe ? 1 : 0, animate: true });
    }
  }

  function handleTrackTransitionEnd(e: TransitionEvent<HTMLDivElement>) {
    if (e.propertyName !== 'transform') return;
    if (commitDir !== 0) {
      setIndex((i) => (commitDir === 1 ? (i + 1) % total : (i - 1 + total) % total));
    }
    setCommitDir(0);
    setIsAnimating(false);
    // El puntito ya terminó su propia transición — vuelve a reposo y a
    // depender de la clase CSS, ahora con `index` ya actualizado.
    setDotAnim(null);
  }

  // Todo en la misma unidad que el ancho real de cada foto (px).
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

  // Puntito vecino hacia el que se está arrastrando/animando (MEJORA
  // v4) — sólo se interpola si no hay compresión (≤5 fotos) y el vecino
  // real cae en la posición ADYACENTE de la fila.
  const dotNeighborIndex = dotAnim ? (index + dotAnim.dir + total) % total : null;
  const canInterpolateDots =
    dotAnim !== null &&
    total <= MAX_VISIBLE_DOTS &&
    dotNeighborIndex !== null &&
    Math.abs(dotNeighborIndex - index) === 1;

  function dotStyle(dotIndex: number): CSSProperties | undefined {
    if (!canInterpolateDots || !dotAnim || dotNeighborIndex === null) return undefined;
    let amount: number; // 0 (inactivo) a 1 (activo) para ESTE puntito puntual
    if (dotIndex === index) amount = 1 - dotAnim.progress;
    else if (dotIndex === dotNeighborIndex) amount = dotAnim.progress;
    else return undefined; // puntito no involucrado -- sigue con la clase CSS de siempre
    return {
      // Mismos valores que `.property-image-dot` /
      // `.property-image-dot--active` en 12-featured.css, así en
      // progress 0 o 1 calza pixel a pixel con la clase CSS.
      transform: `scale(${1 + 0.3 * amount})`,
      backgroundColor: `rgba(255, 255, 255, ${0.55 + 0.4 * amount})`,
      transition: dotAnim.animate
        ? `transform ${TRANSITION_MS}ms ${TRANSITION_EASING}, background-color ${TRANSITION_MS}ms ${TRANSITION_EASING}`
        : 'none',
    };
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
      onTouchEnd={handleTouchEnd}
      onMouseEnter={hasMultipleImages ? () => setNeighborsReady(true) : undefined}
    >
      {/* Badges sobre la foto: dos chips separados, uno al lado del
          otro -- la operación (Venta/Alquiler) y el tipo de propiedad.
          Ver `.property-badges` en 12-featured.css. */}
      <div className="property-badges">
        <span className={`property-badge ${badgeClass}`}>{badgeLabel}</span>
        {typeLabel && <span className="property-type-badge">{formatTypeChipLabel(typeLabel)}</span>}
      </div>
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
            {/* Los tres <div> se renderizan SIEMPRE (el track necesita
                sus tres anchos). Lo que se difiere es el <Image> de
                adentro de las dos vecinas. */}
            <div style={{ ...SLIDE_BASE_STYLE, width: slideWidthStyle }} aria-hidden="true">
              {neighborsReady && (
                <Image
                  src={prevImage}
                  alt=""
                  fill
                  sizes={CARD_IMAGE_SIZES}
                  quality={CARD_IMAGE_QUALITY}
                  style={{ objectFit: 'cover' }}
                  loading="lazy"
                />
              )}
            </div>
            <div style={{ ...SLIDE_BASE_STYLE, width: slideWidthStyle }}>
              <Image
                src={currentImage}
                alt={title}
                fill
                sizes={CARD_IMAGE_SIZES}
                quality={CARD_IMAGE_QUALITY}
                style={{ objectFit: 'cover' }}
                priority={priority}
                {...(priority ? {} : { loading: 'lazy' as const })}
              />
            </div>
            <div style={{ ...SLIDE_BASE_STYLE, width: slideWidthStyle }} aria-hidden="true">
              {neighborsReady && (
                <Image
                  src={nextImage}
                  alt=""
                  fill
                  sizes={CARD_IMAGE_SIZES}
                  quality={CARD_IMAGE_QUALITY}
                  style={{ objectFit: 'cover' }}
                  loading="lazy"
                />
              )}
            </div>
          </div>
        ) : (
          <Image
            src={currentImage}
            alt={title}
            fill
            sizes={CARD_IMAGE_SIZES}
            quality={CARD_IMAGE_QUALITY}
            style={{ objectFit: 'cover' }}
            priority={priority}
            {...(priority ? {} : { loading: 'lazy' as const })}
          />
        )}
      </Link>

      {hasMultipleImages && (
        <div className="property-image-nav">
          <button
            type="button"
            className="property-image-nav-btn property-image-nav-prev"
            aria-label="Imagen anterior"
            onClick={goPrev}
            onFocus={() => setNeighborsReady(true)}
          >
            <ChevronLeft aria-hidden="true" size={18} className="property-image-nav-icon" />
          </button>
          <button
            type="button"
            className="property-image-nav-btn property-image-nav-next"
            aria-label="Imagen siguiente"
            onClick={goNext}
            onFocus={() => setNeighborsReady(true)}
          >
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
              style={dotStyle(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}