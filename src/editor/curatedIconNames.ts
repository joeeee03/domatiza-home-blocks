import { ALL_ICON_NAMES } from './allIconNames';
import { ICON_SYNONYMS } from './iconSynonyms';

/**
 * Set curado de íconos para el selector inline de Barra de confianza /
 * ¿Por qué elegirnos? (Editable.tsx → IconPickerPopover) — este es el
 * grid que se ve DE ENTRADA, sin escribir nada en el buscador. A
 * propósito es chico (que no abrume) y con variedad pensada para una
 * inmobiliaria.
 *
 * Auditoría del Editor de página — dos cambios sobre la lista que
 * había antes:
 *
 * 1. Búsqueda multi-idioma y mucha más variedad: `searchIcons()` (acá
 *    abajo) es lo nuevo que usa `IconPickerPopover` para buscar — en
 *    vez de comparar el texto escrito sólo contra este set de ~90
 *    nombres en inglés, busca contra los ~1460 nombres seguros de
 *    `allIconNames.ts` (la intersección de versiones de lucide-react
 *    entre admin y público — ver el comentario de ese archivo) Y
 *    contra `iconSynonyms.ts`, un diccionario en español para los
 *    íconos más relevantes. Este `CURATED_ICON_NAMES` sigue siendo
 *    sólo el punto de partida (grid inicial, sin escribir nada);
 *    apenas se escribe algo, la búsqueda ya no se limita a este set.
 *
 * 2. Se sacaron 8 nombres que YA estaban acá pero no existen en la
 *    intersección segura de versiones (renombrados entre lucide-react
 *    0.441 del admin y 1.30 del público — se detectó comparando esta
 *    lista contra `allIconNames.ts`): `CheckCircle2`, `Home`, `Smile`,
 *    `History`, `LineChart`, `BarChart3`, `Fingerprint` y
 *    `ParkingCircle`. Cualquiera de estos ocho que ya haya sido
 *    elegido por algún tenant ANTES de este cambio puede estar
 *    renderizando distinto (o el ícono de reemplazo genérico) en uno
 *    de los dos lados — conviene revisar `home_trust_items` /
 *    `home_why_us_items` por esos ocho nombres puntuales y, si
 *    aparecen, cambiarlos a mano por su equivalente seguro (ver
 *    reemplazos abajo: p.ej. `LineChart` → `ChartLine`). Este archivo
 *    ya no los vuelve a ofrecer, pero no corrige datos ya guardados.
 *
 * Cualquier ícono guardado antes con el picker grande del admin (fuera
 * de este set) se sigue viendo perfecto — `resolveIcon` no depende de
 * esta lista, sólo el selector para elegir uno NUEVO desde acá adentro
 * se limita a este set (y, buscando, a `allIconNames.ts`).
 */
export const CURATED_ICON_NAMES: string[] = [
  'BadgeCheck', 'ShieldCheck', 'CircleCheck', 'CircleCheckBig', 'ThumbsUp',
  'Star', 'Award', 'Trophy', 'Sparkles', 'Heart',
  'House', 'Building', 'Building2', 'Landmark', 'Warehouse',
  'Key', 'KeyRound', 'DoorOpen', 'Ruler', 'MapPin',
  'Compass', 'Globe', 'Map', 'Navigation', 'Route',
  'Phone', 'PhoneCall', 'Mail', 'MessageCircle', 'MessageSquare',
  'Users', 'User', 'UserCheck', 'Handshake', 'GraduationCap',
  'Clock', 'Calendar', 'CalendarCheck', 'Timer', 'Hourglass',
  'TrendingUp', 'ChartLine', 'ChartBar', 'PiggyBank', 'Wallet',
  'DollarSign', 'Percent', 'Banknote', 'CreditCard', 'Receipt',
  'FileText', 'FileCheck', 'ClipboardCheck', 'ClipboardList', 'Scale',
  'Briefcase', 'BadgeDollarSign', 'BookOpen', 'Search', 'Eye',
  'Camera', 'Image', 'Video', 'PenTool', 'Wrench',
  'Lock', 'ShieldAlert', 'Shield', 'ScanFace', 'CircleParking',
  'Sun', 'Sunrise', 'TreePine', 'Trees', 'Leaf', 'Flower2',
  'Car', 'Truck', 'Bus', 'Bike', 'Hammer',
  'Wifi', 'Zap', 'Settings', 'Target', 'Flag',
  'Gem', 'Crown', 'Layers', 'LayoutGrid', 'Grid2x2', 'Square',
  'Sofa', 'Armchair', 'BedDouble', 'Bath',
  'Snowflake', 'ThermometerSun', 'Droplet', 'Dumbbell',
  'Dog', 'Cat', 'Baby', 'Accessibility', 'Recycle', 'Sprout',
];

/** Saca tildes/diéresis y pasa a minúsculas — para que "baño"/"bano" y
 *  "año"/"ano" busquen lo mismo sin que la persona tenga que acordarse
 *  de escribir la tilde bien. */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** "BadgeDollarSign" → "badge dollar sign" — para que buscar "dollar"
 *  o "badge" encuentre el ícono aunque esas palabras estén pegadas en
 *  el nombre real de lucide-react (que siempre viene en PascalCase). */
function splitPascalCase(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/(\d)([A-Za-z])/g, '$1 $2');
}

const MAX_SEARCH_RESULTS = 96;

/**
 * Busca íconos por nombre en inglés (parcial, en cualquier
 * mayúscula/minúscula) O por palabra en español/inglés del
 * diccionario `iconSynonyms.ts` — así "casa", "seguro" o "House"
 * encuentran los mismos íconos.
 *
 * Sin texto escrito: devuelve el set curado de arriba (grid chico,
 * pensado para no abrumar). Con texto: busca contra los ~1460
 * nombres seguros de `allIconNames.ts`, tope de
 * `MAX_SEARCH_RESULTS` resultados (mismo criterio de tope que ya
 * usaba el picker grande del admin, `IconPicker.tsx`, para que la
 * grilla no se vuelva interminable con búsquedas muy cortas/genéricas
 * tipo "a").
 */
export function searchIcons(query: string): string[] {
  const q = normalize(query);
  if (!q) return CURATED_ICON_NAMES;

  const results: string[] = [];
  for (const name of ALL_ICON_NAMES) {
    const normalizedName = normalize(splitPascalCase(name));
    const matchesName = normalizedName.includes(q);
    const synonyms = ICON_SYNONYMS[name];
    const matchesSynonym = synonyms?.some((synonym) => normalize(synonym).includes(q)) ?? false;
    if (matchesName || matchesSynonym) {
      results.push(name);
      if (results.length >= MAX_SEARCH_RESULTS) break;
    }
  }
  return results;
}