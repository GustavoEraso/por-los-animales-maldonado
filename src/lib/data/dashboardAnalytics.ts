import { cacheLife, cacheTag } from 'next/cache';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import type { DashboardAnalyticsData } from '@/types';

/**
 * Internal cached function that fetches the dashboard analytics summary
 * from the public dashboardAnalytics/summary Firestore document.
 *
 * Because dashboardAnalytics has public read rules (allow read: if true),
 * this can run server-side and be cached with 'use cache'.
 * Only executes on cache MISS — on HIT, Next.js returns cached result.
 */
async function fetchDashboardAnalytics(): Promise<DashboardAnalyticsData | null> {
  'use cache';
  cacheTag('dashboard-transactions', 'revalidate-all');
  cacheLife({
    stale: 30,
    revalidate: 2600000,
    expire: 2600000,
  });

  console.log('[dashboard-analytics] 🔥 Cache MISS — fetching from Firestore');

  return getFirestoreDocById<DashboardAnalyticsData>({
    currentCollection: 'dashboardAnalytics',
    id: 'summary',
  });
}

/**
 * Fetches dashboard analytics data with server-side caching and logging.
 *
 * Uses Next.js `'use cache'` directive internally.
 * Cache is invalidated on-demand via `revalidateTag('dashboard-transactions')`
 * which is called automatically by `postTransactionData()`.
 *
 * The dashboardAnalytics collection has public read access because it only
 * contains non-sensitive data (animal names, dates, transaction types, costs).
 * Private data (contact info, addresses, medical details) stays in
 * animalTransactions which requires authentication.
 *
 * @returns The dashboard analytics summary, or null if not initialized
 *
 * @example
 * // In a Server Component
 * const analytics = await getDashboardAnalyticsData();
 */
export async function getDashboardAnalyticsData(): Promise<DashboardAnalyticsData | null> {
  const start = performance.now();
  const data = await fetchDashboardAnalytics();
  const elapsed = (performance.now() - start).toFixed(1);

  if (data) {
    console.log(
      `[dashboard-analytics] ✅ Returned ${data.recentTransactions.length} recent tx, ${Object.keys(data.monthly).length} months in ${elapsed}ms`
    );
  } else {
    console.log(`[dashboard-analytics] ⚠️ No data available (${elapsed}ms)`);
  }

  return data;
}
