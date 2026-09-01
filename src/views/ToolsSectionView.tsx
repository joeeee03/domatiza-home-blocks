import { Calculator, Landmark } from 'lucide-react';
import type { HostLinkComponent } from '../host/hostTypes';

export interface ToolsSectionViewProps {
  Link: HostLinkComponent;
}

/** Etapa 23 (opcional): extracción trivial, igual criterio que `ServicesView`. */
export function ToolsSectionView({ Link }: ToolsSectionViewProps) {
  return (
    <section className="tools">
      <div className="container">
        <div className="section-header">
          <h2>Herramientas pensadas para vos</h2>
        </div>

        <div className="tools-grid">
          <div className="tool-card">
            <div className="tool-icon" aria-hidden="true">
              <Calculator />
            </div>
            <h3>Calculadora de ajuste de alquiler</h3>
            <p>
              Calculá el nuevo valor de tu alquiler según el índice que corresponda a tu contrato
              (ICL, IPC o UVA), en segundos.
            </p>
            <Link href="/calculadora-alquiler" className="btn btn-secondary btn-sm">
              Calcular ajuste
            </Link>
          </div>

          <div className="tool-card">
            <div className="tool-icon" aria-hidden="true">
              <Landmark />
            </div>
            <h3>Simulador de crédito hipotecario UVA</h3>
            <p>
              Simulá cuánto podés pedir y cuál sería la cuota estimada de un crédito UVA antes de
              salir a buscar tu propiedad.
            </p>
            <Link href="/calculadora-credito-uva" className="btn btn-secondary btn-sm">
              Simular crédito
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
