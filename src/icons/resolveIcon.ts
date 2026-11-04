import { createElement, forwardRef, type SVGProps } from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon, LucideProps } from 'lucide-react';
import { CircleHelp } from 'lucide-react';
import { EXTRA_ICONS } from './extraIcons';

/**
 * Componentes ya armados de los íconos extra (`Tb…`): uno por nombre, para
 * que React reciba siempre la MISMA función por ícono (si no, cada render
 * desmontaría y volvería a montar el `<svg>`).
 */
const extraIconCache = new Map<string, LucideIcon>();

function toKebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Dibuja un ícono extra (Tabler, ver `extraIcons.ts`) con la misma "forma"
 * que un ícono de lucide: mismas props (`size`, `color`, `strokeWidth`,
 * `absoluteStrokeWidth`, `className`…) y mismas clases (`lucide …`), así las
 * vistas lo usan exactamente igual. Los trazos salen SIEMPRE del archivo de
 * datos del paquete, nunca de la base: no hay HTML/SVG externo.
 */
function buildExtraIcon(name: string, data: string): LucideIcon {
  const paths = data.split('|').map((raw, index) => {
    let d = raw;
    let fill: string | undefined;
    let stroke: string | undefined;
    while (d.startsWith('+') || d.startsWith('-')) {
      if (d.startsWith('+')) fill = 'currentColor';
      else stroke = 'none';
      d = d.slice(1);
    }
    return createElement('path', { key: index, d, fill, stroke });
  });

  const Icon = forwardRef<SVGSVGElement, LucideProps>(function ExtraIcon(
    { color = 'currentColor', size = 24, strokeWidth = 2, absoluteStrokeWidth, className = '', children, ...rest },
    ref
  ) {
    const width = absoluteStrokeWidth ? (Number(strokeWidth) * 24) / Number(size) : strokeWidth;
    const props: SVGProps<SVGSVGElement> & { ref: typeof ref } = {
      ref,
      xmlns: 'http://www.w3.org/2000/svg',
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: color,
      strokeWidth: width,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className: ['lucide', `lucide-${toKebab(name)}`, className].filter(Boolean).join(' '),
      ...rest,
    };
    return createElement('svg', props, ...paths, children);
  });
  Icon.displayName = name;
  return Icon as unknown as LucideIcon;
}

/** `true` si el nombre es un ícono extra conocido (`Tb…`). */
export function isExtraIconName(name: string | null | undefined): boolean {
  return !!name && Object.prototype.hasOwnProperty.call(EXTRA_ICONS, name);
}

/**
 * Resuelve el nombre de ícono guardado en `home_why_us_items.icon` /
 * `home_trust_items.icon` (elegido desde el selector del admin):
 *
 * - `Tb…` (ej. `TbHomeDollar`): ícono extra de `extraIcons.ts` (Tabler).
 * - Cualquier otro: contra el `lucide-react` instalado en cada consumidor
 *   de este paquete (peer dependency, ver `package.json`). El admin sólo
 *   deja elegir nombres de `lucideIconNames.ts` (la intersección entre esta
 *   versión de lucide-react y la del admin), así que en el caso normal
 *   esto siempre resuelve.
 *
 * El fallback (`CircleHelp`) es sólo para el caso borde de un nombre que
 * ya no exista — nunca rompe el render, en el peor caso se ve un ícono
 * genérico.
 */
export function resolveIcon(name: string | null | undefined): LucideIcon {
  if (!name) return CircleHelp;
  if (name.startsWith('Tb') && isExtraIconName(name)) {
    let icon = extraIconCache.get(name);
    if (!icon) {
      icon = buildExtraIcon(name, EXTRA_ICONS[name]!);
      extraIconCache.set(name, icon);
    }
    return icon;
  }
  const icon = (LucideIcons as unknown as Record<string, LucideIcon>)[name];
  return typeof icon === 'object' || typeof icon === 'function' ? icon : CircleHelp;
}