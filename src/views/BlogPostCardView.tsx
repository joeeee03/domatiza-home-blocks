import { ArrowRight, Calendar, Clock } from 'lucide-react';
import type { HostLinkComponent, HostImageComponent } from '../host/hostTypes';

export interface BlogPostCardViewData {
  slug: string;
  categoryLabel: string;
  title: string;
  excerpt: string;
  /** Ya resuelta (mismo criterio que `imageUrl` en el resto de las vistas) — nunca un path crudo de Storage. */
  image: string;
  dateLabel: string;
  readingTime: string;
}

export interface BlogPostCardViewProps {
  post: BlogPostCardViewData;
  /** El listado de /blog arma sus tarjetas con fecha y tiempo de lectura; la preview del Home no los muestra — ver el comentario original en BlogPostCard.tsx. */
  showMeta?: boolean;
  Link: HostLinkComponent;
  Image: HostImageComponent;
}

export function BlogPostCardView({ post, showMeta = false, Link, Image }: BlogPostCardViewProps) {
  return (
    <article className="blog-card">
      <div className="blog-image" style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
        <Image
          src={post.image}
          alt={post.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div className="blog-content">
        <span className="blog-category">{post.categoryLabel}</span>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        {showMeta && (
          <div className="article-meta" style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            <span className="article-meta-item">
              <Calendar aria-hidden="true" size={16} /> {post.dateLabel}
            </span>
            <span className="article-meta-item">
              <Clock aria-hidden="true" size={16} /> {post.readingTime}
            </span>
          </div>
        )}
        <Link href={`/blog/${post.slug}`} className="blog-link">
          Leer nota
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
