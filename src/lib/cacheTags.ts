export const ANIMAL_CACHE_TAGS = {
  visibleList: 'animals:list',
  activeList: 'animals:active',
  allList: 'animals:all',
} as const;

/**
 * Returns the cache tag for one animal document.
 *
 * @param animalId - The Firestore document ID
 * @returns The cache tag for the individual animal
 */
export function getAnimalCacheTag(animalId: string): string {
  return `animal:${animalId}`;
}

/**
 * Returns the public and active animal list tags and an optional individual animal tag.
 *
 * @param animalId - Optional Firestore document ID
 * @returns Cache tags that should be invalidated after an animal mutation
 */
export function getAnimalCacheTags(animalId?: string): string[] {
  const tags = [ANIMAL_CACHE_TAGS.visibleList, ANIMAL_CACHE_TAGS.activeList];

  return animalId ? [...tags, getAnimalCacheTag(animalId)] : tags;
}
