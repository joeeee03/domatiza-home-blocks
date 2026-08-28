// Barrel export de @domatiza/home-blocks.
//
// Se arma incremental a lo largo de la Fase 2 v2:
//   - Etapa 11: capa de adaptación de host — Link/Image por props
//     (hostTypes.tsx) + useSearchNavigate por Context
//     (HostComponentsContext.tsx), Opción B.
//   - Etapa 13 (acá): resolveIcon + las 6 vistas puras con contenido
//     editable, más SearchFormView (parte de Hero).
//   - Etapa 14 (acá): PlaceholderSection, para las 5 secciones sin
//     contenido editable que el canvas del admin muestra sin traer
//     sus datos.

// Capa de adaptación de host (Etapa 11)
export * from './host/hostTypes';
export * from './host/HostComponentsContext';

// Íconos (Etapa 13)
export * from './icons/resolveIcon';

// Vistas puras (Etapas 13 y 14)
export * from './views/HeroView';
export * from './views/SearchFormView';
export * from './views/TrustBarView';
export * from './views/WhyUsView';
export * from './views/CoverageView';
export * from './views/AboutView';
export * from './views/TestimonialsView';
export * from './views/PlaceholderSection';