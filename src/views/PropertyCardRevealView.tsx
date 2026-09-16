'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface PropertyCardRevealViewProps {
  propertyId: string | number;
  index: number;
  children: ReactNode;
}

/**
 * Se auto-observa con su propio IntersectionObserver para agregarse
 * `.visible` al entrar en viewport (mismo patrón/bugfix que
 * `PropertyCard.tsx` en el repo público) — necesario porque
 * `ScrollAnimations.tsx` excluye `.property-card` de su selector
 * asumiendo que cada tarjeta se revela sola, y `PropertyCardView`
 * (vista pura, sin efectos) nunca lo hacía por su cuenta.
 *
 * SINCRONIZADO con `PropertyCard.tsx` (repo público) para que
 * "Propiedades destacadas" del Home se sienta idéntica a las cards de
 * /propiedades, línea por línea:
 *
 * 1. `rootMargin: "200px"` en el observer. Antes era `0px`, o sea que
 *    la tarjeta empezaba a aparecer recién cuando YA había entrado en
 *    pantalla: el visitante veía el hueco vacío primero y la animación
 *    después, que se lee como "va lento". Con 200px de margen la
 *    animación arranca justo antes de que la tarjeta entre, así que
 *    cuando llega ya está visible.
 *
 * 2. Respeta `prefers-reduced-motion`. Si el visitante pidió menos
 *    animaciones en su sistema, la tarjeta se muestra directamente,
 *    sin observer ni transición.
 *
 * 3. La clase `fade-in` (que arranca la tarjeta en `opacity: 0`) se
 *    agrega recién junto con `visible`, no antes: así no depende de
 *    que el JSX la traiga puesta de fábrica, exactamente igual que
 *    `PropertyCard.tsx`.
 */
export function PropertyCardRevealView({ propertyId, index, children }: PropertyCardRevealViewProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Sin IntersectionObserver (muy poco probable hoy) o con
    // animaciones reducidas: se muestra directo, nunca invisible.
    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion) {
      node.classList.add('fade-in', 'visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in', 'visible');
            observer.unobserve(entry.target);
          }
        });
      },
      // Ver punto 1 del comentario de arriba.
      { root: null, rootMargin: '200px 0px', threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className="property-card"
      data-property-id={propertyId}
      style={{ transitionDelay: `${(index % 4) * 80}ms` }}
    >
      {children}
    </div>
  );
}