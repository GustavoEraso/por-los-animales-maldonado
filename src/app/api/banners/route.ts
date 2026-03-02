import { NextResponse } from 'next/server';
import { BannerType } from '@/types';
import { getBannersData } from '@/lib/data/banners';

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
    const data = await getBannersData();

    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching banners:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
