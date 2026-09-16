import type { AnchorHTMLAttributes, ImgHTMLAttributes, ReactNode } from 'react';

/**
 * Tipos y defaults de la mitad de la capa de adaptación de host
 * (hallazgo 2.2) que viaja por PROPS, no por Context — Opción B,
 * decidida contra un obstáculo técnico real: `createContext`/
 * `useContext` sólo funcionan en Client Components del App Router de
 * Next. Si `Link`/`Image` se leyeran por Context, las 6 vistas puras
 * hubieran tenido que ser Client Components para poder llamar al hook
 * — contra la propia definición de "vista pura".
 *
 * Pasar `Link`/`Image` como prop en cambio es sólo una llamada de
 * función más del lado del servidor cuando el contenedor (Server
 * Component, ej. `Hero.tsx`) renderiza su vista pura — no cruza ningún
 * límite de serialización. Cada contenedor le pasa sus
 * implementaciones reales (`next/link`, `next/image`); el admin le pasa
 * `DEFAULT_HOST_RENDERERS`.
 *
 * `useSearchNavigate` es la ÚNICA pieza que sigue viajando por Context
 * — ver `HostComponentsContext.tsx` — porque sólo la consume
 * `SearchFormView`, que de todos modos YA tiene que ser Client
 * Component por tener un `onSubmit` real.
 */
export interface HostLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children?: ReactNode;
  className?: string;
}
export interface HostImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  /**
   * `next/image` soporta `fill` (la imagen ocupa 100% del contenedor
   * posicionado más cercano, en vez de un tamaño fijo) — lo usan
   * `ServicesView`/`PropertyCardView`/`BlogPostCardView`. No es un
   * atributo real de `<img>`, así que `DEFAULT_IMAGE` de acá abajo lo
   * intercepta y lo traduce a CSS.
   */
  fill?: boolean;
  /**
   * `next/image` soporta `sizes` para imágenes responsivas — usado en
   * `PropertyCardImageView` para optimizar la carga en diferentes
   * tamaños de pantalla.
   */
  sizes?: string;
  /**
   * `next/image` soporta `loading` para controlar cuándo cargar la
   * imagen ("lazy" o "eager").
   */
  loading?: 'lazy' | 'eager';
  /**
   * AGREGADO EN LA REVISIÓN DE PERFORMANCE.
   *
   * `priority` de `next/image`: emite un
   * `<link rel="preload" fetchpriority="high">` para esa imagen
   * puntual, en vez de dejarla al lazy loading. Sólo tiene sentido
   * para la imagen que va a ser el LCP de la página (típicamente la
   * primera tarjeta de una grilla arriba del pliegue) — marcar muchas
   * es contraproducente, porque compiten entre sí.
   *
   * No es un atributo válido de `<img>` nativo, así que `DEFAULT_IMAGE`
   * lo traduce a los atributos estándar equivalentes
   * (`fetchPriority` + `loading="eager"`) en vez de pasarlo tal cual
   * (React tiraría un warning de atributo desconocido en el DOM).
   */
  priority?: boolean;
  /**
   * `quality` de `next/image` (1-100). Las fotos de tarjeta se ven a
   * 400-500px de ancho, donde 70 es indistinguible de 75 y pesa ~15-20%
   * menos. Cualquier valor que se use tiene que estar declarado en
   * `images.qualities` de `next.config.ts` (Next 16 rechaza los que no
   * lo estén).
   *
   * Un `<img>` nativo no tiene noción de calidad, así que
   * `DEFAULT_IMAGE` simplemente lo ignora.
   */
  quality?: number;
}

export type HostLinkComponent = (props: HostLinkProps) => ReactNode;
export type HostImageComponent = (props: HostImageProps) => ReactNode;

/**
 * Lo que cada contenedor le pasa a su vista pura como props — cada
 * vista declara en su propio `*ViewProps` sólo las que necesita.
 */
export interface HostRenderers {
  Link: HostLinkComponent;
  Image: HostImageComponent;
}

/**
 * Default = comportamiento HTML llano. El público SIEMPRE pasa sus
 * implementaciones reales de Next (`next/link`, `next/image`) — estos
 * defaults son para el admin (que no tiene, ni necesita, el
 * router/optimización de imágenes de Next).
 */
export const DEFAULT_LINK: HostLinkComponent = ({ href, children, ...rest }) => (
  <a href={href} {...rest}>
    {children}
  </a>
);

export const DEFAULT_IMAGE: HostImageComponent = ({
  width,
  height,
  fill,
  sizes,
  loading,
  priority,
  // `quality` sólo existe en el optimizador de Next: un <img> nativo no
  // tiene nada equivalente, así que se descarta acá para que no llegue
  // al DOM como atributo desconocido.
  quality: _quality,
  style,
  ...rest
}) => {
  // `priority` no es un atributo de <img>. El equivalente nativo más
  // cercano es cargar de inmediato y con prioridad alta.
  const priorityProps = priority
    ? ({ loading: 'eager' as const, fetchPriority: 'high' as const })
    : ({ loading } as { loading?: 'lazy' | 'eager' });

  return fill ? (
    <img
      {...rest}
      style={{ ...style, position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      {...priorityProps}
    />
  ) : (
    <img width={width} height={height} style={style} {...priorityProps} {...rest} />
  );
};

export const DEFAULT_HOST_RENDERERS: HostRenderers = {
  Link: DEFAULT_LINK,
  Image: DEFAULT_IMAGE,
};