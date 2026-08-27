'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Única pieza de la capa de adaptación de host que sigue viajando por
 * Context (Opción B — ver el comentario grande en `hostTypes.tsx`
 * para el porqué de que `Link`/`Image` NO estén acá). Reemplaza a
 * `useRouter().push(...)` de `next/navigation`.
 *
 * Sólo lo consume `SearchFormView` (Etapa 13) — que de todos modos ya
 * es Client Component por tener un `onSubmit` real. Este archivo
 * necesita `"use client"` porque usa `createContext`/`useContext`
 * (regla dura del App Router de Next, no configurable) — pero como
 * ninguna de las otras 5 vistas puras lo importa, marcarlo así no las
 * arrastra a ellas.
 */
export interface HostSearchNavigate {
  useSearchNavigate: () => (query: string) => void;
}

/**
 * Default = no-op. El público SIEMPRE provee la implementación real
 * (con `useRouter()` de `next/navigation`, adentro de su propio
 * wrapper `"use client"` — ver la Etapa 13); este default sólo existe
 * para que un consumidor que todavía no envolvió el árbol en
 * `<HostSearchNavigateProvider>` no rompa, no para usarse en
 * producción. El admin usa este mismo no-op tal cual: en el canvas
 * nunca tiene que navegar de verdad (Etapa 16).
 */
const DEFAULT_SEARCH_NAVIGATE: HostSearchNavigate = {
  useSearchNavigate: () => () => {},
};

const HostSearchNavigateContext = createContext<HostSearchNavigate>(DEFAULT_SEARCH_NAVIGATE);

/**
 * Azúcar sobre `useContext` + llamar al hook que trae, en un solo
 * paso — así `SearchFormView` hace simplemente
 * `const navigate = useHostSearchNavigate();`.
 */
export function useHostSearchNavigate(): (query: string) => void {
  const { useSearchNavigate } = useContext(HostSearchNavigateContext);
  return useSearchNavigate();
}

export function HostSearchNavigateProvider({
  value,
  children,
}: {
  value: HostSearchNavigate;
  children: ReactNode;
}) {
  return <HostSearchNavigateContext.Provider value={value}>{children}</HostSearchNavigateContext.Provider>;
}
