'use client';

import { XIcon } from '@/components/Icons';
import type { GoogleFormStatus } from '@/types';
import {
  type BooleanFilter,
  type FormFilters,
  type SizeFilter,
  type SpeciesFilter,
  hasActiveFilters,
} from './formFilters';

interface FormFiltersBarProps {
  filters: FormFilters;
  onChange: (filters: FormFilters) => void;
  onReset: () => void;
  resultCount?: number;
}

const SELECT_CLASSES =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent';

const BOOLEAN_OPTIONS: { value: BooleanFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'si', label: 'Sí' },
  { value: 'no', label: 'No' },
];

const STATUS_OPTIONS: { value: GoogleFormStatus; label: string }[] = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'reviewing', label: 'En revisión' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'rejected', label: 'Rechazado' },
];

const SECTION_TITLE_CLASSES = 'text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2';
/**
 * Filter bar for the adoption forms CRM.
 * Provides a free-text search (name, pet, phone, address...) plus optional
 * animal-preference filters derived from the AI evaluation.
 *
 * @param props - Component props
 * @param props.filters - Current filter state
 * @param props.onChange - Callback invoked with the updated filters
 * @param props.onReset - Callback to clear all filters and search
 * @param props.resultCount - Optional number of matching results to display
 *
 * @example
 * <FormFiltersBar filters={filters} onChange={setFilters} onReset={handleReset} resultCount={3} />
 */
export default function FormFiltersBar({
  filters,
  onChange,
  onReset,
  resultCount,
}: FormFiltersBarProps) {
  const update = <K extends keyof FormFilters>(key: K, value: FormFilters[K]): void => {
    onChange({ ...filters, [key]: value });
  };

  const toggleStatus = (status: GoogleFormStatus): void => {
    const current = filters.statuses;
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    update('statuses', next);
  };

  const showReset = hasActiveFilters(filters) || filters.search.trim().length > 0;

  return (
    <div className="border border-gray-200 rounded-xl bg-cream-light p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-green-dark">Filtros</h2>
        {typeof resultCount === 'number' && showReset && (
          <span className="text-xs text-gray-500">
            {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
          </span>
        )}
      </div>

      {/* Free-text search */}
      <div>
        <h3 className={SECTION_TITLE_CLASSES}>Búsqueda</h3>
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
              />
            </svg>
          </span>
          <input
            id="form-search"
            type="text"
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            placeholder="Nombre, mascota, teléfono, dirección..."
            className={`${SELECT_CLASSES} pl-9`}
          />
        </div>
      </div>

      {/* Form status */}
      <div>
        <h3 className={SECTION_TITLE_CLASSES}>Estado del formulario</h3>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const checked = filters.statuses.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium cursor-pointer transition-colors ${
                  checked
                    ? 'bg-green-forest text-white border-transparent'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => toggleStatus(opt.value)}
                />
                {opt.label}
              </label>
            );
          })}
        </div>
        {filters.statuses.length === 0 && (
          <p className="text-xs text-gray-400 mt-1">
            Sin seleccionar: se muestran todos los estados
          </p>
        )}
      </div>

      {/* Applicant characteristics */}
      <div>
        <h3 className={SECTION_TITLE_CLASSES}>Características del postulante</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label
              htmlFor="filter-species"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Especie solicitada
            </label>
            <select
              id="filter-species"
              value={filters.species}
              onChange={(e) => update('species', e.target.value as SpeciesFilter)}
              className={SELECT_CLASSES}
            >
              <option value="todos">Todos</option>
              <option value="perro">Perro</option>
              <option value="gato">Gato</option>
              <option value="cualquiera">Cualquiera</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-size" className="block text-xs font-medium text-gray-600 mb-1">
              Tamaño solicitado
            </label>
            <select
              id="filter-size"
              value={filters.size}
              onChange={(e) => update('size', e.target.value as SizeFilter)}
              className={SELECT_CLASSES}
            >
              <option value="todos">Todos</option>
              <option value="pequeño">Pequeño</option>
              <option value="mediano">Mediano</option>
              <option value="grande">Grande</option>
              <option value="cualquiera">Cualquiera</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-has-kids"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Tiene niños
            </label>
            <select
              id="filter-has-kids"
              value={filters.hasKids}
              onChange={(e) => update('hasKids', e.target.value as BooleanFilter)}
              className={SELECT_CLASSES}
            >
              {BOOLEAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-has-dogs"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Tiene perros
            </label>
            <select
              id="filter-has-dogs"
              value={filters.hasOtherDogs}
              onChange={(e) => update('hasOtherDogs', e.target.value as BooleanFilter)}
              className={SELECT_CLASSES}
            >
              {BOOLEAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-has-cats"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Tiene gatos
            </label>
            <select
              id="filter-has-cats"
              value={filters.hasOtherCats}
              onChange={(e) => update('hasOtherCats', e.target.value as BooleanFilter)}
              className={SELECT_CLASSES}
            >
              {BOOLEAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-has-yard"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Tiene patio
            </label>
            <select
              id="filter-has-yard"
              value={filters.hasYard}
              onChange={(e) => update('hasYard', e.target.value as BooleanFilter)}
              className={SELECT_CLASSES}
            >
              {BOOLEAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Evaluation score */}
      <div>
        <h3 className={SECTION_TITLE_CLASSES}>Evaluación</h3>
        <div className="max-w-md">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="filter-min-score" className="text-xs font-medium text-gray-600">
              Score mínimo
            </label>
            <span
              className={`text-xs font-semibold ${
                filters.minScore > 0 ? 'text-green-forest' : 'text-gray-400'
              }`}
            >
              {filters.minScore === 0 ? 'Sin mínimo' : `${filters.minScore}+`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="filter-min-score"
              type="range"
              min={0}
              max={100}
              step={5}
              value={filters.minScore}
              onChange={(e) => update('minScore', Number(e.target.value))}
              className="w-full accent-green-forest"
              aria-valuetext={filters.minScore === 0 ? 'Sin mínimo' : `mínimo ${filters.minScore}`}
            />
            {filters.minScore > 0 && (
              <button
                onClick={() => update('minScore', 0)}
                className="shrink-0 text-xs font-medium text-red-600 hover:text-red-800 underline"
                aria-label="Quitar filtro de score mínimo"
              >
                Quitar
              </button>
            )}
          </div>
        </div>
      </div>

      {showReset && (
        <div>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <XIcon size="sm" />
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
