'use server';

import { getActiveAnimalsData } from '@/lib/data/animals';

export async function fetchActiveAnimals() {
  return getActiveAnimalsData();
}
