'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDownIcon, SearchIcon } from '@/components/Icons';

/**
 * SearchBox Component
 *
 * A collapsible accordion-style search and filter component for the adoption page.
 * Allows users to filter animals by multiple criteria and sort results.
 *
 * Features:
 *   - Multi-select filters (species, size, gender, life stage)
 *   - Name search with Enter key support
 *   - Dynamic sorting with context-aware labels
 *   - URL-based state management (searchParams)
 *   - Active filter count badge
 *   - Loading state during transitions
 *   - Auto-collapse after search
 *
 * Search Parameters (SEO-friendly Spanish):
 *   - nombre: string - Animal name search
 *   - especies: string (CSV) - 'perro', 'gato' (comma-separated for multiple)
 *   - tamanos: string (CSV) - 'pequeño', 'mediano', 'grande' (comma-separated)
 *   - generos: string (CSV) - 'macho', 'hembra' (comma-separated)
 *   - etapasVida: string (CSV) - 'cachorro', 'joven', 'adulto' (comma-separated)
 *   - ordenarPor: string - 'name' | 'aproxBirthDate' | 'size' | 'lifeStage' | 'waitingSince'
 *   - orden: string - 'asc' | 'desc'
 *
 * @example
 * // Basic usage in a page
 * <SearchBox />
 *
 * @example
 * // URL with filters: /adopta?especies=perro,gato&tamanos=pequeño&ordenarPor=name&orden=asc
 * // Will show: dogs OR cats that are small, sorted by name A→Z
 *
 * @returns {JSX.Element} The SearchBox component
 */
export default function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [nombre, setNombre] = useState(searchParams.get('nombre') || '');

  // Multiple filters - read arrays from searchParams
  const [especies, setEspecies] = useState<string[]>(() => {
    const param = searchParams.get('especies');
    return param ? param.split(',') : [];
  });
  const [tamanos, setTamanos] = useState<string[]>(() => {
    const param = searchParams.get('tamanos');
    return param ? param.split(',') : [];
  });
  const [generos, setGeneros] = useState<string[]>(() => {
    const param = searchParams.get('generos');
    return param ? param.split(',') : [];
  });
  const [etapasVida, setEtapasVida] = useState<string[]>(() => {
    const param = searchParams.get('etapasVida');
    return param ? param.split(',') : [];
  });

  const [ordenarPor, setOrdenarPor] = useState(searchParams.get('ordenarPor') || '');
  const [orden, setOrden] = useState(searchParams.get('orden') || 'asc');

  // State to control the accordion
  const [isOpen, setIsOpen] = useState(false);

  // Helpers to handle multiple checkboxes
  const toggleArrayValue = (array: string[], value: string) => {
    if (array.includes(value)) {
      return array.filter((item) => item !== value);
    }
    return [...array, value];
  };

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (nombre.trim()) params.set('nombre', nombre.trim());
    if (especies.length > 0) params.set('especies', especies.join(','));
    if (tamanos.length > 0) params.set('tamanos', tamanos.join(','));
    if (generos.length > 0) params.set('generos', generos.join(','));
    if (etapasVida.length > 0) params.set('etapasVida', etapasVida.join(','));
    if (ordenarPor) params.set('ordenarPor', ordenarPor);
    if (orden) params.set('orden', orden);

    // Always set pagination to page 1 when searching/filtering
    params.set('pagina', '1');

    startTransition(() => {
      router.push(`/adopta?${params.toString()}`);
    });

    setIsOpen(false);
  };

  const handleClear = () => {
    setNombre('');
    setEspecies([]);
    setTamanos([]);
    setGeneros([]);
    setEtapasVida([]);
    setOrdenarPor('');
    setOrden('asc');
    startTransition(() => {
      router.push('/adopta');
    });

    setIsOpen(false);
  };

  // Helper to generate dynamic order labels
  const getOrderLabels = () => {
    switch (ordenarPor) {
      case 'waitingSince':
        return {
          asc: 'Más tiempo esperando primero',
          desc: 'Menos tiempo esperando primero',
        };
      case 'aproxBirthDate':
        return {
          asc: 'Más jóvenes primero',
          desc: 'Más viejos primero',
        };
      case 'name':
        return {
          asc: 'A → Z',
          desc: 'Z → A',
        };
      case 'size':
        return {
          asc: 'Pequeño → Grande',
          desc: 'Grande → Pequeño',
        };
      case 'lifeStage':
        return {
          asc: 'Cachorro → Adulto',
          desc: 'Adulto → Cachorro',
        };
      default:
        return {
          asc: 'Ascendente',
          desc: 'Descendente',
        };
    }
  };

  const orderLabels = getOrderLabels();

  // Count active filters
  const activeFiltersCount =
    especies.length + tamanos.length + generos.length + etapasVida.length + (nombre ? 1 : 0);

  return (
    <div className="w-full mb-6">
      <div className="bg-cream-light rounded-lg shadow-md overflow-hidden">
        {/* Accordion header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-cream-light/80 transition-colors "
        >
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-green-dark">Filtros</h3>
            {activeFiltersCount > 0 && (
              <span className="bg-amber-sunset text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro' : 'filtros'}
              </span>
            )}
            {isPending && <span className="text-xs text-gray-500 italic ml-2">Buscando...</span>}
          </div>
          <ChevronDownIcon
            className={`w-6 h-6 text-green-dark transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Accordion content */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          } overflow-hidden`}
        >
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full px-4 py-2 rounded border-2 border-gray-300 focus:border-amber-sunset focus:outline-none bg-white"
                />
              </div>

              {/* Species */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <label className="block text-sm font-medium text-gray-700">Especie</label>
                  <span className="text-xs text-gray-500 italic">
                    {especies.length === 0
                      ? '(Todos)'
                      : `(${especies.length} seleccionado${especies.length > 1 ? 's' : ''})`}
                  </span>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={especies.includes('perro')}
                      onChange={() => setEspecies(toggleArrayValue(especies, 'perro'))}
                      className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                    />
                    <span className="text-sm">Perro</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={especies.includes('gato')}
                      onChange={() => setEspecies(toggleArrayValue(especies, 'gato'))}
                      className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                    />
                    <span className="text-sm">Gato</span>
                  </label>
                </div>
              </div>

              {/* Size */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <label className="block text-sm font-medium text-gray-700">Tamaño</label>
                  <span className="text-xs text-gray-500 italic">
                    {tamanos.length === 0
                      ? '(Todos)'
                      : `(${tamanos.length} seleccionado${tamanos.length > 1 ? 's' : ''})`}
                  </span>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tamanos.includes('pequeño')}
                      onChange={() => setTamanos(toggleArrayValue(tamanos, 'pequeño'))}
                      className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                    />
                    <span className="text-sm">Pequeño</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tamanos.includes('mediano')}
                      onChange={() => setTamanos(toggleArrayValue(tamanos, 'mediano'))}
                      className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                    />
                    <span className="text-sm">Mediano</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tamanos.includes('grande')}
                      onChange={() => setTamanos(toggleArrayValue(tamanos, 'grande'))}
                      className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                    />
                    <span className="text-sm">Grande</span>
                  </label>
                </div>
              </div>

              {/* Gender */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <label className="block text-sm font-medium text-gray-700">Género</label>
                  <span className="text-xs text-gray-500 italic">
                    {generos.length === 0
                      ? '(Todos)'
                      : `(${generos.length} seleccionado${generos.length > 1 ? 's' : ''})`}
                  </span>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generos.includes('macho')}
                      onChange={() => setGeneros(toggleArrayValue(generos, 'macho'))}
                      className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                    />
                    <span className="text-sm">Macho</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generos.includes('hembra')}
                      onChange={() => setGeneros(toggleArrayValue(generos, 'hembra'))}
                      className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                    />
                    <span className="text-sm">Hembra</span>
                  </label>
                </div>
              </div>

              {/* Life stage */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <label className="block text-sm font-medium text-gray-700">Etapa de vida</label>
                  <span className="text-xs text-gray-500 italic">
                    {etapasVida.length === 0
                      ? '(Todos)'
                      : `(${etapasVida.length} seleccionado${etapasVida.length > 1 ? 's' : ''})`}
                  </span>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={etapasVida.includes('cachorro')}
                      onChange={() => setEtapasVida(toggleArrayValue(etapasVida, 'cachorro'))}
                      className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                    />
                    <span className="text-sm">Cachorro</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={etapasVida.includes('joven')}
                      onChange={() => setEtapasVida(toggleArrayValue(etapasVida, 'joven'))}
                      className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                    />
                    <span className="text-sm">Joven</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={etapasVida.includes('adulto')}
                      onChange={() => setEtapasVida(toggleArrayValue(etapasVida, 'adulto'))}
                      className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                    />
                    <span className="text-sm">Adulto</span>
                  </label>
                </div>
              </div>

              {/* Sort by */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
                <select
                  value={ordenarPor}
                  onChange={(e) => setOrdenarPor(e.target.value)}
                  className="w-full px-4 py-2 rounded border-2 border-gray-300 focus:border-amber-sunset focus:outline-none bg-white"
                >
                  <option value="">Sin ordenar</option>
                  <option value="name">Nombre</option>
                  <option value="aproxBirthDate">Edad</option>
                  <option value="size">Tamaño</option>
                  <option value="lifeStage">Etapa de vida</option>
                  <option value="waitingSince">Tiempo esperando</option>
                </select>
              </div>
            </div>

            {/* Order - only visible if sorting is selected */}
            {ordenarPor && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                <select
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  className="w-full px-4 py-2 rounded border-2 border-gray-300 focus:border-amber-sunset focus:outline-none bg-white"
                >
                  <option value="asc">{orderLabels.asc}</option>
                  <option value="desc">{orderLabels.desc}</option>
                </select>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSearch}
                disabled={isPending}
                className="flex-1 bg-amber-sunset text-white px-6 py-2 rounded font-semibold hover:bg-amber-sunset/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
              >
                <SearchIcon size="md" />
                {isPending ? 'Buscando...' : 'Buscar'}
              </button>
              <button
                onClick={handleClear}
                disabled={isPending}
                className="px-6 py-2 rounded border-2 border-gray-300 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 active:scale-95"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  USAGE EXAMPLES  ──────────────────────────

1) Basic usage in adoption page
   <SearchBox />

2) URL structure with multiple filters (comma-separated values)
   /adopta?especies=perro,gato&tamanos=pequeño,mediano
   Result: Shows dogs OR cats that are small OR medium

3) Search by name with sorting
   /adopta?nombre=Luna&ordenarPor=aproxBirthDate&orden=asc
   Result: Animals named "Luna" sorted by age (youngest first)

4) Multiple life stages filter
   /adopta?etapasVida=cachorro,joven
   Result: Shows puppies OR young animals

5) Complex filter combination
   /adopta?especies=perro&generos=hembra&tamanos=pequeño,mediano&ordenarPor=waitingSince&orden=desc
   Result: Female dogs that are small or medium, sorted by waiting time (longest first)

6) Gender filter only
   /adopta?generos=macho
   Result: All male animals

7) Size and species combination
   /adopta?especies=gato&tamanos=pequeño
   Result: Small cats only

8) Clear all filters
   Click "Limpiar" button → redirects to /adopta (no params)

NOTES:
- All searchParams use Spanish values for SEO
- Multiple values for same filter use CSV format (comma-separated)
- Accordion auto-closes after clicking "Buscar"
- Active filter count badge shows total number of active filters
- Dynamic sort labels change based on selected sortBy field
- Press Enter in name input to trigger search

──────────────────────────────────────────────────────────────────────────── */
