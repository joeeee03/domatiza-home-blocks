// Barrel export de @domatiza/home-blocks.
//
// Se arma incremental a lo largo de la Fase 2 v2:
//   - Etapa 11: capa de adaptación de host — Link/Image por props
//     (hostTypes.tsx) + useSearchNavigate por Context
//     (HostComponentsContext.tsx), Opción B.
//   - Etapa 12: CSS compartido (styles/main.css) — no se re-exporta
//     nada de acá, se importa directo como hoja de estilos.
//   - Etapa 13: resolveIcon + las 6 vistas puras + SearchFormView.
//   - Etapa 14: PlaceholderSection.
//   - Etapa 23 (opcional): las 5 vistas de las secciones sin
//     contenido editable + whatsappLink.
//   - Rediseño "editor inline" (Editor de página, admin): capa de
//     adaptación de EDICIÓN — hermana de la de host, mismo patrón de
//     Context con default no-op (`editor/EditorContext.tsx`) +
//     primitivas `Editable*` (`editor/Editable.tsx`), usadas adentro
//     de las 6 vistas con contenido editable. El público nunca provee
//     el Context, así que su output queda idéntico a como estaba
//     antes de este cambio.
export * from './host/hostTypes';
export * from './host/HostComponentsContext';
export * from './editor/EditorContext';
export * from './editor/Editable';
export * from './icons/resolveIcon';
export * from './lib/whatsappLink';
export * from './views/HeroView';
export * from './views/SearchFormView';
export * from './views/TrustBarView';
export * from './views/WhyUsView';
export * from './views/CoverageView';
export * from './views/AboutView';
export * from './views/TestimonialsView';
export * from './views/PlaceholderSection';
export * from './views/ServicesView';
export * from './views/ToolsSectionView';
export * from './views/FinalCtaView';
export * from './views/PropertyCardImageView';
export * from './views/PropertyCardView';
export * from './views/FeaturedPropertiesView';
export * from './views/BlogPostCardView';
export * from './views/BlogPreviewView';