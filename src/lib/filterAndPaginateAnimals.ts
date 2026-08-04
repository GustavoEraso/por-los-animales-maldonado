import type { Filters, PaginatedResponse } from '@/lib/fetchAnimal';
import type { Animal } from '@/types';

const SIZE_ORDER: Record<string, number> = {
  pequeño: 1,
  mediano: 2,
  grande: 3,
  no_se_sabe: 4,
};

const LIFE_STAGE_ORDER: Record<string, number> = {
  cachorro: 1,
  joven: 2,
  adulto: 3,
};

type StringFilter = string | string[] | undefined;
type SortValue = string | number | boolean | undefined;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function matchesStringFilter(
  actual: string | undefined,
  expected: StringFilter,
  shouldNormalize = true
): boolean {
  if (expected === undefined) return true;
  if (actual === undefined) return false;

  const expectedValues = Array.isArray(expected) ? expected : [expected];
  return expectedValues.some((value) =>
    shouldNormalize ? normalize(actual) === normalize(value) : actual === value
  );
}

function matchesBooleanFilter(actual: boolean | undefined, expected: boolean | undefined): boolean {
  return expected === undefined || actual === expected;
}

function matchesNumberFilter(actual: number | undefined, expected: number | undefined): boolean {
  return expected === undefined || actual === expected;
}

function matchesAnimal(animal: Animal, filters: Filters): boolean {
  if (!matchesStringFilter(animal.id, filters.id, false)) return false;
  if (!matchesStringFilter(animal.gender, filters.gender)) return false;
  if (!matchesStringFilter(animal.species, filters.species)) return false;
  if (!matchesStringFilter(animal.lifeStage, filters.lifeStage)) return false;
  if (!matchesStringFilter(animal.size, filters.size)) return false;
  if (!matchesStringFilter(animal.status, filters.status)) return false;
  if (!matchesStringFilter(animal.litterId, filters.litterId)) return false;
  if (!matchesBooleanFilter(animal.isAvailable, filters.isAvailable)) return false;
  if (!matchesBooleanFilter(animal.isVisible, filters.isVisible)) return false;
  if (!matchesBooleanFilter(animal.isDeleted, filters.isDeleted)) return false;
  if (!matchesNumberFilter(animal.aproxBirthDate, filters.aproxBirthDate)) return false;
  if (
    filters.nameIncludes !== undefined &&
    !normalize(animal.name).includes(normalize(filters.nameIncludes))
  ) {
    return false;
  }
  if (filters.minWaitingSince !== undefined && animal.waitingSince < filters.minWaitingSince) {
    return false;
  }

  return true;
}

function getSortableValue(animal: Animal, sortBy: NonNullable<Filters['sortBy']>): SortValue {
  switch (sortBy) {
    case 'name':
      return animal.name;
    case 'waitingSince':
      return animal.waitingSince;
    case 'isAvailable':
      return animal.isAvailable;
    case 'aproxBirthDate':
      return animal.aproxBirthDate;
    case 'gender':
      return animal.gender;
    case 'species':
      return animal.species;
    case 'size':
      return animal.size;
    case 'lifeStage':
      return animal.lifeStage;
  }
}

function compareAnimals(
  first: Animal,
  second: Animal,
  sortBy: NonNullable<Filters['sortBy']>,
  sortOrder: 'asc' | 'desc'
): number {
  const firstValue = getSortableValue(first, sortBy);
  const secondValue = getSortableValue(second, sortBy);
  const direction = sortOrder === 'asc' ? 1 : -1;

  if (sortBy === 'size' && typeof firstValue === 'string' && typeof secondValue === 'string') {
    return direction * (SIZE_ORDER[firstValue] - SIZE_ORDER[secondValue]);
  }

  if (sortBy === 'lifeStage' && typeof firstValue === 'string' && typeof secondValue === 'string') {
    return direction * (LIFE_STAGE_ORDER[firstValue] - LIFE_STAGE_ORDER[secondValue]);
  }

  if (typeof firstValue === 'string' && typeof secondValue === 'string') {
    return direction * firstValue.localeCompare(secondValue);
  }

  if (typeof firstValue === 'number' && typeof secondValue === 'number') {
    return direction * (firstValue - secondValue);
  }

  return 0;
}

/**
 * Filters, sorts, and paginates animals for the public adoption listing.
 *
 * @param animals - Visible animals loaded from the cached data layer
 * @param filters - Filters parsed from the adoption page URL
 * @returns Paginated adoption results
 */
export function filterAndPaginateAnimals(animals: Animal[], filters: Filters): PaginatedResponse {
  const filteredAnimals = animals.filter((animal) => matchesAnimal(animal, filters));
  const sortedAnimals = filters.sortBy
    ? [...filteredAnimals].sort((first, second) =>
        compareAnimals(first, second, filters.sortBy ?? 'name', filters.sortOrder ?? 'asc')
      )
    : filteredAnimals;

  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.max(1, Math.min(100, filters.limit ?? 12));
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  return {
    data: sortedAnimals.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: sortedAnimals.length,
      totalPages: Math.ceil(sortedAnimals.length / limit),
      hasNextPage: endIndex < sortedAnimals.length,
      hasPrevPage: page > 1,
    },
  };
}
