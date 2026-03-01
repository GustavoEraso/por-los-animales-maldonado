import { Suspense } from 'react';
import Loader from '@/components/Loader';
import { getAllAnimalsData } from '@/lib/data/animals';
import { getUsersData } from '@/lib/data/users';
import DashboardContent from './DashboardContent';

/**
 * Admin dashboard page — Server Component that fetches all animals
 * and users, then delegates interactive rendering to the client component.
 */
export default async function PlamAdmin() {
  const [animals, users] = await Promise.all([getAllAnimalsData(), getUsersData()]);

  return (
    <Suspense fallback={<Loader />}>
      <DashboardContent initialAnimals={animals} initialUsers={users} />
    </Suspense>
  );
}
