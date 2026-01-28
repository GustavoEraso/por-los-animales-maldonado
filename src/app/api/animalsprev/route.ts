import { NextResponse } from 'next/server';
import { Animal } from '@/types';
import { cacheLife } from 'next/dist/server/use-cache/cache-life';
import { cacheTag } from 'next/dist/server/use-cache/cache-tag';

/**
 * Fetches animals data from the internal cache API with Next.js native caching.
 * This function uses Next.js fetch with revalidation for reliable caching in Vercel.
 *
 * @returns {Promise<Animal[]>} Promise that resolves to array of animals
 * @throws {Error} If the cache API request fails
 */
async function getAnimalsFromCache(): Promise<Animal[]> {
  'use cache';
  cacheTag('animals', 'revalidate-all');
  cacheLife({
    stale: 30,
    revalidate: 2600000,
    expire: 2600000,
  });

  const baseUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://www.porlosanimalesmaldonado.org';

  const res = await fetch(`${baseUrl}/api/animals-cache`, {
    headers: {
      'x-internal-token': process.env.INTERNAL_API_SECRET!,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch animals cache: ${res.status}`);
  }

  return res.json();
}

/**
 * GET /api/animalsprev - Retrieve animals with Next.js native caching
 *
 * Public API endpoint that retrieves all animal information for the
 * organization. Uses Next.js fetch with revalidation for reliable caching in
 * Vercel serverless environment. Used by animal components throughout the application.
 *
 * @returns {NextResponse<Animal[]>} JSON response with animals array
 * @returns {NextResponse<{error: string}>} Error response with 500 status on failure
 *
 * @example
 * ```typescript
 * // Fetch animals for display
 * const response = await fetch('/api/animalsprev');
 * const animals = await response.json();
 *
 * // Use in animal component
 * animals.forEach(animal => {
 *   console.log(`${animal.name}: ${animal.species}`);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // React component usage
 * const [animals, setAnimals] = useState<Animal[]>([]);
 *
 * useEffect(() => {
 *   fetch('/api/animalsprev')
 *     .then(res => res.json())
 *     .then(setAnimals);
 * }, []);
 * ```
 *
 * @note Uses Next.js native fetch caching with cache components for reliable
 * performance in Vercel serverless environment. This is a public endpoint that
 * does not require authentication.
 */
export async function GET(): Promise<NextResponse<Animal[] | { error: string }>> {
  try {
    // Get animals from cache using Next.js native caching
    const data = await getAnimalsFromCache();

    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching animals:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
