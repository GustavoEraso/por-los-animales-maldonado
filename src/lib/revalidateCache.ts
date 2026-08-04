/**
 * Revalidates cache tags via the revalidate API endpoint.
 *
 * This helper simplifies cache invalidation from client components by calling
 * the /api/revalidate endpoint with the appropriate authentication.
 *
 * @param tags - A single tag or array of tags to revalidate
 * @returns Promise that resolves when all tags have been revalidated
 *
 * @example
 * // Revalidate a single tag
 * await revalidateCache('animals:list');
 *
 * @example
 * // Revalidate multiple tags in one request
 * await revalidateCache(['animals:list', 'animals:active']);
 *
 * @example
 * // Revalidate a specific animal
 * await revalidateCache(`animal:${animalId}`);
 */
import { logger } from '@/lib/logger';
import { getAnimalCacheTags } from '@/lib/cacheTags';

export async function revalidateCache(tags: string | string[]): Promise<void> {
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://www.porlosanimalesmaldonado.org';

  const tagsArray = Array.isArray(tags) ? tags : [tags];
  if (tagsArray.length === 0) return;

  try {
    const encodedTags = tagsArray.map((tag) => encodeURIComponent(tag)).join(',');
    const res = await fetch(`${baseUrl}/api/revalidate?tags=${encodedTags}`, {
      headers: {
        'x-internal-token': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET || '',
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to revalidate tags "${tagsArray.join(', ')}": ${error.error}`);
    }
  } catch (error) {
    // Log failures but do not block the completed data mutation.
    logger({
      level: 'error',
      code: 'REVALIDATE_CACHE',
      message: 'Cache revalidation failed:',
      data: error,
    });
  }
}

/**
 * Invalidates the animal list caches and, when provided, one individual animal cache.
 *
 * @param animalId - Optional Firestore document ID
 * @returns Promise that resolves after the invalidation request completes
 */
export async function revalidateAnimalCache(animalId?: string): Promise<void> {
  await revalidateCache(getAnimalCacheTags(animalId));
}
