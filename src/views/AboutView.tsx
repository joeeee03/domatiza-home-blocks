import type { HostLinkComponent, HostImageComponent } from '../host/hostTypes';
import { EditableText, EditableImageSlot } from '../editor/Editable';
import { useHomeBlocksEditor } from '../editor/EditorContext';

export interface AboutViewProps {
  title: string;
  paragraphs: string[];
  imageUrl: string | null;
  companyName: string;
  Link: HostLinkComponent;
  Image: HostImageComponent;
}

/**
 * Editor inline: `paragraphs` sigue siendo, en la base, UN solo campo
 * de texto (`page_sections.data.text` para `about`) separado acá en
 * párrafos por líneas en blanco — no hay una fila por párrafo. Por
 * eso cada `<p>` es su propio `EditableText`, pero al confirmar uno
 * se recombinan TODOS los párrafos (con el nuevo valor de éste) y se
 * stagea el texto completo bajo un único campo (`about.text`), en vez
 * de que cada `EditableText` intente escribir su propio campo — ver
 * `onCommit` más abajo. La imagen usa `EditableImageSlot` porque viaja
 * por el componente `Image` de la capa de host, que no acepta hijos.
 */
export function AboutView({ title, paragraphs, imageUrl, companyName, Link, Image }: AboutViewProps) {
  const editor = useHomeBlocksEditor();

  return (
    <section className="about-preview">
      <div className="container">
        <div className="about-content">
          <div className="about-text">
            <EditableText as="h2" fieldPath="about.title" label="Título" value={title} placeholder="Título" />
            {paragraphs.map((paragraph, index) => (
              <EditableText
                key={index}
                as="p"
                fieldPath={`about.text.${index}`}
                label="Párrafo"
                value={paragraph}
                placeholder="Escribir párrafo…"
                singleLine={false}
                onCommit={(nextParagraph) => {
                  const next = paragraphs.slice();
                  next[index] = nextParagraph;
                  editor?.onTextCommit('about.text', next.join('\n\n'));
                }}
              />
            ))}
            <Link href="/nosotros" className="btn btn-primary">
              Conocé a todo el equipo
            </Link>
          </div>
          <div className="about-image">
            <EditableImageSlot
              fieldPath="about.image"
              label="Imagen"
              hasImage={!!imageUrl}
              wrapperStyle={{ display: 'block', width: '100%', height: '100%' }}
            >
              <Image
                src={imageUrl ?? '/images/imagen-local.jpg'}
                alt={`Equipo de ${companyName}`}
                width={640}
                height={480}
              />
            </EditableImageSlot>
          </div>
        </div>
      </div>
    </section>
  );
}