import {
  createContext,
  useContext,
  type ReactNode,
  type AnchorHTMLAttributes,
  type ImgHTMLAttributes,
  type JSX,
} from 'react';

export interface HostLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}
export interface HostImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface HostComponents {
  Link: (props: HostLinkProps) => JSX.Element;
  Image: (props: HostImageProps) => JSX.Element;
  /** Reemplaza a `useRouter().push(...)` — ver SearchFormView (Etapa 13). */
  useSearchNavigate: () => (query: string) => void;
}

const DEFAULT_LINK = ({ href, children, ...rest }: HostLinkProps) => (
  <a href={href} {...rest}>
    {children}
  </a>
);
const DEFAULT_IMAGE = ({ width, height, ...rest }: HostImageProps) => <img width={width} height={height} {...rest} />;

/**
 * Default = comportamiento HTML llano. El público SIEMPRE provee el
 * suyo (next/link, next/image, useRouter real) — este default sólo
 * existe para que un consumidor que todavía no envolvió el árbol en
 * <HostComponentsProvider> no rompa, no para usarse en producción.
 */
const HostComponentsContext = createContext<HostComponents>({
  Link: DEFAULT_LINK,
  Image: DEFAULT_IMAGE,
  useSearchNavigate: () => () => {},
});

export function useHostComponents(): HostComponents {
  return useContext(HostComponentsContext);
}

export function HostComponentsProvider({ value, children }: { value: HostComponents; children: ReactNode }) {
  return <HostComponentsContext.Provider value={value}>{children}</HostComponentsContext.Provider>;
}
