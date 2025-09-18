import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 60; // Cache response for 60 seconds

/**
 * GET /api/contacts-cache - Retrieve all contacts data from Firestore with caching
 *
 * Internal API endpoint that fetches all WhatsApp contact information from Firestore
 * database. This endpoint is protected with an internal token and cached for 60 seconds
 * to improve performance. Used by other APIs to get fresh contact data for WhatsApp
 * integration throughout the application.
 *
 * @param {NextRequest} req - Request object containing headers
 *
 * @headers {string} x-internal-token - Required internal API secret token for authentication
 *
 * @returns {NextResponse<WpContactType[]>} JSON response with all contacts from Firestore
 * @returns {NextResponse<{error: string}>} 403 error if token is invalid or missing
 * @returns {NextResponse<{error: string}>} 500 error if Firestore operation fails
 *
 * @example
 * ```typescript
 * // Internal usage (from another API route)
 * const response = await fetch('/api/contacts-cache', {
 *   headers: {
 *     'x-internal-token': process.env.INTERNAL_API_SECRET!
 *   }
 * });
 * const contacts = await response.json();
 * ```
 *
 * @note This is an internal API endpoint, not meant for direct client consumption.
 * Response is cached for 60 seconds using Next.js revalidate export.
 * Requires INTERNAL_API_SECRET environment variable for authentication.
 * Used by /api/contacts for public contact data access.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('x-internal-token');

    if (token !== process.env.INTERNAL_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const data = await getFirestoreData({ currentCollection: 'contacts' }); // Fetch from Firestore
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching contacts from Firestore:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
