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
 * await revalidateCache('animals');
 *
 * @example
 * // Revalidate multiple tags
 * await revalidateCache(['animals', 'banners']);
 *
 * @example
 * // Revalidate a specific animal
 * await revalidateCache(`animal-${animalId}`);
 */
export async function revalidateCache(tags: string | string[]): Promise<void> {
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://www.porlosanimalesmaldonado.org';

  const tagsArray = Array.isArray(tags) ? tags : [tags];

  const results = await Promise.allSettled(
    tagsArray.map(async (tag) => {
      const res = await fetch(`${baseUrl}/api/revalidate?tag=${encodeURIComponent(tag)}`, {
        headers: {
          'x-internal-token': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET || '',
        },
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to revalidate tag "${tag}": ${error.error}`);
      }

      return res.json();
    })
  );

  // Log any failures but don't throw (cache revalidation is not critical)
  const failures = results.filter((r) => r.status === 'rejected');
  if (failures.length > 0) {
    console.error('Some cache revalidations failed:', failures);
  }
}
