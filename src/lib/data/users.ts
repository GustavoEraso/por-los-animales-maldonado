import { cacheLife, cacheTag } from 'next/cache';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { UserType } from '@/types';

/**
 * Internal cached function that fetches users from Firestore.
 * Only executes on cache MISS — on cache HIT, Next.js returns
 * the cached result without running this function body.
 */
async function fetchUsersFromFirestore(): Promise<UserType[]> {
  'use cache';
  cacheTag('users', 'revalidate-all');
  cacheLife({
    stale: 600,
    revalidate: 2600000,
    expire: 2600000,
  });

  console.log('[users] 🔥 Cache MISS — fetching from Firestore');

  return getFirestoreData({ currentCollection: 'authorizedEmails' });
}

/**
 * Fetches authorized users with server-side caching and logging.
 *
 * Uses Next.js `'use cache'` directive internally to cache the result.
 * Cache is invalidated on-demand via `revalidateTag('users')`.
 *
 * @returns All users from the 'authorizedEmails' Firestore collection
 */
export async function getUsersData(): Promise<UserType[]> {
  const start = performance.now();
  const data = await fetchUsersFromFirestore();
  const elapsed = (performance.now() - start).toFixed(1);

  console.log(`[users] ✅ Returned ${data.length} users in ${elapsed}ms`);

  return data;
}
