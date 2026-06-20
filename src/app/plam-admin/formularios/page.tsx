import { Suspense } from 'react';
import Loader from '@/components/Loader';
import { getActiveAnimalsData } from '@/lib/data/animals';
import FormulariosPageContent from './FormulariosPageContent';

export default async function FormulariosPage() {
  const animals = await getActiveAnimalsData();

  return (
    <Suspense fallback={<Loader />}>
      <FormulariosPageContent initialAnimals={animals} />
    </Suspense>
  );
}
