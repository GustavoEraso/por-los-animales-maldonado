import { Animal } from '@/types';
import { Filters } from '@/lib/fetchAnimal';

/**
 * Type guards for validating URL search parameters
 */

export const isValidSpecies = (value: string): value is Animal['species'] => {
  return value === 'perro' || value === 'gato' || value === 'otros';
};

export const isValidSize = (value: string): value is Animal['size'] => {
  return value === 'pequeño' || value === 'mediano' || value === 'grande' || value === 'no_se_sabe';
};

export const isValidGender = (value: string): value is Animal['gender'] => {
  return value === 'macho' || value === 'hembra';
};

export const isValidLifeStage = (value: string): value is Animal['lifeStage'] => {
  return value === 'cachorro' || value === 'joven' || value === 'adulto';
};

export const isValidSortBy = (value: string): value is NonNullable<Filters['sortBy']> => {
  return (
    value === 'name' ||
    value === 'aproxBirthDate' ||
    value === 'size' ||
    value === 'lifeStage' ||
    value === 'waitingSince'
  );
};

export const isValidSortOrder = (value: string): value is 'asc' | 'desc' => {
  return value === 'asc' || value === 'desc';
};

/**
 * Builds filters object from URL search parameters
 *
 * By default, this function always returns pagination parameters (page: 1, limit: 12)
 * to ensure the /adopta page is always paginated.
 *
 * @param searchParams - URL search parameters object
 * @returns Filters object ready to be used with fetchAnimals (always includes pagination)
 *
 * @example
 * // No params - defaults to page 1, limit 12
 * const filters = buildFiltersFromSearchParams({});
 * // { isVisible: true, page: 1, limit: 12 }
 *
 * @example
 * // With filters - maintains pagination
 * const params = { especies: 'perro,gato', tamanos: 'pequeño', pagina: '2' };
 * const filters = buildFiltersFromSearchParams(params);
 * // { species: ['perro', 'gato'], size: 'pequeño', isVisible: true, page: 2, limit: 12 }
 */
export function buildFiltersFromSearchParams(searchParams: {
  nombre?: string;
  especies?: string;
  tamanos?: string;
  generos?: string;
  etapasVida?: string;
  ordenarPor?: string;
  orden?: string;
  pagina?: string;
  limite?: string;
}): Filters {
  const filters: Filters = {
    isVisible: true,
  };

  // Name filter
  if (searchParams.nombre) {
    filters.nameIncludes = searchParams.nombre;
  }

  // Species filter (multi-select)
  if (searchParams.especies) {
    const speciesArray = searchParams.especies.split(',').filter(isValidSpecies);
    if (speciesArray.length > 0) {
      filters.species = speciesArray.length === 1 ? speciesArray[0] : speciesArray;
    }
  }

  // Size filter (multi-select)
  if (searchParams.tamanos) {
    const sizesArray = searchParams.tamanos.split(',').filter(isValidSize);
    if (sizesArray.length > 0) {
      filters.size = sizesArray.length === 1 ? sizesArray[0] : sizesArray;
    }
  }

  // Gender filter (multi-select)
  if (searchParams.generos) {
    const gendersArray = searchParams.generos.split(',').filter(isValidGender);
    if (gendersArray.length > 0) {
      filters.gender = gendersArray.length === 1 ? gendersArray[0] : gendersArray;
    }
  }

  // Life stage filter (multi-select)
  if (searchParams.etapasVida) {
    const lifeStagesArray = searchParams.etapasVida.split(',').filter(isValidLifeStage);
    if (lifeStagesArray.length > 0) {
      filters.lifeStage = lifeStagesArray.length === 1 ? lifeStagesArray[0] : lifeStagesArray;
    }
  }

  // Sort by filter
  if (searchParams.ordenarPor && isValidSortBy(searchParams.ordenarPor)) {
    filters.sortBy = searchParams.ordenarPor;
  }

  // Sort order filter
  if (searchParams.orden && isValidSortOrder(searchParams.orden)) {
    filters.sortOrder = searchParams.orden;
  }

  // Pagination - always enabled by default
  // Page number (default to 1 if not specified)
  const pageNum = searchParams.pagina ? parseInt(searchParams.pagina, 10) : 1;
  if (!isNaN(pageNum) && pageNum > 0) {
    filters.page = pageNum;
  } else {
    filters.page = 1; // Default to page 1
  }

  // Items per page (default to 12)
  const limitNum = searchParams.limite ? parseInt(searchParams.limite, 10) : 12;
  if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) {
    filters.limit = limitNum;
  } else {
    filters.limit = 12; // Default to 12 items per page
  }

  return filters;
}
