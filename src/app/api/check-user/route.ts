import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types';

/**
 * Response type for unauthorized user check.
 */
interface UnauthorizedResponse {
  authorized: false;
}

/**
 * Response type for authorized user check.
 */
interface AuthorizedResponse {
  authorized: true;
  role: UserRole;
  name: string;
}

/**
 * Response type for error cases.
 */
interface ErrorResponse {
  error: string;
}

/**
 * User data structure from authorized emails collection.
 */
interface AuthorizedUserData {
  email: string;
  name?: string;
  role?: UserRole;
}

/**
 * POST /api/check-user - Verify if user email is authorized and get user details
 *
 * Public API endpoint that checks if a given email address is in the authorized
 * users list and returns authorization status along with user role and name.
 * Used by authentication flows to determine user permissions and access levels.
 *
 * @param {NextRequest} request - Request object containing user email in JSON body
 *
 * @body {Object} requestBody - Request body object
 * @body {string} requestBody.email - Email address to check for authorization
 *
 * @returns {NextResponse<UnauthorizedResponse>} User not authorized
 * @returns {NextResponse<AuthorizedResponse>} User authorized with details
 * @returns {NextResponse<ErrorResponse>} 400 error if email is missing
 * @returns {NextResponse<ErrorResponse>} 500 error if authorization check fails
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
 * Returns role "user" as default if no specific role is assigned.
 * This endpoint does not require authentication as it only returns authorization status.
 */
export async function POST(request: NextRequest) {
  const baseUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://www.porlosanimalesmaldonado.com';

  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${baseUrl}/api/authorized-emails`, {
      headers: {
        'x-internal-token': process.env.INTERNAL_API_SECRET!,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch authorized emails');
    }

    const authorizedUsers: AuthorizedUserData[] = await response.json();

    const authorizedUser = authorizedUsers.find((userData) => userData.email === email);

    if (!authorizedUser) {
      return NextResponse.json({ authorized: false });
    }

    return NextResponse.json({
      authorized: true,
      role: authorizedUser.role || 'user',
      name: authorizedUser.name || '',
    });
  } catch (error) {
    console.error('Error verifying user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
