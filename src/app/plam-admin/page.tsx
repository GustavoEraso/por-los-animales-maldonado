import { Suspense } from 'react';
import Loader from '@/components/Loader';
import { getActiveAnimalsData } from '@/lib/data/animals';
import { getUsersData } from '@/lib/data/users';
import { getDashboardAnalyticsData } from '@/lib/data/dashboardAnalytics';
import DashboardContent from './DashboardContent';

/**
 * Admin dashboard page — Server Component that fetches all animals,
 * users, and dashboard analytics, then delegates interactive rendering
 * to the client component.
 *
 * Dashboard analytics are read from the public dashboardAnalytics collection
 * (cached server-side via 'use cache'), eliminating the need for client-side
 * transaction queries that required authentication.
 */
export default async function PlamAdmin() {
  const [animals, users, analytics] = await Promise.all([
    getActiveAnimalsData(),
    getUsersData(),
    getDashboardAnalyticsData(),
  ]);

  return (
    <Suspense fallback={<Loader />}>
      <DashboardContent
        initialAnimals={animals}
        initialUsers={users}
        initialAnalytics={analytics}
      />
    </Suspense>
  );
}
