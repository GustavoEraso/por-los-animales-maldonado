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
 * Internal cached function that fetches active animals from Firestore.
 * Excludes animals with status 'adoptado' or 'fallecido'.
 * Only executes on cache MISS.
 */
async function fetchActiveAnimalsFromFirestore(): Promise<Animal[]> {
  'use cache';
  cacheTag('animals', 'revalidate-all');
  cacheLife({
    stale: 600,
    revalidate: 2600000,
    expire: 2600000,
  });

  console.log('[animals:active] 🔥 Cache MISS — fetching from Firestore');

  return getFirestoreData({
    currentCollection: 'animals',
    filter: [['status', 'not-in', ['adoptado', 'fallecido']]],
  });
}

/**
 * Fetches active animals (excluding adopted and deceased) with server-side caching.
 *
 * Uses Next.js `'use cache'` directive internally.
 * Cache is invalidated on-demand via `revalidateTag('animals')`.
 *
 * @returns Animals whose status is not 'adoptado' or 'fallecido'
 */
export async function getActiveAnimalsData(): Promise<Animal[]> {
  const start = performance.now();
  const data = await fetchActiveAnimalsFromFirestore();
  const elapsed = (performance.now() - start).toFixed(1);

  console.log(`[animals:active] ✅ Returned ${data.length} animals in ${elapsed}ms`);

  return data;
}

/**
 * Internal cached function that fetches ALL animals from Firestore.
 * No filters applied — returns every document including non-visible,
 * adopted, deceased, etc. Used for admin dashboards and analytics.
 * Only executes on cache MISS.
 */
async function fetchAllAnimalsFromFirestore(): Promise<Animal[]> {
  'use cache';
  cacheTag('animals', 'revalidate-all');
  cacheLife({
    stale: 600,
    revalidate: 2600000,
    expire: 2600000,
  });

  console.log('[animals:all] 🔥 Cache MISS — fetching from Firestore');

  return getFirestoreData({ currentCollection: 'animals' });
}

/**
 * Fetches ALL animals with server-side caching and logging.
 *
 * Returns every animal without filters (including non-visible,
 * adopted, deceased, etc.). Intended for admin dashboards and analytics.
 *
 * Cache is invalidated on-demand via `revalidateTag('animals')`.
 *
 * @returns All animals from the 'animals' Firestore collection
 */
export async function getAllAnimalsData(): Promise<Animal[]> {
  const start = performance.now();
  const data = await fetchAllAnimalsFromFirestore();
  const elapsed = (performance.now() - start).toFixed(1);

  console.log(`[animals:all] ✅ Returned ${data.length} animals in ${elapsed}ms`);

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
