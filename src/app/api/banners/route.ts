import { NextResponse } from 'next/server';
import { BannerType } from '@/types';
import { cacheLife } from 'next/dist/server/use-cache/cache-life';
import { cacheTag } from 'next/dist/server/use-cache/cache-tag';

/**
 * Fetches banners data from the internal cache API with Next.js native caching.
 * This function uses Next.js fetch with revalidation for reliable caching in Vercel.
 *
 * @returns {Promise<BannerType[]>} Promise that resolves to array of banners
 * @throws {Error} If the cache API request fails
 */
async function getBannersFromCache(): Promise<BannerType[]> {
  'use cache';
  cacheTag('banners', 'revalidate-all');
  cacheLife({
    stale: 30,
    revalidate: 2600000,
    expire: 2600000,
  });

  const baseUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://www.porlosanimalesmaldonado.org';

  const res = await fetch(`${baseUrl}/api/banners-cache`, {
    headers: {
      'x-internal-token': process.env.INTERNAL_API_SECRET!,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch banners cache: ${res.status}`);
  }

  return res.json();
}

/**
 * GET /api/banners - Retrieve banners with Next.js native caching
 *
 * Public API endpoint that retrieves all banner information for the
 * organization. Uses Next.js fetch with revalidation for reliable caching in
 * Vercel serverless environment. Used by banner components throughout the application.
 *
 * @returns {NextResponse<BannerType[]>} JSON response with banners array
 * @returns {NextResponse<{error: string}>} Error response with 500 status on failure
 *
 * @example
 * ```typescript
 * // Fetch banners for display
 * const response = await fetch('/api/banners');
 * const banners = await response.json();
 *
 * // Use in banner component
 * banners.forEach(banner => {
 *   console.log(`${banner.title}: ${banner.description}`);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // React component usage
 * const [banners, setBanners] = useState<BannerType[]>([]);
 *
 * useEffect(() => {
 *   fetch('/api/banners')
 *     .then(res => res.json())
 *     .then(setBanners);
 * }, []);
 * ```
 *
 * @note Uses Next.js native fetch caching with 600-second revalidation for reliable
 * performance in Vercel serverless environment. This is a public endpoint that
 * does not require authentication.
 */

export async function GET(): Promise<NextResponse<BannerType[] | { error: string }>> {
  try {
    // Get banners from cache using Next.js native caching
    const data = await getBannersFromCache();

    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching banners:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
