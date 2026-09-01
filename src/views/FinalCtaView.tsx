import { MessageCircle } from 'lucide-react';
import type { HostLinkComponent } from '../host/hostTypes';
import { whatsappLink } from '../lib/whatsappLink';

export interface FinalCtaViewProps {
  /** `companyInfo.whatsapp ?? companyInfo.phone` — ya resuelto por el contenedor. `undefined` = no hay ningún número cargado, se oculta el botón de WhatsApp (mismo criterio que el original). */
  whatsappNumber: string | undefined;
  Link: HostLinkComponent;
}

export function FinalCtaView({ whatsappNumber, Link }: FinalCtaViewProps) {
  return (
    <section className="final-cta">
      <div className="container">
        <div className="cta-content">
          <h2>¿Charlamos?</h2>
          <p>
            Contanos si querés comprar, vender, alquilar o tasar tu propiedad. Te respondemos a la
            brevedad.
          </p>
          <div className="cta-buttons">
            {whatsappNumber && (
              <a
                href={whatsappLink('Hola, quiero más información', whatsappNumber)}
                className="btn btn-whatsapp"
                target="_blank"
                rel="noopener"
              >
                <MessageCircle aria-hidden="true" />
                Escribinos por WhatsApp
              </a>
            )}
            <Link href="/contacto" className="btn btn-secondary">
              Dejanos tu consulta
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
