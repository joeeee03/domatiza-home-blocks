import { Phone, MessageCircle, Mail, Clock } from 'lucide-react';
import type { HostLinkComponent, HostImageComponent } from '../host/hostTypes';
import { whatsappLink } from '../lib/whatsappLink';
import { useHomeBlocksEditor } from '../editor/EditorContext';
import type { ChromeCompanyInfo } from './chromeTypes';

/**
 * "Chrome" no editable del Footer — puerto visual de
 * `public/src/components/layout/Footer.tsx`. Ver el comentario grande
 * de `HeaderChromeView.tsx` (misma carpeta) para el porqué de esta
 * carpeta separada de `src/views/` y qué tan fiel es a producción —
 * el Footer, a diferencia del Header, no tenía nada interactivo que
 * dejar afuera: es 100% presentacional también en `public/`, así que
 * este puerto es prácticamente 1 a 1 (sólo cambian `Link`/`Image`,
 * igual que en cualquier otra vista de este paquete).
 */
export interface FooterChromeViewProps {
  companyInfo: ChromeCompanyInfo;
  Link: HostLinkComponent;
  Image: HostImageComponent;
}

export function FooterChromeView({ companyInfo, Link, Image }: FooterChromeViewProps) {
  const isCanvas = useHomeBlocksEditor() !== null;
  const phone = companyInfo.phone;
  const whatsapp = companyInfo.whatsapp ?? companyInfo.phone;
  const email = companyInfo.email;
  const address = [companyInfo.address, companyInfo.city].filter(Boolean).join(', ');
  const horarios = companyInfo.horarios.filter((h) => Boolean(h?.dia && h?.horario));

  return (
    <footer className="footer">
      {isCanvas && (
        <span className="hb-chrome-badge" aria-hidden="true">
          No editable acá — se edita en Configuración → Empresa
        </span>
      )}
      <div className="container">
        <div className="footer-grid">
          <div className="footer-column footer-brand">
            <Link href="/" className="footer-logo-link" aria-label={`${companyInfo.companyName} — Ir al inicio`}>
              {companyInfo.logoUrl ? (
                <Image src={companyInfo.logoUrl} alt="" className="footer-logo" width={160} height={160} />
              ) : (
                <Image src="/images/logo-principal.svg" alt="" className="footer-logo" width={160} height={160} />
              )}
              <span className="footer-logo-text">{companyInfo.companyName}</span>
            </Link>
            {companyInfo.tagline && <p>{companyInfo.tagline}</p>}
            {address && <p className="footer-address">{address}</p>}
          </div>

          <div className="footer-column">
            <h3>Navegación</h3>
            <ul className="footer-nav">
              <li>
                <Link href="/propiedades">Propiedades</Link>
              </li>
              <li>
                <Link href="/tasar-propiedad">Tasaciones</Link>
              </li>
              <li>
                <Link href="/servicios#inversiones">Inversiones</Link>
              </li>
              <li>
                <Link href="/servicios#comercial">Comercial</Link>
              </li>
              <li>
                <Link href="/servicios#proyectos">Proyectos</Link>
              </li>
              <li>
                <Link href="/calculadora-alquiler">Calculadora de alquiler</Link>
              </li>
              <li>
                <Link href="/calculadora-credito-uva">Simulador crédito UVA</Link>
              </li>
              <li>
                <Link href="/nosotros">Nosotros</Link>
              </li>
              <li>
                <Link href="/blog">Blog</Link>
              </li>
              <li>
                <Link href="/contacto">Contacto</Link>
              </li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>Contacto</h3>
            <ul className="footer-contact">
              {phone && (
                <li>
                  <Phone aria-hidden="true" size={18} /> <a href={`tel:${phone}`}>{phone}</a>
                </li>
              )}
              {whatsapp && (
                <li>
                  <MessageCircle aria-hidden="true" size={18} />{' '}
                  <a href={whatsappLink('Hola, quiero más información', whatsapp)} target="_blank" rel="noopener">
                    WhatsApp
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <Mail aria-hidden="true" size={18} /> <a href={`mailto:${email}`}>{email}</a>
                </li>
              )}
              {horarios.map((h) => (
                <li key={`${h.dia}-${h.horario}`}>
                  <Clock aria-hidden="true" size={18} /> {h.dia}: {h.horario}
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-column">
            <h3>Legales y redes</h3>
            <ul className="footer-legal">
              <li>
                <Link href="/privacidad">Política de Privacidad</Link>
              </li>
              <li>
                <Link href="/terminos">Términos y Condiciones</Link>
              </li>
            </ul>
            <div className="footer-social">
              {companyInfo.instagramUsername && (
                <a
                  href={`https://instagram.com/${companyInfo.instagramUsername}`}
                  className="social-link"
                  aria-label="Instagram"
                  target="_blank"
                  rel="noopener"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5.5" />
                    <circle cx="12" cy="12" r="4.2" />
                    <circle cx="17.15" cy="6.85" r="1.05" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              )}
              {companyInfo.facebookUrl && (
                <a href={companyInfo.facebookUrl} className="social-link" aria-label="Facebook" target="_blank" rel="noopener">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M15 4h-2.2C10.4 4 9 5.5 9 8v2.4H6.7v3.3H9V21h3.4v-7.3h2.5l.4-3.3h-2.9V8.3c0-.95.3-1.6 1.7-1.6H15z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} {companyInfo.companyName}. Todos los derechos reservados.
            {companyInfo.colegioMatricula && ` Corredores matriculados en ${companyInfo.colegioMatricula}.`}
          </p>
        </div>
      </div>
    </footer>
  );
}
