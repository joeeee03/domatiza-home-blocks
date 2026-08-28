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
 * TODO Capa 4 (deuda ya existente, no de esta fase): las opciones de
 * "Tipo de propiedad" y "Localidad" siguen hardcodeadas acá — pasan a
 * venir de `property_types`/`locations` filtradas por tenant.
 */
const PROPERTY_TYPES: Array<{ value: string; label: string }> = [
  { value: 'casa', label: 'Casa' },
  { value: 'departamento', label: 'Departamento' },
  { value: 'casa-quinta', label: 'Casa quinta' },
  { value: 'terreno', label: 'Terreno/Lote' },
  { value: 'local', label: 'Local comercial' },
  { value: 'galpon', label: 'Galpón-Depósito' },
  { value: 'campo', label: 'Campo-Chacra' },
  { value: 'oficina', label: 'Oficina-Consultorio' },
];

const LOCATIONS: Array<{ value: string; label: string }> = [
  { value: 'san-nicolas', label: 'San Nicolás' },
  { value: 'baradero', label: 'Baradero' },
  { value: 'campana', label: 'Campana' },
  { value: 'colon', label: 'Colón' },
  { value: 'conesa', label: 'Conesa' },
  { value: 'general-rojo', label: 'General Rojo' },
  { value: 'junin', label: 'Junín' },
  { value: 'la-emilia', label: 'La Emilia' },
  { value: 'los-cardales', label: 'Los Cardales' },
  { value: 'pergamino', label: 'Pergamino' },
  { value: 'ramallo', label: 'Ramallo' },
  { value: 'san-pedro', label: 'San Pedro' },
  { value: 'villa-ramallo', label: 'Villa Ramallo' },
  { value: 'zarate', label: 'Zárate' },
];

export function SearchFormView() {
  const navigate = useHostSearchNavigate();
  const [operation, setOperation] = useState<'venta' | 'alquiler'>('venta');
  const [propertyType, setPropertyType] = useState('');
  const [location, setLocation] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
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
              {PROPERTY_TYPES.map((type) => (
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
              {LOCATIONS.map((loc) => (
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
