import { cacheLife, cacheTag } from 'next/cache';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { BannerType } from '@/types';

/**
 * Fetches all banners from Firestore with server-side caching.
 *
 * Uses Next.js `'use cache'` directive to cache the result.
 * Cache is invalidated on-demand via `revalidateTag('banners')`.
 *
 * This replaces the previous 2-layer API chain
 * (/api/banners → /api/banners-cache → Firestore)
 * with a single cached function call, eliminating 1 internal Edge Request
 * and redundant Fast Data Transfer per query.
 *
 * @returns All banners from the 'banners' Firestore collection
 */
export async function getBannersData(): Promise<BannerType[]> {
  'use cache';
  cacheTag('banners', 'revalidate-all');
  cacheLife({
    stale: 600,
    revalidate: 2600000,
    expire: 2600000,
  });

  return getFirestoreData({ currentCollection: 'banners' });
}
