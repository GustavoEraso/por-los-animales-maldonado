import { NextRequest, NextResponse } from 'next/server';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/firebase'; // Firestore client instance

export const revalidate = 300; // Cache response for 5 minutes

/**
 * GET /api/authorized-emails - Retrieve authorized user emails from Firestore
 *
 * Internal API endpoint that fetches all authorized user emails from the
 * authorizedEmails Firestore collection. This endpoint is protected with an
 * internal token and cached for 5 minutes to improve performance. Used for
 * authentication and authorization checks throughout the application.
 *
 * @param {NextRequest} req - Request object containing headers
 *
 * @headers {string} x-internal-token - Required internal API secret token for authentication
 *
 * @returns {NextResponse<Array<{email: string, [key: string]: any}>>} JSON response with authorized users array
 * @returns {NextResponse<{error: string}>} 401 error if token is invalid or missing
 * @returns {NextResponse<{error: string}>} 500 error if Firestore operation fails
 *
 * @example
 * ```typescript
 * // Internal usage (from authentication middleware)
 * const response = await fetch('/api/authorized-emails', {
 *   headers: {
 *     'x-internal-token': process.env.INTERNAL_API_SECRET!
 *   }
 * });
 * const authorizedUsers = await response.json();
 *
 * // Check if user is authorized
 * const isAuthorized = authorizedUsers.some(user => user.email === userEmail);
 * ```
 *
 * @note This is an internal API endpoint for authorization checks only.
 * Response is cached for 5 minutes using Next.js revalidate export.
 * Returns user emails as document IDs with additional user data.
 * Requires INTERNAL_API_SECRET environment variable for authentication.
 */
export async function GET(req: NextRequest) {
  const token = req.headers.get('x-internal-token');

  if (token !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snapshot = await getDocs(collection(db, 'authorizedEmails'));
    const users = snapshot.docs.map((doc) => ({
      email: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json(users);
  } catch (err) {
    console.error('Error fetching authorized emails:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
