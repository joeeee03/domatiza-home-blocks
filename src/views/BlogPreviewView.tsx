import type { HostLinkComponent, HostImageComponent } from '../host/hostTypes';
import { BlogPostCardView, type BlogPostCardViewData } from './BlogPostCardView';

export interface BlogPreviewViewProps {
  posts: BlogPostCardViewData[];
  Link: HostLinkComponent;
  Image: HostImageComponent;
}

export function BlogPreviewView({ posts, Link, Image }: BlogPreviewViewProps) {
  return (
    <section className="blog-preview">
      <div className="container">
        <div className="section-header">
          <h2>Novedades del mercado inmobiliario</h2>
          <p className="section-subtitle">
            Notas para entender mejor el mercado de San Nicolás y la zona, y tomar mejores decisiones
            a la hora de comprar, vender o alquilar.
          </p>
        </div>

        <div className="blog-grid blog-grid--preview" aria-live="polite">
          {posts.map((post) => (
            <BlogPostCardView key={post.slug} post={post} Link={Link} Image={Image} />
          ))}
        </div>

        <div className="section-cta">
          <Link href="/blog" className="btn btn-secondary">
            Ver todas las notas
          </Link>
        </div>
      </div>
    </section>
  );
}