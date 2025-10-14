'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronDownIcon, SearchIcon } from '@/components/Icons';

interface SearchBoxProps {
  /**
   * Optional custom path to navigate to when searching.
   * If not provided, uses the current pathname automatically.
   * @default usePathname() (current page)
   */
  targetPath?: string;
  /**
   * Enable dashboard mode with additional admin filters
   * (id, status, isVisible, isAvailable, isSterilized, isDeleted, compatibility)
   * @default false
   */
  dashboardMode?: boolean;
}

/**
 * SearchBox Component
 *
 * A collapsible accordion-style search and filter component for the adoption page.
 * Allows users to filter animals by multiple criteria and sort results.
 * Supports dashboard mode with additional admin-only filters.
 *
 * Features:
 *   - Multi-select filters (species, size, gender, life stage)
 *   - Name search with Enter key support
 *   - Dynamic sorting with context-aware labels
 *   - URL-based state management (searchParams)
 *   - Active filter count badge
 *   - Loading state during transitions
 *   - Auto-collapse after search
 *   - Automatic pathname detection (or custom via prop)
 *   - Dashboard mode with admin filters (id, status, visibility, availability, etc.)
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
 * Dashboard Mode Additional Parameters:
 *   - id: string - Search by specific animal ID
 *   - estados: string (CSV) - 'calle', 'protectora', 'transitorio', 'adoptado'
 *   - esVisible: string - 'si' | 'no'
 *   - estaDisponible: string - 'si' | 'no'
 *   - estaCastrado: string - 'si' | 'no' | 'no_se'
 *   - estaBorrado: string - 'si' | 'no'
 *   - compatibleConPerros: string (CSV) - 'si', 'no', 'no_se' (comma-separated)
 *   - compatibleConGatos: string (CSV) - 'si', 'no', 'no_se' (comma-separated)
 *   - compatibleConNinos: string (CSV) - 'si', 'no', 'no_se' (comma-separated)
 *
 * @param {SearchBoxProps} props - Component props
 * @param {string} [props.targetPath] - Custom path to navigate to (defaults to current pathname)
 * @param {boolean} [props.dashboardMode=false] - Enable admin filters
 *
 * @example
 * // Basic usage - automatically uses current pathname
 * <SearchBox />
 *
 * @example
 * // With custom target path
 * <SearchBox targetPath="/adopta" />
 *
 * @example
 * // Dashboard mode with admin filters
 * <SearchBox dashboardMode={true} />
 *
 * @example
 * // Dashboard mode with custom path
 * <SearchBox dashboardMode={true} targetPath="/plam-admin/animales" />
 *
 * @returns {JSX.Element} The SearchBox component
 */
export default function SearchBox({ targetPath, dashboardMode = false }: SearchBoxProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Use targetPath if provided, otherwise use current pathname
  const navigationPath = targetPath || pathname;

  const [nombre, setNombre] = useState(searchParams.get('nombre') || '');

  // Dashboard-only filters
  const [id, setId] = useState(searchParams.get('id') || '');
  const [estados, setEstados] = useState<string[]>(() => {
    if (!dashboardMode) return [];
    const param = searchParams.get('estados');
    return param ? param.split(',') : [];
  });
  const [esVisible, setEsVisible] = useState(searchParams.get('esVisible') || '');
  const [estaDisponible, setEstaDisponible] = useState(searchParams.get('estaDisponible') || '');
  const [estaCastrado, setEstaCastrado] = useState(searchParams.get('estaCastrado') || '');
  const [compatibleConPerros, setCompatibleConPerros] = useState<string[]>(() => {
    if (!dashboardMode) return [];
    const param = searchParams.get('compatibleConPerros');
    return param ? param.split(',') : [];
  });
  const [compatibleConGatos, setCompatibleConGatos] = useState<string[]>(() => {
    if (!dashboardMode) return [];
    const param = searchParams.get('compatibleConGatos');
    return param ? param.split(',') : [];
  });
  const [compatibleConNinos, setCompatibleConNinos] = useState<string[]>(() => {
    if (!dashboardMode) return [];
    const param = searchParams.get('compatibleConNinos');
    return param ? param.split(',') : [];
  });

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

    // Dashboard-only filters
    if (dashboardMode) {
      if (id.trim()) params.set('id', id.trim());
      if (estados.length > 0) params.set('estados', estados.join(','));
      if (esVisible) params.set('esVisible', esVisible);
      if (estaDisponible) params.set('estaDisponible', estaDisponible);
      if (estaCastrado) params.set('estaCastrado', estaCastrado);
      if (compatibleConPerros.length > 0)
        params.set('compatibleConPerros', compatibleConPerros.join(','));
      if (compatibleConGatos.length > 0)
        params.set('compatibleConGatos', compatibleConGatos.join(','));
      if (compatibleConNinos.length > 0)
        params.set('compatibleConNinos', compatibleConNinos.join(','));
    }

    // Always set pagination to page 1 when searching/filtering
    params.set('pagina', '1');

    startTransition(() => {
      router.push(`${navigationPath}?${params.toString()}`);
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

    // Clear dashboard-only filters
    if (dashboardMode) {
      setId('');
      setEstados([]);
      setEsVisible('');
      setEstaDisponible('');
      setEstaCastrado('');
      setCompatibleConPerros([]);
      setCompatibleConGatos([]);
      setCompatibleConNinos([]);
    }

    startTransition(() => {
      router.push(navigationPath);
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
  const baseFiltersCount =
    especies.length + tamanos.length + generos.length + etapasVida.length + (nombre ? 1 : 0);

  const dashboardFiltersCount = dashboardMode
    ? (id ? 1 : 0) +
      estados.length +
      (esVisible ? 1 : 0) +
      (estaDisponible ? 1 : 0) +
      (estaCastrado ? 1 : 0) +
      compatibleConPerros.length +
      compatibleConGatos.length +
      compatibleConNinos.length
    : 0;

  const activeFiltersCount = baseFiltersCount + dashboardFiltersCount;

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
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${dashboardMode ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4 mb-4`}
            >
              {/* Dashboard-only: ID */}
              {dashboardMode && (
                <div className="col-span-1 lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                  <input
                    type="text"
                    placeholder="Buscar por ID..."
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full px-4 py-2 rounded border-2 border-gray-300 focus:border-amber-sunset focus:outline-none bg-white"
                  />
                </div>
              )}
              {/* Name */}
              <div
                className={
                  dashboardMode ? ' sm:col-span-2 lg:col-span-3' : 'sm:col-span-3 lg:col-span-4'
                }
              >
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

              <div
                className={
                  dashboardMode
                    ? 'grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 sm:col-span-3 lg:col-span-5'
                    : 'grid grid-cols-1 sm:grid-cols-4 sm:col-span-3 lg:col-span-4'
                }
              >
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
                {/* Status */}
                {dashboardMode && (
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <label className="block text-sm font-medium text-gray-700">Estado</label>
                      <span className="text-xs text-gray-500 italic">
                        {estados.length === 0
                          ? '(Todos)'
                          : `(${estados.length} seleccionado${estados.length > 1 ? 's' : ''})`}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={estados.includes('calle')}
                          onChange={() => setEstados(toggleArrayValue(estados, 'calle'))}
                          className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                        />
                        <span className="text-sm">Calle</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={estados.includes('protectora')}
                          onChange={() => setEstados(toggleArrayValue(estados, 'protectora'))}
                          className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                        />
                        <span className="text-sm">Protectora</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={estados.includes('transitorio')}
                          onChange={() => setEstados(toggleArrayValue(estados, 'transitorio'))}
                          className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                        />
                        <span className="text-sm">Transitorio</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={estados.includes('adoptado')}
                          onChange={() => setEstados(toggleArrayValue(estados, 'adoptado'))}
                          className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                        />
                        <span className="text-sm">Adoptado</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Sort and Order */}
              <div
                className={` col-span-1 sm:col-span-2 md:col-span-3 ${dashboardMode ? 'lg:col-span-5' : 'lg:col-span-4'} grid grid-cols-1 sm:grid-cols-2 gap-4`}
              >
                {/* Sort by */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordenar por
                  </label>
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

                {/* Order - only visible if sorting is selected */}
                {ordenarPor && (
                  <div>
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
              </div>
            </div>

            {/* Dashboard-only filters */}
            {dashboardMode && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {/* Is Visible */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visible</label>
                  <select
                    value={esVisible}
                    onChange={(e) => setEsVisible(e.target.value)}
                    className="w-full px-4 py-2 rounded border-2 border-gray-300 focus:border-amber-sunset focus:outline-none bg-white"
                  >
                    <option value="">Todos</option>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>
                </div>

                {/* Is Available */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Disponible</label>
                  <select
                    value={estaDisponible}
                    onChange={(e) => setEstaDisponible(e.target.value)}
                    className="w-full px-4 py-2 rounded border-2 border-gray-300 focus:border-amber-sunset focus:outline-none bg-white"
                  >
                    <option value="">Todos</option>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>
                </div>

                {/* Is Sterilized */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Castrado</label>
                  <select
                    value={estaCastrado}
                    onChange={(e) => setEstaCastrado(e.target.value)}
                    className="w-full px-4 py-2 rounded border-2 border-gray-300 focus:border-amber-sunset focus:outline-none bg-white"
                  >
                    <option value="">Todos</option>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                    <option value="no_se">No se sabe</option>
                  </select>
                </div>

                {/* Compatibility */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 sm:col-span-3 ">
                  {/* Compatible with Dogs */}
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Compatible con perros
                      </label>
                      <span className="text-xs text-gray-500 italic">
                        {compatibleConPerros.length === 0
                          ? '(Todos)'
                          : `(${compatibleConPerros.length} seleccionado${compatibleConPerros.length > 1 ? 's' : ''})`}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={compatibleConPerros.includes('si')}
                          onChange={() =>
                            setCompatibleConPerros(toggleArrayValue(compatibleConPerros, 'si'))
                          }
                          className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                        />
                        <span className="text-sm">Sí</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={compatibleConPerros.includes('no')}
                          onChange={() =>
                            setCompatibleConPerros(toggleArrayValue(compatibleConPerros, 'no'))
                          }
                          className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                        />
                        <span className="text-sm">No</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={compatibleConPerros.includes('no_se')}
                          onChange={() =>
                            setCompatibleConPerros(toggleArrayValue(compatibleConPerros, 'no_se'))
                          }
                          className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                        />
                        <span className="text-sm">No se sabe</span>
                      </label>
                    </div>
                  </div>

                  {/* Compatible with Cats */}
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Compatible con gatos
                      </label>
                      <span className="text-xs text-gray-500 italic">
                        {compatibleConGatos.length === 0
                          ? '(Todos)'
                          : `(${compatibleConGatos.length} seleccionado${compatibleConGatos.length > 1 ? 's' : ''})`}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={compatibleConGatos.includes('si')}
                          onChange={() =>
                            setCompatibleConGatos(toggleArrayValue(compatibleConGatos, 'si'))
                          }
                          className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                        />
                        <span className="text-sm">Sí</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={compatibleConGatos.includes('no')}
                          onChange={() =>
                            setCompatibleConGatos(toggleArrayValue(compatibleConGatos, 'no'))
                          }
                          className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                        />
                        <span className="text-sm">No</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={compatibleConGatos.includes('no_se')}
                          onChange={() =>
                            setCompatibleConGatos(toggleArrayValue(compatibleConGatos, 'no_se'))
                          }
                          className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                        />
                        <span className="text-sm">No se sabe</span>
                      </label>
                    </div>
                  </div>

                  {/* Compatible with Kids */}
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Compatible con niños
                      </label>
                      <span className="text-xs text-gray-500 italic">
                        {compatibleConNinos.length === 0
                          ? '(Todos)'
                          : `(${compatibleConNinos.length} seleccionado${compatibleConNinos.length > 1 ? 's' : ''})`}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={compatibleConNinos.includes('si')}
                          onChange={() =>
                            setCompatibleConNinos(toggleArrayValue(compatibleConNinos, 'si'))
                          }
                          className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                        />
                        <span className="text-sm">Sí</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={compatibleConNinos.includes('no')}
                          onChange={() =>
                            setCompatibleConNinos(toggleArrayValue(compatibleConNinos, 'no'))
                          }
                          className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                        />
                        <span className="text-sm">No</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={compatibleConNinos.includes('no_se')}
                          onChange={() =>
                            setCompatibleConNinos(toggleArrayValue(compatibleConNinos, 'no_se'))
                          }
                          className="w-4 h-4 text-amber-sunset border-gray-300 rounded focus:ring-amber-sunset"
                        />
                        <span className="text-sm">No se sabe</span>
                      </label>
                    </div>
                  </div>
                </div>
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

1) Basic usage - automatically uses current pathname
   In /adopta page:
   <SearchBox />
   → Navigates to /adopta?especies=perro

2) In admin panel using current pathname
   In /plam-admin/animales page:
   <SearchBox />
   → Navigates to /plam-admin/animales?especies=perro

3) Dashboard mode with admin filters
   In /plam-admin/animales page:
   <SearchBox dashboardMode={true} />
   → Shows additional filters: ID, status, visibility, availability, etc.

4) Dashboard mode with custom target path
   <SearchBox dashboardMode={true} targetPath="/plam-admin/animales" />
   → Admin filters + custom navigation path

5) With custom target path (public mode)
   In any page:
   <SearchBox targetPath="/adopta" />
   → Always navigates to /adopta?especies=perro

6) Admin panel redirecting to public adopta page
   In /plam-admin/dashboard:
   <SearchBox targetPath="/adopta" />
   → Navigates to /adopta?especies=perro (useful for preview)

7) URL structure with multiple filters (comma-separated values)
   /adopta?especies=perro,gato&tamanos=pequeño,mediano
   Result: Shows dogs OR cats that are small OR medium

8) Dashboard URL with admin filters
   /plam-admin/animales?id=abc123&estados=calle,protectora&esVisible=si&estaDisponible=si
   Result: Shows animals matching ID or in street/shelter, visible and available

9) Search by name with sorting
   /adopta?nombre=Luna&ordenarPor=aproxBirthDate&orden=asc
   Result: Animals named "Luna" sorted by age (youngest first)

10) Multiple life stages filter
    /adopta?etapasVida=cachorro,joven
    Result: Shows puppies OR young animals

11) Complex filter combination
    /adopta?especies=perro&generos=hembra&tamanos=pequeño,mediano&ordenarPor=waitingSince&orden=desc
    Result: Female dogs that are small or medium, sorted by waiting time (longest first)

12) Dashboard: Compatibility filters
    /plam-admin/animales?compatibleConPerros=si&compatibleConGatos=si&compatibleConNinos=si
    Result: Animals compatible with dogs, cats, and kids

13) Dashboard: Sterilization and deletion status
    /plam-admin/animales?estaCastrado=si&estaBorrado=no
    Result: Sterilized animals that are not deleted

14) Gender filter only
    /adopta?generos=macho
    Result: All male animals

15) Size and species combination
    /adopta?especies=gato&tamanos=pequeño
    Result: Small cats only

16) Clear all filters
    Click "Limpiar" button → redirects to navigationPath (no params)

NOTES:
- All searchParams use Spanish values for SEO
- Multiple values for same filter use CSV format (comma-separated)
- Accordion auto-closes after clicking "Buscar"
- Active filter count badge shows total number of active filters (base + dashboard)
- Dynamic sort labels change based on selected sortBy field
- Press Enter in name/ID inputs to trigger search
- If targetPath is not provided, component uses current pathname automatically
- Dashboard mode adds 9 additional filter fields for admin use
- Perfect for reusing the same SearchBox in different contexts (public/admin)

──────────────────────────────────────────────────────────────────────────── */
