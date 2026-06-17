import { logger } from '@/lib/logger';
import { cacheLife, cacheTag } from 'next/cache';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import { SponsorType, CarouselType, CarouselsConfigType } from '@/types';

/**
 * Fetches all sponsors from Firestore with server-side caching.
 * Returns the master list sorted alphabetically by name.
 * Cache is invalidated on-demand via `revalidateTag('sponsors')`.
 *
 * @returns All sponsors from the 'sponsors' Firestore collection.
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
    return sponsors.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    logger({ level: 'error', code: 'FETCH_SPONSORS', message: '[sponsors] Error fetching sponsors:', data: error });
    return [];
  }
}

/**
 * Fetches active carousels for a given page placement, ordered by the
 * `config/carouselsConfig` singleton document.
 *
 * Flow:
 *  1. Fetch all carousels + the placement config in parallel.
 *  2. Build a map for O(1) lookups.
 *  3. Walk the ordered ID array for the requested place, keeping only active carousels.
 *
 * @param place - The page where carousels should be shown (e.g. 'home', 'adopta').
 * @returns Active carousel documents for the given place, in the configured order.
 */
export async function getCarouselsForPlace(place: string): Promise<CarouselType[]> {
  'use cache';
  cacheTag('sponsors', 'revalidate-all');
  cacheLife({
    stale: 600,
    revalidate: 2600000,
    expire: 2600000,
  });

  try {
    const [allCarousels, config] = await Promise.all([
      getFirestoreData({ currentCollection: 'carousels' }),
      getFirestoreDocById<CarouselsConfigType>({
        currentCollection: 'config',
        id: 'carouselsConfig',
      }),
    ]);

    if (!config) return [];

    const orderedIds: string[] = config[place] ?? [];
    const carouselMap = new Map<string, CarouselType>(allCarousels.map((c) => [c.id, c]));

    return orderedIds
      .map((id) => carouselMap.get(id))
      .filter((c): c is CarouselType => c !== undefined && c.active);
  } catch (error) {
    logger({ level: 'error', code: 'FETCH_CAROUSELS', message: `[carousels] Error fetching carousels for place '${place}':`, data: error });
    return [];
  }
}
