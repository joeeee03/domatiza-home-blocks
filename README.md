# @domatiza/home-blocks

Paquete compartido entre `admin` y `public` para el motor de renderizado
compartido del Editor de página (Fase 2 v2, Opción B). Documentación
completa: Etapa 22 del prompt maestro. Esto son las notas operativas
que ya hacen falta desde la Etapa 11.

## Sin build propio

El paquete exporta `.ts`/`.tsx` fuente directo (no hay `tsc`/`rollup`/
`tsup` generando un `dist/`). Cada consumidor lo transpila con su
propio bundler:

- **`public`** (Next 16.3): necesita `transpilePackages: ['@domatiza/home-blocks']`
  en `next.config.ts` — si no, Next no aplica su loader (SWC) a un
  paquete de `node_modules` que viene en TS/TSX sin compilar y el
  build falla.
- **`admin`** (Vite 8): funcionó sin tocar nada de `vite.config.ts` en
  la verificación de la Etapa 11 (Vite procesó el `.tsx` del paquete
  igual que cualquier import propio). Si en el futuro aparece un error
  de sintaxis JSX no reconocida o el HMR no detecta cambios del
  paquete, el ajuste a probar primero es
  `optimizeDeps.exclude: ['@domatiza/home-blocks']`.

## Cómo se conecta cada repo

Pensado como submódulo git (`admin/packages/home-blocks`,
`public/packages/home-blocks`), consumido como dependencia
`"@domatiza/home-blocks": "file:./packages/home-blocks"` en cada
`package.json`.

**Advertencia operativa:** `npm install` con una dependencia `file:`
**copia** los archivos a `node_modules/` (no crea un symlink), salvo
que se usen npm workspaces. Esto significa que después de cualquier
cambio en este paquete hay que correr `npm install` de nuevo en el
repo que lo consume (`admin` o `public`) para traer la copia
actualizada — un `git submodule update` solo no alcanza. Si esto
resulta molesto en la práctica, el upgrade natural es sumar npm
workspaces (no se hace ahora, no hace falta para que esto funcione).

## Contrato de "vista pura"

Ver la Etapa 13 del prompt maestro cuando se agreguen las vistas —
esta sección se completa en la Etapa 22.
