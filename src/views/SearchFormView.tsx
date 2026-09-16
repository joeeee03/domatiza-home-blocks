'use client';

import { useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useHostSearchNavigate } from '../host/HostComponentsContext';

/**
 * Puerto fiel del `<form id="searchForm">` original — el único cambio
 * de fondo es `useRouter().push(...)` reemplazado por
 * `useHostSearchNavigate()` (capa de adaptación de host, hallazgo
 * 2.2): el público le da la navegación real, el admin un no-op (en el
 * canvas nunca navega de verdad, ver Etapa 16).
 *
 * ── FIX (buscador del home que no filtraba) ────────────────────────
 * Esto era el TODO "las opciones de Tipo de propiedad y Localidad
 * siguen hardcodeadas acá". No era sólo deuda estética: los slugs
 * hardcodeados NO coincidían con los slugs reales de
 * `property_types`, así que este buscador armaba URLs que no
 * matcheaban ninguna fila y el listado devolvía CERO resultados sin
 * ningún mensaje que lo explicara. Los 5 rotos eran:
 *
 *     terreno  → terreno-lote
 *     local    → local-comercial
 *     galpon   → galpon-deposito
 *     campo    → campo-chacra
 *     oficina  → oficina-consultorio
 *
 * (los otros 3 —casa, departamento, casa-quinta— sí coincidían, que
 * es por qué el buscador "andaba a veces"). Además faltaban 5 tipos
 * del catálogo cerrado de 13: ph, cochera-baulera, fondo-de-comercio,
 * hotel y edificio.
 *
 * Las localidades eran peor: estaban hardcodeadas las de UN tenant
 * (San Nicolás y alrededores). Cualquier otra inmobiliaria del SaaS
 * veía un desplegable con localidades ajenas y cada búsqueda con
 * localidad devolvía cero.
 *
 * Ahora las dos listas llegan por props desde el host, que las saca de
 * la base (ver `Hero.tsx` en el repo público). Son OPCIONALES a
 * propósito: el canvas del Editor de página del admin monta esta vista
 * sin datos y tiene que seguir andando (ahí nunca se navega de
 * verdad). Sin props:
 *   - Tipos → los 13 slugs base del catálogo cerrado, ya corregidos.
 *     Es un fallback seguro: aunque un tenant no tenga stock de alguno,
 *     el slug existe y la URL es válida (devuelve 0 resultados
 *     legítimamente, no por un slug inventado).
 *   - Localidades → lista vacía, o sea sólo "Todas las localidades".
 *     Adivinar localidades es lo que rompía antes; preferible no
 *     ofrecer ninguna a ofrecer las del tenant equivocado.
 */
export interface SearchFormOption {
  /** Slug real, tal cual está en `property_types.slug` / `locations.slug`. */
  value: string;
  label: string;
}

export interface SearchFormViewProps {
  /** Tipos con stock real del tenant. Sin esto se usa el catálogo base. */
  propertyTypes?: SearchFormOption[];
  /** Localidades activas del tenant. Sin esto el selector queda en "Todas". */
  locations?: SearchFormOption[];
}

/**
 * Catálogo cerrado de 13 tipos (`property_types` con `tenant_id IS
 * NULL`). Los slugs están verificados contra `CONFIG_BY_SLUG` en
 * `src/utils/propertyTypeFields.ts` del repo ADMIN y contra
 * `PROPERTY_TYPE_GROUPS` en `src/lib/propertyTypeGroups.ts` — esas dos
 * son hoy la fuente de verdad del catálogo del lado del código.
 */
const FALLBACK_PROPERTY_TYPES: SearchFormOption[] = [
  { value: 'casa', label: 'Casa' },
  { value: 'departamento', label: 'Departamento' },
  { value: 'ph', label: 'PH' },
  { value: 'casa-quinta', label: 'Casa quinta' },
  { value: 'terreno-lote', label: 'Terreno / Lote' },
  { value: 'campo-chacra', label: 'Campo / Chacra' },
  { value: 'local-comercial', label: 'Local comercial' },
  { value: 'oficina-consultorio', label: 'Oficina / Consultorio' },
  { value: 'galpon-deposito', label: 'Galpón / Depósito' },
  { value: 'cochera-baulera', label: 'Cochera / Baulera' },
  { value: 'fondo-de-comercio', label: 'Fondo de comercio' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'edificio', label: 'Edificio' },
];

export function SearchFormView({ propertyTypes, locations }: SearchFormViewProps = {}) {
  const navigate = useHostSearchNavigate();
  const [operation, setOperation] = useState<'venta' | 'alquiler'>('venta');
  const [propertyType, setPropertyType] = useState('');
  const [location, setLocation] = useState('');

  const typeOptions = propertyTypes && propertyTypes.length > 0 ? propertyTypes : FALLBACK_PROPERTY_TYPES;
  const locationOptions = locations ?? [];

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    // Los nombres de param son los que lee `/propiedades` y
    // `/api/propiedades`: `tipo` = operación, `tipoPropiedad` = slug del
    // tipo, `localidad` = slug de la localidad. No tocar sin tocar los
    // dos lados (ver `parseFiltersFromParams` en PropertyListing.tsx).
    params.set('tipo', operation);
    if (propertyType) params.set('tipoPropiedad', propertyType);
    if (location) params.set('localidad', location);
    navigate(`/propiedades?${params.toString()}`);
  }

  return (
    <div className="search-box">
      <div className="search-toggle" role="group" aria-label="Tipo de búsqueda">
        <button
          type="button"
          className={`search-toggle-btn${operation === 'venta' ? ' active' : ''}`}
          aria-pressed={operation === 'venta'}
          onClick={() => setOperation('venta')}
        >
          Comprar
        </button>
        <button
          type="button"
          className={`search-toggle-btn${operation === 'alquiler' ? ' active' : ''}`}
          aria-pressed={operation === 'alquiler'}
          onClick={() => setOperation('alquiler')}
        >
          Alquilar
        </button>
      </div>
      <form className="search-form" id="searchForm" onSubmit={handleSubmit}>
        <div className="search-fields">
          <div className="search-field">
            <select
              className="search-select"
              aria-label="Tipo de propiedad"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              {typeOptions.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="search-field">
            <select
              className="search-select"
              aria-label="Localidad"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">Todas las localidades</option>
              {locationOptions.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-search">
            <Search aria-hidden="true" size={18} />
            Buscar propiedades
          </button>
        </div>
      </form>
    </div>
  );
}