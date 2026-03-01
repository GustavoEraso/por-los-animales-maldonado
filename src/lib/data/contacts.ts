import { cacheLife, cacheTag } from 'next/cache';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { WpContactType } from '@/types';

/**
 * Fetches all WhatsApp contacts from Firestore with server-side caching.
 *
 * Uses Next.js `'use cache'` directive to cache the result.
 * Cache is invalidated on-demand via `revalidateTag('contacts')`.
 *
 * This replaces the previous 2-layer API chain
 * (/api/contacts → /api/contacts-cache → Firestore)
 * with a single cached function call, eliminating 1 internal Edge Request
 * and redundant Fast Data Transfer per query.
 *
 * @returns All contacts from the 'contacts' Firestore collection
 */
export async function getContactsData(): Promise<WpContactType[]> {
  'use cache';
  cacheTag('contacts', 'revalidate-all');
  cacheLife({
    stale: 600,
    revalidate: 2600000,
    expire: 2600000,
  });

  return getFirestoreData({ currentCollection: 'contacts' });
}
