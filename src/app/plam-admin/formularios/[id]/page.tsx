import { Suspense } from 'react';
import Loader from '@/components/Loader';
import { getActiveAnimalsData } from '@/lib/data/animals';
import FormularioDetailContent from './FormularioDetailContent';

export default async function FormularioDetailPage() {
  const animals = await getActiveAnimalsData();

  return (
    <Suspense fallback={<Loader />}>
      <FormularioDetailContent initialAnimals={animals} />
    </Suspense>
  );
}
