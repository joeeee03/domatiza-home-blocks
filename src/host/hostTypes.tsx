import type { AnchorHTMLAttributes, ImgHTMLAttributes, ReactNode } from 'react';

/**
 * Tipos y defaults de la mitad de la capa de adaptación de host
 * (hallazgo 2.2) que viaja por PROPS, no por Context — Opción B,
 * decidida contra un obstáculo técnico real: `createContext`/
 * `useContext` sólo funcionan en Client Components del App Router de
 * Next. Si `Link`/`Image` se leyeran por Context (como en el diseño
 * original de esta etapa), las 6 vistas puras hubieran tenido que ser
 * Client Components para poder llamar al hook — contra la propia
 * definición de "vista pura" del glosario (sección 6: "sin
 * `use client`/`use server`").
 *
 * Pasar `Link`/`Image` como prop en cambio es sólo una llamada de
 * función más del lado del servidor cuando el contenedor (Server
 * Component, ej. `Hero.tsx`) renderiza su vista pura — no cruza
 * ningún límite de serialización, así que no fuerza nada. Cada
 * contenedor le pasa sus implementaciones reales (`next/link`,
 * `next/image`); el admin le pasa `DEFAULT_HOST_RENDERERS` (o algo
 * equivalente) — la vista, en los dos casos, nunca importa
 * `next/link`/`next/image` directo.
 *
 * `useSearchNavigate` es la ÚNICA pieza que sigue viajando por
 * Context — ver `HostComponentsContext.tsx` — porque sólo la
 * consume `SearchFormView` (Etapa 13), que de todos modos YA tiene
 * que ser Client Component por tener un `onSubmit` real (los
 * manejadores de evento tampoco cruzan el límite de un Server
 * Component). Marcar ESE archivo con `"use client"` no empuja a
 * ninguna de las otras 5 vistas a serlo, porque ninguna lo importa.
 */
export interface HostLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}
export interface HostImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /**
   * Etapa 23: `next/image` soporta `fill` (la imagen ocupa 100% del
   * contenedor posicionado más cercano, en vez de un tamaño fijo) —
   * lo usan `ServicesView`/`PropertyCardView`/`BlogPostCardView`
   * (tarjetas con recorte `aspect-ratio` + `object-fit: cover`, no un
   * tamaño de imagen conocido de antemano). No es un atributo real de
   * `<img>`, así que `DEFAULT_IMAGE` de acá abajo lo intercepta y lo
   * traduce a CSS — nunca se lo pasa tal cual a un `<img>` nativo.
   */
  fill?: boolean;
}

export type HostLinkComponent = (props: HostLinkProps) => ReactNode;
export type HostImageComponent = (props: HostImageProps) => ReactNode;

/**
 * Lo que cada contenedor le pasa a su vista pura como props — cada
 * vista declara en su propio `*ViewProps` sólo las que necesita
 * (`Link`, `Image`, o las dos — ver el patrón real en la Etapa 13),
 * este tipo agrupado es sólo para el contenedor que arma el objeto
 * una vez y lo esparce.
 */
export interface HostRenderers {
  Link: HostLinkComponent;
  Image: HostImageComponent;
}

/**
 * Default = comportamiento HTML llano. El público SIEMPRE pasa sus
 * implementaciones reales de Next (`next/link`, `next/image`) — estos
 * defaults son para el admin (que no tiene, ni necesita, el
 * router/optimización de imágenes de Next) y para cualquier consumidor
 * de prueba que todavía no armó los suyos.
 */
export const DEFAULT_LINK: HostLinkComponent = ({ href, children, ...rest }) => (
  <a href={href} {...rest}>
    {children}
  </a>
);
export const DEFAULT_IMAGE: HostImageComponent = ({ width, height, fill, style, ...rest }) =>
  fill ? (
    <img
      {...rest}
      style={{ ...style, position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  ) : (
    <img width={width} height={height} style={style} {...rest} />
  );

export const DEFAULT_HOST_RENDERERS: HostRenderers = {
  Link: DEFAULT_LINK,
  Image: DEFAULT_IMAGE,
};
