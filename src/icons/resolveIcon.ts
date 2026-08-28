import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CircleHelp } from 'lucide-react';

/**
 * Resuelve el nombre de ícono guardado en `home_why_us_items.icon` /
 * `home_trust_items.icon` (elegido desde el `IconPicker` del admin)
 * contra el `lucide-react` instalado en cada consumidor de este
 * paquete (peer dependency, ver `package.json`).
 *
 * El admin sólo deja elegir nombres de `lucideIconNames.ts` (la
 * intersección entre esta versión de lucide-react y la del admin), así
 * que en el caso normal esto siempre resuelve. El fallback
 * (`CircleHelp`) es sólo para el caso borde de un nombre guardado antes
 * de un upgrade de `lucide-react` que haya renombrado o sacado ese
 * ícono puntual — nunca rompe el render, en el peor caso se ve un
 * ícono genérico.
 */
export function resolveIcon(name: string | null | undefined): LucideIcon {
  if (!name) return CircleHelp;
  const icon = (LucideIcons as unknown as Record<string, LucideIcon>)[name];
  return typeof icon === 'object' || typeof icon === 'function' ? icon : CircleHelp;
}
