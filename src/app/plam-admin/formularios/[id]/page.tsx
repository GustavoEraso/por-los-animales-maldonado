import { Suspense } from 'react';
import Loader from '@/components/Loader';
import { getActiveAnimalsData } from '@/lib/data/animals';
import { getUsersData } from '@/lib/data/users';
import FormularioDetailContent from './FormularioDetailContent';

export default async function FormularioDetailPage() {
  const animals = await getActiveAnimalsData();
  const users = await getUsersData();

  return (
    <Suspense fallback={<Loader />}>
      <FormularioDetailContent initialAnimals={animals} initialUsers={users} />
    </Suspense>
  );
}
