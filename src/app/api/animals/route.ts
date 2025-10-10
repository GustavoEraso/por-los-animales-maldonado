import { NextRequest, NextResponse } from 'next/server';
import { Animal } from '@/types';

// Fields that should not be normalized for text comparison
const EXCLUDE_NORMALIZATION: (keyof Animal)[] = ['id', 'waitingSince'];

// Size order mapping for logical sorting (small to large)
const SIZE_ORDER: Record<string, number> = {
  pequeño: 1,
  mediano: 2,
  grande: 3,
  no_se_sabe: 4,
};

// Life stage order mapping for logical sorting (young to old)
const LIFE_STAGE_ORDER: Record<string, number> = {
  cachorro: 1,
  joven: 2,
  adulto: 3,
};

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
 * IMPORTANT: Filters now support both single values and arrays for multi-filtering.
 * When an array is provided, it performs an OR operation (matches any value in array).
 *
 * @param {NextRequest} req - Request object containing filter criteria in JSON body
 *
 * @body {Object} filters - Filter criteria object
 * @body {string | string[]} [filters.species] - Filter by species: "perro" | "gato" | "otros" (supports array for OR filtering)
 * @body {string | string[]} [filters.gender] - Filter by gender: "macho" | "hembra" (supports array for OR filtering)
 * @body {string | string[]} [filters.status] - Filter by status: "calle" | "protectora" | "transitorio" | "adoptado" (supports array for OR filtering)
 * @body {string | string[]} [filters.size] - Filter by size: "pequeño" | "mediano" | "grande" | "no_se_sabe" (supports array for OR filtering)
 * @body {string | string[]} [filters.lifeStage] - Filter by life stage: "cachorro" | "joven" | "adulto" (supports array for OR filtering)
 * @body {boolean} [filters.isAvalible] - Filter by availability status
 * @body {boolean} [filters.isVisible] - Filter by visibility status
 * @body {boolean} [filters.isDeleted] - Filter by deleted status (automatically excludes deleted animals)
 * @body {string} [filters.nameIncludes] - Search animals whose name contains this text (accent-insensitive)
 * @body {number} [filters.minWaitingSince] - Filter animals waiting since at least this timestamp
 * @body {string} [filters.sortBy] - Field to sort by: "name" | "waitingSince" | "aproxBirthDate" | "isAvalible" | "gender" | "species" | "size" | "lifeStage"
 * @body {string} [filters.sortOrder="asc"] - Sort order: "asc" | "desc"
 * @body {number} [filters.page=1] - Page number for pagination (1-indexed)
 * @body {number} [filters.limit=12] - Number of results per page
 *
 * @returns {NextResponse<{data: Animal[], pagination: PaginationMeta}>} JSON response with paginated animals and metadata
 * @returns {NextResponse<{error: string}>} Error response with 500 status on failure
 *
 * @example
 * ```typescript
 * // Single value filter - Search for available dogs
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
 * // Multi-value filter (OR logic) - Search for dogs OR cats
 * const response = await fetch('/api/animals', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     species: ['perro', 'gato'],  // Returns dogs OR cats
 *     size: ['pequeño', 'mediano'], // That are small OR medium
 *     sortBy: 'name'
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
 *
 * // Complex multi-filter example
 * const response = await fetch('/api/animals', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     species: ['perro', 'gato'],      // Dogs OR cats
 *     gender: 'hembra',                 // Female only
 *     lifeStage: ['cachorro', 'joven'], // Puppies OR young
 *     size: ['pequeño', 'mediano'],     // Small OR medium
 *     isVisible: true,
 *     sortBy: 'waitingSince',
 *     sortOrder: 'desc',
 *     page: 2,                          // Page 2
 *     limit: 12                         // 12 results per page
 *   })
 * });
 * ```
 *
 * @note
 * - Uses Next.js native fetch caching with 60-second revalidation for reliable
 *   performance in Vercel serverless environment.
 * - Text searches are accent-insensitive and case-insensitive.
 * - Automatically excludes deleted animals (isDeleted: true).
 * - Array filters perform OR logic: ['perro', 'gato'] matches perro OR gato.
 * - Size and lifeStage sorting use logical ordering (small→large, young→old)
 *   instead of alphabetical ordering.
 * - Retrocompatible: existing code using single values will continue to work.
 * - Returns paginated results with metadata when page/limit provided.
 * - For backward compatibility, if no pagination params provided, returns all results.
 */
export async function POST(req: NextRequest) {
  try {
    const { sortBy, sortOrder = 'asc', page, limit, ...filters } = await req.json();

    // Get animals from cache using Next.js native caching
    const animals = await getAnimalsFromCache();

    // Main filtering logic
    const filtered = animals?.filter((animal: Animal) => {
      if (animal.isDeleted) return false;
      const exactMatches = Object.entries(filters).every(([key, value]) => {
        if (['minWaitingSince', 'nameIncludes'].includes(key)) return true;

        const animalVal = animal[key as keyof Animal];
        if (value === undefined || animalVal === undefined) return true;

        // NEW: Support for array filters (multiple values for same field)
        // This is retrocompatible - existing code with strings will continue to work
        if (Array.isArray(value)) {
          // Handle string fields
          if (typeof animalVal === 'string') {
            if (EXCLUDE_NORMALIZATION.includes(key as keyof Animal)) {
              return value.includes(animalVal);
            }
            // Check if any value in array matches (normalized)
            return value.some(
              (v) => typeof v === 'string' && normalize(animalVal) === normalize(v)
            );
          }
          // Handle number/boolean fields
          if (typeof animalVal === 'number' || typeof animalVal === 'boolean') {
            return value.includes(animalVal);
          }
          return false;
        }

        // EXISTING: Single value comparison (unchanged for retrocompatibility)
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
        'lifeStage',
      ].includes(sortBy)
    ) {
      if (!filtered) return NextResponse.json([]);
      finalResults = [...filtered].sort((a, b) => {
        const aVal = a[sortBy as keyof Animal];
        const bVal = b[sortBy as keyof Animal];

        // Special case for size field - use logical ordering instead of alphabetical
        if (sortBy === 'size' && typeof aVal === 'string' && typeof bVal === 'string') {
          const aOrder = SIZE_ORDER[aVal] || 999;
          const bOrder = SIZE_ORDER[bVal] || 999;
          return sortOrder === 'asc' ? aOrder - bOrder : bOrder - aOrder;
        }

        // Special case for lifeStage field - use logical ordering (young to old)
        if (sortBy === 'lifeStage' && typeof aVal === 'string' && typeof bVal === 'string') {
          const aOrder = LIFE_STAGE_ORDER[aVal] || 999;
          const bOrder = LIFE_STAGE_ORDER[bVal] || 999;
          return sortOrder === 'asc' ? aOrder - bOrder : bOrder - aOrder;
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    }

    // Apply pagination if requested
    if (page !== undefined && limit !== undefined) {
      const pageNum = Math.max(1, page); // Ensure page is at least 1
      const limitNum = Math.max(1, Math.min(100, limit)); // Limit between 1-100
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedResults = finalResults.slice(startIndex, endIndex);

      return NextResponse.json({
        data: paginatedResults,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: finalResults.length,
          totalPages: Math.ceil(finalResults.length / limitNum),
          hasNextPage: endIndex < finalResults.length,
          hasPrevPage: pageNum > 1,
        },
      });
    }

    // Return all results if no pagination params (backward compatibility)
    return NextResponse.json(finalResults);
  } catch (err) {
    console.error('Error filtering animals:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
