# @puyella/home-blocks

Paquete compartido entre `admin` y `public`, motor de renderizado
compartido del Editor de página (Fase 2 v2, Opción B — ver el
documento "Editor de página — Fase 2 v2 (Etapas 10 a 23)" y la
bitácora en `admin/src/pages/page-editor/README.md`).

Exporta las 6 vistas puras del Home con contenido editable (Hero,
Barra de confianza, ¿Por qué elegirnos?, Cobertura, Nuestra historia,
Testimonios) más la capa de adaptación de host y `resolveIcon`. El
público las usa para renderizar el sitio real; el admin las usa,
exactamente iguales, para el canvas del Editor de página — sin
duplicar ningún JSX ni CSS entre los dos.

## Qué exporta (`src/index.ts`)

- **Vistas:** `HeroView`, `SearchFormView`, `TrustBarView`, `WhyUsView`,
  `CoverageView`, `AboutView`, `TestimonialsView`, `PlaceholderSection`.
- **Capa de adaptación de host:** tipos y defaults de `Link`/`Image`
  (`hostTypes.tsx`) + `useHostSearchNavigate`/`HostSearchNavigateProvider`
  (`HostComponentsContext.tsx`) — ver la sección de abajo.
- **`resolveIcon`** (`icons/resolveIcon.ts`) — nombre de ícono guardado
  en la base → componente de `lucide-react`.
- **CSS:** `src/styles/main.css` (no se re-exporta desde `index.ts`, se
  importa directo como hoja de estilos — ver más abajo).

## Sin build propio

El paquete exporta `.ts`/`.tsx` fuente directo (no hay `tsc`/`rollup`/
`tsup` generando un `dist/`). Cada consumidor lo transpila con su
propio bundler:

- **`public`** (Next 16.3): necesita `transpilePackages: ['@puyella/home-blocks']`
  en `next.config.ts` — si no, Next no aplica su loader (SWC) a un
  paquete de `node_modules` que viene en TS/TSX sin compilar y el
  build falla.
- **`admin`** (Vite 8): funciona sin tocar nada de `vite.config.ts`
  (confirmado con `vite build` real). Si en el futuro aparece un error
  de sintaxis JSX no reconocida o el HMR no detecta cambios del
  paquete, el ajuste a probar primero es
  `optimizeDeps.exclude: ['@puyella/home-blocks']`.

## Cómo se conecta cada repo

Pensado como submódulo git (`admin/packages/home-blocks`,
`public/packages/home-blocks`), consumido como dependencia
`"@puyella/home-blocks": "file:./packages/home-blocks"` en cada
`package.json`.

**Para conectarlo en un repo nuevo** (una sola vez):
```bash
git submodule add <url-real-del-repo-home-blocks> packages/home-blocks
npm install
```

**Para traer cambios ya publicados en `home-blocks`** a un repo que ya
lo tiene conectado:
```bash
git submodule update --remote packages/home-blocks
npm install
```
(el `npm install` hace falta según el entorno — ver la advertencia
operativa de abajo; nunca está de más correrlo, es barato si no hay
nada que cambiar).

**Advertencia operativa (confirmado en vivo con npm 10.9.7 — puede
variar con otras versiones):** con esta versión de npm, una
dependencia `file:` a un directorio local se instala como **symlink**
(`node_modules/@puyella/home-blocks -> ../../packages/home-blocks`),
no como copia — así que en la práctica un cambio en este paquete se
ve al toque en los dos repos consumidores, sin correr `npm install`
de nuevo. Esto contradice lo que se asumía originalmente (que `file:`
siempre copia salvo con npm workspaces) — quedaba mal documentado acá
hasta que se probó en vivo. Si en algún entorno (versión de npm
distinta, `--install-links`, CI con lockfile estricto) el
comportamiento resulta ser el de copia en vez de symlink, ahí sí hace
falta `npm install` de nuevo después de cada `git submodule update` —
conviene confirmarlo una vez por entorno en vez de asumir cualquiera
de los dos.

## CSS compartido

`src/styles/main.css` agrupa el CSS que necesitan las 6 vistas puras.
Como el paquete no tiene build propio, la ruta de import real desde
cualquier consumidor **incluye el prefijo `src/`**:

```css
@import url('@puyella/home-blocks/src/styles/main.css');
```

(No `@puyella/home-blocks/styles/main.css` sin `src/` — probado en
vivo con `next build` real, esa ruta no resuelve porque no hay ningún
paso de build que copie `src/` a la raíz del paquete.)

### `:root`/`:host` — importante si se agrega CSS nuevo

`01-variables.css` y `02-base.css` declaran sus reglas fundacionales
como `:root, :host { ... }` (no sólo `:root`, no sólo `body`) **a
propósito**. Motivo, confirmado contra discusión activa del CSS
Working Group: **`:root` no matchea absolutamente nada adentro de un
Shadow DOM**. El canvas del admin (`IsolatedCanvas.tsx`) monta estas
vistas adentro de un shadow root — sin el `:host` agregado, las
variables de marca y la tipografía base del `body` nunca se estarían
aplicando ahí adentro (bug real que pasó sin detectar entre la Etapa
14, cuando se armó el canvas, y la Etapa 16, cuando se encontró).
`:host` no matchea nada en el documento normal del público, así que un
mismo archivo sirve para los dos contextos sin duplicar nada.

**Si en el futuro se agrega CSS nuevo a este paquete que declare algo
sobre `:root`, `html` o `body` como selector de tipo, hay que agregarle
`:host` también** (`selector-viejo, :host { ... }`), o esas reglas van
a fallar en silencio dentro del canvas del admin — sin ningún error,
sin ningún warning, simplemente no se van a aplicar ahí. Fácil de
pasar por alto porque el público (que no tiene shadow root) se va a
ver perfecto igual.

## Capa de adaptación de host (hallazgo 2.2 del prompt maestro)

Las vistas puras no pueden importar `next/link`/`next/image`/
`next/navigation` directo — esos tres dependen del runtime de Next.js,
y el admin (Vite puro) no los tiene. Se resuelve así:

- **`Link`/`Image` viajan por PROPS**, no por Context — decisión
  tomada en la Etapa 11 contra un obstáculo real:
  `createContext`/`useContext` sólo funcionan en Client Components del
  App Router de Next. Si viajaran por Context, las 6 vistas hubieran
  tenido que ser Client Components para poder leerlas — contra la
  definición de "vista pura" de más abajo. Pasarlos como prop es sólo
  una llamada de función más del lado del servidor cuando el
  contenedor (Server Component) renderiza su vista — no cruza ningún
  límite de serialización. Tipos y defaults: `hostTypes.tsx`.
- **`useSearchNavigate` sí viaja por Context** (`HostComponentsContext.tsx`,
  marcado `"use client"`) — es la única pieza que lo necesita
  (`SearchFormView`), y esa vista YA es Client Component de todos
  modos (tiene un `onSubmit` real; los manejadores de evento tampoco
  cruzan el límite de un Server Component). Marcar sólo ESE archivo
  como `"use client"` no arrastra a las otras 5 vistas, porque ninguna
  lo importa.

Cada consumidor provee sus propias implementaciones:
- **Público:** `next/link`/`next/image` reales, y un wrapper chico
  `"use client"` (`PublicSearchNavigateProvider.tsx`, en `public/src/components/home/`)
  con `useRouter()` real — sólo envuelve `Hero.tsx` (lo único que
  necesita navegar), no toda `app/page.tsx`.
- **Admin:** reemplazos inertes (`<a>`/`<img>` que no navegan de
  verdad) — en el canvas, un click siempre selecciona la sección,
  nunca ejecuta la acción real (`onClickCapture` en el borde del
  canvas, `IsolatedCanvas`/`PageEditorPage.tsx`). `useSearchNavigate`
  ni siquiera necesita un Provider ahí: el default no-op del Context ya
  es exactamente lo que quiere el admin.

## Contrato de "vista pura"

Toda vista que viva en `src/views/` tiene que cumplir esto:

- **`(props) => JSX`** — nada de `async`.
- **Sin `"use client"`/`"use server"`** — la única excepción es
  `SearchFormView`, que necesita `"use client"` porque tiene estado e
  interactividad real (`onSubmit`, `useState`). Si una vista nueva
  necesita interactividad, el patrón correcto es el mismo que ahí:
  aislarla en su propio archivo `"use client"`, y que la vista padre
  (sin directiva) la renderice como hijo — nunca convertir la vista
  padre entera en Client Component sólo porque un pedazo chico adentro
  necesita serlo.
- **Sin `fetch`/llamada a Supabase adentro** — eso lo hace el
  contenedor (público) o el `useQuery` correspondiente
  (`canvasSections.tsx`, admin), nunca la vista. La vista sólo recibe
  props ya resueltas.
- **Sin importar `next/image`/`next/link`/`next/navigation` directo**
  — usar la capa de adaptación de host de arriba.
- **`imageUrl` (o similar) viaja como URL ya resuelta, no como path
  crudo de Storage** — quién sabe convertir un path en URL difiere por
  sección (`getHomeBannerImageUrl` vs `getAboutImageUrl` en el admin,
  `getStorageUrl` en el público); no es responsabilidad de la vista
  ni del paquete en general.
- **Fallbacks visuales que no dependen de saber qué host los está
  usando** (ej. una imagen placeholder cuando no hay foto) pueden
  vivir adentro de la vista misma — ver `TestimonialsView`/`AboutView`,
  que resuelven su propio placeholder en vez de forzar a cada
  contenedor a repetir la misma lógica.

**Para agregar una vista nueva:**
1. Creá `src/views/NombreView.tsx` siguiendo el contrato de arriba.
2. Agregala al barrel (`src/index.ts`).
3. Del lado público: el contenedor (`public/src/components/home/Nombre.tsx`)
   hace el `fetch`, resuelve las URLs de imagen, y le pasa todo a la
   vista como props — igual que los 6 contenedores existentes.
4. Del lado admin (si corresponde que se vea en el canvas): agregá una
   sección en `admin/src/pages/page-editor/canvasSections.tsx`
   reusando el mismo `useQuery` que ya use el formulario de edición
   correspondiente, si existe uno — nunca un fetch nuevo.
5. Si la vista necesita CSS nuevo, agregalo a `src/styles/` y
   asegurate de que cualquier regla sobre `:root`/`html`/`body` también
   tenga `:host` — ver la sección de arriba.
