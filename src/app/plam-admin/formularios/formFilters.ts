import type { GoogleFormEntry, GoogleFormStatus } from '@/types';

export type SpeciesFilter = 'todos' | 'perro' | 'gato' | 'cualquiera';

export type SizeFilter = 'todos' | 'pequeño' | 'mediano' | 'grande' | 'cualquiera';

export type BooleanFilter = 'todos' | 'si' | 'no';

export interface FormFilters {
  search: string;
  statuses: GoogleFormStatus[];
  species: SpeciesFilter;
  size: SizeFilter;
  hasKids: BooleanFilter;
  hasOtherDogs: BooleanFilter;
  hasOtherCats: BooleanFilter;
  hasYard: BooleanFilter;
  minScore: number;
}

export const EMPTY_FILTERS: FormFilters = {
  search: '',
  statuses: [],
  species: 'todos',
  size: 'todos',
  hasKids: 'todos',
  hasOtherDogs: 'todos',
  hasOtherCats: 'todos',
  hasYard: 'todos',
  minScore: 0,
};

const SEARCHABLE_FIELDS: Array<keyof GoogleFormEntry> = [
  'fullName',
  'selectedPet',
  'phone',
  'approvedAnimalName',
  'address',
  'contactSource',
];

/**
 * Normalizes a text value for case-insensitive, accent-insensitive matching.
 * Lowercases, strips diacritics (NFD) and trims whitespace.
 *
 * @param value - Raw text to normalize
 * @returns Normalized string ready for `includes` comparisons
 *
 * @example
 * normalizeText('José Maldonado') // 'jose maldonado'
 */
export const normalizeText = (value: string): string => {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

/**
 * Returns true when at least one non-search filter differs from its default.
 *
 * @param filters - Current filter state
 * @returns True if any preference filter is active
 */
export const hasActiveFilters = (filters: FormFilters): boolean => {
  return (
    filters.statuses.length > 0 ||
    filters.species !== EMPTY_FILTERS.species ||
    filters.size !== EMPTY_FILTERS.size ||
    filters.hasKids !== EMPTY_FILTERS.hasKids ||
    filters.hasOtherDogs !== EMPTY_FILTERS.hasOtherDogs ||
    filters.hasOtherCats !== EMPTY_FILTERS.hasOtherCats ||
    filters.hasYard !== EMPTY_FILTERS.hasYard ||
    filters.minScore !== EMPTY_FILTERS.minScore
  );
};

const matchesBooleanPreference = (
  value: boolean,
  filter: BooleanFilter,
  preferenceActive: boolean
): boolean => {
  if (filter === 'todos') return true;
  return preferenceActive && value === (filter === 'si');
};

const matchesPreferenceFilters = (
  form: GoogleFormEntry,
  filters: FormFilters,
  hasPreferenceFilter: boolean
): boolean => {
  if (!hasPreferenceFilter) return true;

  const preferences = form.evaluation?.preferences;
  if (!preferences) return false;

  if (filters.species !== 'todos' && preferences.species !== filters.species) return false;
  if (filters.size !== 'todos' && preferences.size !== filters.size) return false;
  if (!matchesBooleanPreference(preferences.hasKids, filters.hasKids, true)) return false;
  if (!matchesBooleanPreference(preferences.hasOtherDogs, filters.hasOtherDogs, true)) return false;
  if (!matchesBooleanPreference(preferences.hasOtherCats, filters.hasOtherCats, true)) return false;
  if (!matchesBooleanPreference(preferences.hasYard, filters.hasYard, true)) return false;

  return true;
};

const matchesSearchTerm = (form: GoogleFormEntry, normalizedSearch: string): boolean => {
  if (!normalizedSearch) return true;

  return SEARCHABLE_FIELDS.some((field) => {
    const value = form[field];
    return typeof value === 'string' && normalizeText(value).includes(normalizedSearch);
  });
};

/**
 * Applies status filter, preference filters, minimum score and free-text search
 * to the given forms. Forms without evaluation are excluded whenever any
 * preference filter or a minimum score is active.
 *
 * @param forms - Full list of forms
 * @param filters - Status, search, preference and score filters
 * @returns Filtered forms matching all active criteria
 */
export const applyFormFilters = (
  forms: GoogleFormEntry[],
  filters: FormFilters
): GoogleFormEntry[] => {
  const normalizedSearch = normalizeText(filters.search);
  const hasPreferenceFilter = hasActiveFilters(filters);
  const hasMinScore = filters.minScore > 0;
  const hasStatusFilter = filters.statuses.length > 0;

  return forms.filter((form) => {
    if (hasStatusFilter && !filters.statuses.includes(form.status ?? 'pending')) return false;
    if (!matchesPreferenceFilters(form, filters, hasPreferenceFilter)) return false;
    if (hasMinScore) {
      const score = form.evaluation?.score;
      if (score === undefined || score < filters.minScore) return false;
    }
    if (!matchesSearchTerm(form, normalizedSearch)) return false;
    return true;
  });
};
