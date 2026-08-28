import type { HostLinkComponent, HostImageComponent } from '../host/hostTypes';

export interface AboutViewProps {
  title: string;
  paragraphs: string[];
  imageUrl: string | null;
  companyName: string;
  Link: HostLinkComponent;
  Image: HostImageComponent;
}

export function AboutView({ title, paragraphs, imageUrl, companyName, Link, Image }: AboutViewProps) {
  return (
    <section className="about-preview">
      <div className="container">
        <div className="about-content">
          <div className="about-text">
            <h2>{title}</h2>
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            <Link href="/nosotros" className="btn btn-primary">
              Conocé a todo el equipo
            </Link>
          </div>
          <div className="about-image">
            <Image
              src={imageUrl ?? '/images/imagen-local.jpg'}
              alt={`Equipo de ${companyName}`}
              width={640}
              height={480}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
