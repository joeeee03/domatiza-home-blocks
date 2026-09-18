import { ChevronDown, MessageCircle, Phone } from 'lucide-react';
import type { HostLinkComponent, HostImageComponent } from '../host/hostTypes';
import { whatsappLink } from '../lib/whatsappLink';
import { useHomeBlocksEditor } from '../editor/EditorContext';
import type { ChromeCompanyInfo } from './chromeTypes';

/**
 * "Chrome" no editable del Header — puerto visual (NO funcional) de
 * `public/src/components/layout/Header.tsx`, pensado únicamente para
 * que el canvas del Editor de página se vea completo, de arriba a
 * abajo, tal cual el sitio real (pedido explícito de la auditoría del
 * editor: "necesitaría que todo el CSS del público esté en
 * home-blocks... para que se vea tal cual").
 *
 * A propósito NO es un puerto 1 a 1 de `Header.tsx` — le faltan, sin
 * reemplazo, las tres piezas que ahí son de verdad interactivas:
 *   1. `usePathname()` (resaltado de link activo): no hace falta —
 *      el Editor de página sólo edita el Home, y en el Home real
 *      ningún link del header queda nunca "activo" (todos apuntan a
 *      otras páginas), así que omitirlo da exactamente el mismo
 *      resultado visual.
 *   2. El estado `scrolled` (fondo sólido al bajar): el canvas no
 *      dispara scroll de `window` (scrollea su propio contenedor
 *      interno), así que replicar ese listener no serviría de nada.
 *      Se deja SIEMPRE en su variante transparente — el estado real
 *      con el que carga el Home (header flotando sobre el banner),
 *      que es exactamente el contexto que más le sirve a quien edita
 *      el Banner principal.
 *   3. El menú móvil a pantalla completa (drawer + focus trap): nunca
 *      se puede editar nada ahí adentro, así que ni se monta — el
 *      botón de hamburguesa queda como referencia visual, sin `onClick`
 *      (cualquier click igual queda absorbido por el
 *      `onClickCapture` de `IsolatedCanvas.tsx`, ver ese archivo).
 *
 * El desplegable de Herramientas SÍ funciona (al pasar el
 * mouse) sin que este componente haga nada especial: `.nav-dropdown
 * :hover .dropdown-menu` en `06-header.css` es CSS puro, no depende
 * de ningún estado de React.
 *
 * `position: absolute` (no `fixed`, como en producción): el canvas
 * vive en un contenedor chico con su propio scroll, no en el viewport
 * real del navegador — un header `fixed` ahí se despegaría del mock y
 * taparía TODO el panel del admin. `absolute` sobre el contenedor
 * relativo que arma `PageEditorPage.tsx` (`.hb-canvas-chrome-root`)
 * logra el mismo efecto visual (el header queda flotando sobre el
 * Banner principal) sin escaparse del cuadro de vista previa.
 */
export interface HeaderChromeViewProps {
  companyInfo: ChromeCompanyInfo;
  Link: HostLinkComponent;
  Image: HostImageComponent;
}

const MAIN_LINKS = [{ href: '/propiedades', label: 'Propiedades' }];
const HERRAMIENTAS_LINKS = [
  { href: '/calculadora-alquiler', label: 'Calculadora de ajuste de alquiler' },
  { href: '/calculadora-credito-uva', label: 'Simulador de crédito UVA' },
];
const TRAILING_LINKS = [
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/blog', label: 'Blog' },
  { href: '/contacto', label: 'Contacto' },
];

export function HeaderChromeView({ companyInfo, Link, Image }: HeaderChromeViewProps) {
  // `null` en el público (nunca se usa ahí) — sólo es un valor real
  // adentro del canvas del admin. Mismo hook que ya consume
  // `Editable.tsx`, ver el comentario grande de `EditorContext.tsx`.
  const isCanvas = useHomeBlocksEditor() !== null;
  const whatsappHref = whatsappLink('Hola, quiero más información', companyInfo.whatsapp ?? companyInfo.phone ?? undefined);
  const phoneTel = companyInfo.phone;

  return (
    <header className="header" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
      <div className="container">
        <div className="header-content">
          <Link href="/" className="logo" aria-label={`${companyInfo.companyName} — Inicio`}>
            <span className="logo-mark">
              {companyInfo.logoUrl ? (
                <Image src={companyInfo.logoUrl} className="logo-img" alt="" width={180} height={180} />
              ) : (
                <Image src="/images/logo-principal.svg" className="logo-img" alt="" width={180} height={180} />
              )}
            </span>
            <span className="logo-text">{companyInfo.companyName}</span>
          </Link>

          <nav className="nav">
            <ul className="nav-list">
              {MAIN_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="nav-link">
                    {link.label}
                  </Link>
                </li>
              ))}

              <li className="nav-dropdown">
                <Link href="/herramientas" className="nav-link dropdown-toggle" aria-haspopup="true" aria-expanded={false}>
                  Herramientas
                  <ChevronDown className="dropdown-icon" aria-hidden="true" size={16} />
                </Link>
                <ul className="dropdown-menu">
                  {HERRAMIENTAS_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </li>

              {TRAILING_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="nav-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-utils">
            <a href={whatsappHref} className="header-whatsapp" aria-label="Escribirnos por WhatsApp" target="_blank" rel="noopener">
              <MessageCircle aria-hidden="true" />
            </a>
            {phoneTel && (
              <a href={`tel:${phoneTel}`} className="header-phone" aria-label="Llamar por teléfono">
                <Phone aria-hidden="true" />
              </a>
            )}
            <Link href="/tasar-propiedad" className="btn btn-secondary btn-sm">
              Tasá tu propiedad
            </Link>
            <button type="button" className="mobile-menu-toggle" aria-label="Abrir menú de navegación" aria-hidden="true" tabIndex={-1}>
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </div>

      {isCanvas && (
        <span className="hb-chrome-badge" aria-hidden="true">
          No editable acá — se edita en Configuración → Empresa
        </span>
      )}
    </header>
  );
}