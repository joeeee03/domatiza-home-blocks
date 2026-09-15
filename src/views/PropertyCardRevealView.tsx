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
 */
export function PropertyCardRevealView({ propertyId, index, children }: PropertyCardRevealViewProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className="property-card fade-in"
      data-property-id={propertyId}
      style={{ transitionDelay: `${(index % 4) * 80}ms` }}
    >
      {children}
    </div>
  );
}