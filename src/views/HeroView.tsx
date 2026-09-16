import type { HostLinkComponent } from '../host/hostTypes';
import { SearchFormView, type SearchFormOption } from './SearchFormView';
import { EditableText, EditableImageArea } from '../editor/Editable';

export interface HeroViewProps {
  title: string;
  subtitle: string;
  imageUrl: string | null;
  Link: HostLinkComponent;
  /**
   * FIX (buscador del home) — catálogos reales del tenant para el
   * `<SearchFormView>` de adentro. Opcionales: el canvas del Editor de
   * página del admin monta esta vista sin ellos y cae al fallback
   * documentado en `SearchFormView.tsx`. El público SÍ los pasa (ver
   * `Hero.tsx`): sin eso, el buscador arma URLs con slugs que no
   * existen y el listado devuelve cero resultados.
   */
  propertyTypes?: SearchFormOption[];
  locations?: SearchFormOption[];
}

/**
 * Si no hay `imageUrl` (el tenant no personalizó la imagen), no se
 * pisa el `background` inline y queda el definido en `07-hero.css` —
 * mismo criterio que tenía el contenedor original: no duplicar un
 * valor por defecto en dos lugares.
 *
 * Editor inline: título/subtítulo se editan tocándolos directo
 * (`EditableText`); la imagen de fondo se edita tocando la sección
 * completa del banner (`EditableImageArea` sobre el mismo `<div
 * className="hero-background">` que ya existía — sin wrapper nuevo).
 * Sin `<HomeBlocksEditorProvider>` en el árbol (siempre el caso en el
 * público) las dos primitivas caen a exactamente el JSX de antes.
 */
export function HeroView({ title, subtitle, imageUrl, Link, propertyTypes, locations }: HeroViewProps) {
  return (
    <section className="hero">
      <EditableImageArea
        as="div"
        fieldPath="hero.image"
        label="Imagen de fondo"
        hasImage={!!imageUrl}
        className="hero-background"
        style={
          imageUrl
            ? {
                background: `linear-gradient(180deg, rgba(13, 55, 51, 0.78) 0%, rgba(13, 55, 51, 0.65) 40%, rgba(13, 55, 51, 0.72) 100%), url('${imageUrl}') center/cover no-repeat`,
              }
            : undefined
        }
      />
      <div className="container">
        <div className="hero-content">
          <EditableText as="h1" fieldPath="hero.title" label="Título" value={title} placeholder="Título del banner" />
          <EditableText
            as="p"
            className="hero-subtitle"
            fieldPath="hero.subtitle"
            label="Subtítulo"
            value={subtitle}
            placeholder="Subtítulo del banner"
          />

          <SearchFormView propertyTypes={propertyTypes} locations={locations} />

          <div className="hero-cta">
            <Link href="/tasar-propiedad" className="btn btn-tertiary">
              Tasá tu propiedad gratis
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}