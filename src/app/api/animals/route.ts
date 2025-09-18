import { NextRequest, NextResponse } from 'next/server';
import { Animal } from '@/types';

// Fields that should not be normalized for text comparison
const EXCLUDE_NORMALIZATION: (keyof Animal)[] = ['id', 'waitingSince'];

/**
 * Normalizes text by removing accents, converting to lowercase and trimming whitespace.
 * Used for case-insensitive and accent-insensitive text comparisons.
 *
 * @param {string} str - Text string to normalize
 * @returns {string} Normalized text without accents, lowercase and trimmed
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Fetches animals data from the internal cache API with Next.js native caching.
 * This function uses Next.js fetch with revalidation for reliable caching in Vercel.
 *
 * @returns {Promise<Animal[]>} Promise that resolves to array of animals
 * @throws {Error} If the cache API request fails
 */
async function getAnimalsFromCache(): Promise<Animal[]> {
  const baseUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://www.porlosanimalesmaldonado.com';

  const res = await fetch(`${baseUrl}/api/animals-cache`, {
    headers: {
      'x-internal-token': process.env.INTERNAL_API_SECRET!,
    },
    next: { revalidate: 60 }, // Next.js will cache for 60 seconds
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch animals cache: ${res.status}`);
  }

  return res.json();
}

/**
 * POST /api/animals - Filter and search animals with Next.js native caching
 *
 * Retrieves animals from the internal cache API and applies filtering, searching,
 * and sorting based on the provided criteria. Uses Next.js fetch with revalidation
 * for reliable caching in Vercel serverless environment. Supports text normalization
 * for accent-insensitive searches and multiple filter combinations.
 *
 * @param {NextRequest} req - Request object containing filter criteria in JSON body
 *
 * @body {Object} filters - Filter criteria object
 * @body {string} [filters.species] - Filter by species: "perro" | "gato" | "otros"
 * @body {string} [filters.gender] - Filter by gender: "macho" | "hembra"
 * @body {string} [filters.status] - Filter by status: "calle" | "protectora" | "transitorio" | "adoptado"
 * @body {string} [filters.size] - Filter by size: "pequeño" | "mediano" | "grande"
 * @body {string} [filters.lifeStage] - Filter by life stage: "cachorro" | "adulto" | "mayor"
 * @body {boolean} [filters.isAvalible] - Filter by availability status
 * @body {boolean} [filters.isVisible] - Filter by visibility status
 * @body {string} [filters.nameIncludes] - Search animals whose name contains this text
 * @body {number} [filters.minWaitingSince] - Filter animals waiting since at least this timestamp
 * @body {string} [filters.sortBy] - Field to sort by: "name" | "waitingSince" | "aproxBirthDate" | "isAvalible" | "isVisible" | "gender" | "species" | "size"
 * @body {string} [filters.sortOrder="asc"] - Sort order: "asc" | "desc"
 *
 * @returns {NextResponse<Animal[]>} JSON response with filtered animals array
 * @returns {NextResponse<{error: string}>} Error response with 500 status on failure
 *
 * @example
 * ```typescript
 * // Search for available dogs
 * const response = await fetch('/api/animals', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     species: 'perro',
 *     isAvalible: true,
 *     sortBy: 'name',
 *     sortOrder: 'asc'
 *   })
 * });
 *
 * // Search by name with text inclusion
 * const response = await fetch('/api/animals', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     nameIncludes: 'luna',
 *     sortBy: 'waitingSince',
 *     sortOrder: 'desc'
 *   })
 * });
 * ```
 *
 * @note Uses Next.js native fetch caching with 60-second revalidation for reliable
 * performance in Vercel serverless environment. Text searches are accent-insensitive
 * and case-insensitive. Automatically excludes deleted animals (isDeleted: true).
 */
export async function POST(req: NextRequest) {
  try {
    const { sortBy, sortOrder = 'asc', ...filters } = await req.json();

    // Get animals from cache using Next.js native caching
    const animals = await getAnimalsFromCache();

    // Main filtering logic
    const filtered = animals?.filter((animal: Animal) => {
      if (animal.isDeleted) return false;
      const exactMatches = Object.entries(filters).every(([key, value]) => {
        if (['minWaitingSince', 'nameIncludes'].includes(key)) return true;

        const animalVal = animal[key as keyof Animal];
        if (value === undefined || animalVal === undefined) return true;

        if (typeof animalVal === 'string' && typeof value === 'string') {
          if (EXCLUDE_NORMALIZATION.includes(key as keyof Animal)) {
            return animalVal === value;
          }
          return normalize(animalVal) === normalize(value);
        }

        if (typeof animalVal === 'number' || typeof animalVal === 'boolean') {
          return animalVal === value;
        }

        return true; // ignore arrays/objects
      });

      const matchesName =
        !filters.nameIncludes || normalize(animal.name).includes(normalize(filters.nameIncludes));

      const matchesWait =
        filters.minWaitingSince === undefined || animal.waitingSince >= filters.minWaitingSince;

      return exactMatches && matchesName && matchesWait;
    });

    // Apply sorting if specified
    let finalResults = filtered;

    if (
      sortBy &&
      [
        'name',
        'waitingSince',
        'aproxBirthDate',
        'isAvalible',
        'isVisible',
        'gender',
        'species',
        'size',
      ].includes(sortBy)
    ) {
      if (!filtered) return NextResponse.json([]);
      finalResults = [...filtered].sort((a, b) => {
        const aVal = a[sortBy as keyof Animal];
        const bVal = b[sortBy as keyof Animal];

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    }

    return NextResponse.json(finalResults);
  } catch (err) {
    console.error('Error filtering animals:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
