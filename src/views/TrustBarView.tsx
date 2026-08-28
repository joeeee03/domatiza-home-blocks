import { resolveIcon } from '../icons/resolveIcon';

export interface TrustBarItem {
  id: string;
  icon: string;
  text: string;
}

export interface TrustBarViewProps {
  items: TrustBarItem[];
}

/**
 * El contenedor (`TrustBar.tsx`) decide si esta sección se monta o no
 * (visibilidad + "sin ítems no hay sección") — la vista pura no
 * necesita saber nada de eso, sólo dibuja lo que le pasan. Si algún
 * día conviene mostrar la sección igual con la lista vacía (ej. en el
 * canvas del admin, para no tener un salto de layout raro), eso se
 * decide del lado del contenedor/canvas, no acá.
 */
export function TrustBarView({ items }: TrustBarViewProps) {
  return (
    <section className="trust-bar">
      <div className="container">
        <div className="trust-items">
          {items.map((item) => {
            const Icon = resolveIcon(item.icon);
            return (
              <div className="trust-item" key={item.id}>
                <Icon aria-hidden="true" />
                <span>{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
