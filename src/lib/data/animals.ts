import { cacheLife, cacheTag } from 'next/cache';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import { Animal } from '@/types';

/**
 * Internal cached function that fetches animals from Firestore.
 * Only executes on cache MISS — on cache HIT, Next.js returns
 * the cached result without running this function body.
 */
async function fetchAnimalsFromFirestore(): Promise<Animal[]> {
  'use cache';
  cacheTag('animals', 'revalidate-all');
  cacheLife({
    stale: 600,
    revalidate: 2600000,
    expire: 2600000,
  });

  console.log('[animals] 🔥 Cache MISS — fetching from Firestore');

  return getFirestoreData({
    currentCollection: 'animals',
    filter: [['isVisible', '==', true]],
  });
}

/**
 * Fetches visible animals with server-side caching and logging.
 *
 * Uses Next.js `'use cache'` directive internally to cache the result.
 * Cache is invalidated on-demand via `revalidateTag('animals')`.
 *
 * Only returns visible animals (`isVisible === true`).
 * For admin access to all animals, use a separate data function or API.
 *
 * @returns Visible animals from the 'animals' Firestore collection
 */
export async function getAnimalsData(): Promise<Animal[]> {
  const start = performance.now();
  const data = await fetchAnimalsFromFirestore();
  const elapsed = (performance.now() - start).toFixed(1);

  console.log(`[animals] ✅ Returned ${data.length} animals in ${elapsed}ms`);

  return data;
}

/**
 * Internal cached function that fetches a single animal by ID from Firestore.
 * Only executes on cache MISS.
 */
async function fetchAnimalById(id: string): Promise<Animal | null> {
  'use cache';
  cacheTag('animals', 'revalidate-all');
  cacheLife({
    stale: 30,
    revalidate: 2600000,
    expire: 2600000,
  });

  console.log(`[animal:${id}] 🔥 Cache MISS — fetching from Firestore`);

  return getFirestoreDocById<Animal>({
    currentCollection: 'animals',
    id,
  });
}

/**
 * Fetches a single animal by ID with server-side caching and logging.
 *
 * Uses Next.js `'use cache'` directive internally. Each unique ID
 * creates its own cache entry, invalidated via `revalidateTag('animals')`.
 *
 * @param id - The animal document ID
 * @returns The animal data, or null if not found
 */
export async function getAnimalById(id: string): Promise<Animal | null> {
  const start = performance.now();
  const animal = await fetchAnimalById(id);
  const elapsed = (performance.now() - start).toFixed(1);

  console.log(
    `[animal:${id}] ✅ ${animal ? `Found "${animal.name}"` : 'Not found'} in ${elapsed}ms`
  );

  return animal;
}
