/**
 * Construye un link de WhatsApp (wa.me) con un mensaje precargado.
 *
 * Movido acá desde `public/src/lib/whatsapp.ts` en la Etapa 23 —
 * `FinalCtaView` y `PropertyCardView` (las dos en `home-blocks`) lo
 * necesitan. `public/src/lib/whatsapp.ts` queda como re-export, igual
 * criterio que `resolveIcon`/`public/src/lib/icons.tsx` en la Etapa 13
 * — no romper ningún import existente fuera de las vistas migradas
 * (Footer, Header, FloatingActions, AgentContactCard, y varias
 * páginas siguen usándolo directo).
 */
export function whatsappLink(message: string, phoneNumber: string | undefined): string {
  const digits = (phoneNumber ?? '').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
