import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { BannerType } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/banners-cache - Retrieve all banners data from Firestore with caching
 *
 * Internal API endpoint that fetches all banner information from Firestore
 * database. This endpoint is protected with an internal token and cached for 600 seconds
 * to improve performance. Used by other APIs to get fresh banner data for display
 * throughout the application.
 *
 * @param {NextRequest} req - Request object containing headers
 *
 * @headers {string} x-internal-token - Required internal API secret token for authentication
 *
 * @returns {NextResponse<BannerType[]>} JSON response with all banners from Firestore
 * @returns {NextResponse<{error: string}>} 403 error if token is invalid or missing
 * @returns {NextResponse<{error: string}>} 500 error if Firestore operation fails
 *
 * @example
 * ```typescript
 * // Internal usage (from another API route)
 * const response = await fetch('/api/banners-cache', {
 *   headers: {
 *     'x-internal-token': process.env.INTERNAL_API_SECRET!
 *   }
 * });
 * const banners = await response.json();
 * ```
 *
 * @note This is an internal API endpoint, not meant for direct client consumption.
 * Response is cached for 600 seconds using Next.js revalidate export.
 * Requires INTERNAL_API_SECRET environment variable for authentication.
 * Used by /api/banners for public banner data access.
 */
export async function GET(
  req: NextRequest
): Promise<NextResponse<BannerType[] | { error: string }>> {
  try {
    const token = req.headers.get('x-internal-token');

    if (token !== process.env.INTERNAL_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const data = await getFirestoreData({ currentCollection: 'banners' }); // Fetch from Firestore
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching banners from Firestore:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
