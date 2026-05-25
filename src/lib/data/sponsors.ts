import { cacheLife, cacheTag } from 'next/cache';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { SponsorType } from '@/types';

/**
 * Fetches all sponsors from Firestore with server-side caching.
 *
 * Uses Next.js `'use cache'` directive to cache the result.
 * Cache is invalidated on-demand via `revalidateTag('sponsors')`.
 *
 * @returns All sponsors from the 'sponsors' Firestore collection, sorted by order field.
 */
export async function getSponsorsData(): Promise<SponsorType[]> {
  'use cache';
  cacheTag('sponsors', 'revalidate-all');
  cacheLife({
    stale: 600,
    revalidate: 2600000,
    expire: 2600000,
  });

  try {
    const sponsors = await getFirestoreData({ currentCollection: 'sponsors' });
    return sponsors.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (error) {
    console.error('[sponsors] Error fetching sponsors:', error);
    return [];
  }
}
