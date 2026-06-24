import { Suspense } from 'react';
import Loader from '@/components/Loader';
import { getActiveAnimalsData } from '@/lib/data/animals';
import { getUsersData } from '@/lib/data/users';
import FormulariosPageContent from './FormulariosPageContent';

export default async function FormulariosPage() {
  const animals = await getActiveAnimalsData();
  const users = await getUsersData();

  return (
    <Suspense fallback={<Loader />}>
      <FormulariosPageContent initialAnimals={animals} initialUsers={users} />
    </Suspense>
  );
}
