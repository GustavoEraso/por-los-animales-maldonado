import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/check-user - Verify if user email is authorized and get user details
 *
 * Public API endpoint that checks if a given email address is in the authorized
 * users list and returns authorization status along with user role and name.
 * Used by authentication flows to determine user permissions and access levels.
 *
 * @param {NextRequest} req - Request object containing user email in JSON body
 *
 * @body {Object} requestBody - Request body object
 * @body {string} requestBody.email - Email address to check for authorization
 *
 * @returns {NextResponse<{authorized: false}>} User not authorized
 * @returns {NextResponse<{authorized: true, role: string, name: string}>} User authorized with details
 * @returns {NextResponse<{error: string}>} 400 error if email is missing
 * @returns {NextResponse<{error: string}>} 500 error if authorization check fails
 *
 * @example
 * ```typescript
 * // Check if user is authorized
 * const response = await fetch('/api/check-user', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     email: 'user@example.com'
 *   })
 * });
 *
 * const result = await response.json();
 * if (result.authorized) {
 *   console.log(`Welcome ${result.name}, your role is: ${result.role}`);
 * } else {
 *   console.log('Access denied');
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Usage in authentication component
 * const checkUserAuthorization = async (userEmail: string) => {
 *   const response = await fetch('/api/check-user', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ email: userEmail })
 *   });
 *
 *   const userData = await response.json();
 *   return userData.authorized ? userData : null;
 * };
 * ```
 *
 * @note Uses internal /api/authorized-emails endpoint to fetch current user list.
 * Returns role "viewer" as default if no specific role is assigned.
 * This endpoint does not require authentication as it only returns authorization status.
 */
export async function POST(req: NextRequest) {
  const baseUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://www.porlosanimalesmaldonado.com';

  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${baseUrl}/api/authorized-emails`, {
      headers: {
        'x-internal-token': process.env.INTERNAL_API_SECRET!,
      },
    });

    if (!res.ok) throw new Error('Failed to fetch authorized emails');

    const users: { email: string; name?: string; role?: string }[] = await res.json();

    const user = users.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json({ authorized: false });
    }

    return NextResponse.json({
      authorized: true,
      role: user.role || 'viewer',
      name: user.name || '',
    });
  } catch (err) {
    console.error('Error verifying user:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
