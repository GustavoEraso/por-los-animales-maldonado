import { Suspense } from 'react';
import Loader from '@/components/Loader';
import { getActiveAnimalsData } from '@/lib/data/animals';
import AnimalsPageContent from './AnimalsPageContent';

/**
 * Admin animals page — Server Component that fetches active animals
 * and delegates interactive rendering to the client component.
 */
export default async function AnimalsPage() {
  const animals = await getActiveAnimalsData();

  return (
    <Suspense fallback={<Loader />}>
      <AnimalsPageContent initialAnimals={animals} />
    </Suspense>
  );
}
