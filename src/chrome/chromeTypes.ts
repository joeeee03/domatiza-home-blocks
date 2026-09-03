/**
 * Header/Footer del sitio — a diferencia de las 11 vistas de
 * `src/views/`, esto NO es contenido editable desde el Editor de
 * página (se editan en Configuración → Empresa del admin, ver
 * `RESERVED_SECTION_KEYS` en `page-editor/api.ts` del otro repo). Este
 * tipo existe sólo para que `HeaderChromeView`/`FooterChromeView`
 * tengan la misma forma de datos que ya arma `getCompanyInfo()` en
 * `public/src/lib/supabase/companyInfo.ts` — no se importa ese
 * archivo directo (dos repos separados, sin código compartido más
 * allá de este paquete), se repite la forma acá a propósito, mismo
 * criterio que el resto del paquete.
 *
 * Sólo tiene los campos que Header.tsx/Footer.tsx realmente usan
 * (no `province`/`country`, que sí tiene `CompanyInfo` del público
 * pero ninguno de los dos consume).
 */
export interface HorarioRango {
  /**
   * ⚠️ Hallazgo de la auditoría del Editor de página (no es un bug de
   * ESTE archivo, es de `public/src/components/layout/Footer.tsx`,
   * documentado en el informe): la fila real que guarda
   * `admin/src/pages/company/CompanySettingsPage.tsx` (función
   * `horariosAFormatoDB`) usa la clave `dia` (singular) — coincide con
   * `HorarioDiaDB` en `admin/src/types/database.ts`. El Footer del
   * PÚBLICO, sin embargo, lee `h.dias` (plural) al filtrar/mostrar —
   * ver el comentario "⚠️ Supuesto pendiente de confirmar" que el
   * propio archivo ya tiene. Resultado: `h.dias` da `undefined`
   * siempre, el filtro `Boolean(h?.dias && h?.horario)` nunca pasa, y
   * los horarios de atención NO se muestran en el Footer de ningún
   * tenant hoy, en silencio (sin error, lista vacía). Acá se usa el
   * nombre REAL que guarda la DB (`dia`) a propósito, para que el
   * canvas del editor muestre el contenido que el negocio realmente
   * cargó — recomendación en el informe: corregir el Footer del
   * público (`h.dias` → `h.dia`) para que el sitio real deje de
   * perder este contenido.
   */
  dia: string;
  horario: string;
}

export interface ChromeCompanyInfo {
  companyName: string;
  tagline: string | null;
  colegioMatricula: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  instagramUsername: string | null;
  facebookUrl: string | null;
  horarios: HorarioRango[];
  logoUrl: string | null;
}
