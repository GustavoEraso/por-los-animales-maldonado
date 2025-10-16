import { NextResponse } from 'next/server';
import { BannerType } from '@/types';

/**
 * Fetches contacts data from the internal cache API with Next.js native caching.
 * This function uses Next.js fetch with revalidation for reliable caching in Vercel.
 *
 * @returns {Promise<WpContactType[]>} Promise that resolves to array of WhatsApp contacts
 * @throws {Error} If the cache API request fails
 */
async function getBannersFromCache(): Promise<BannerType[]> {
  const baseUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://www.porlosanimalesmaldonado.com';

  const res = await fetch(`${baseUrl}/api/banners-cache`, {
    headers: {
      'x-internal-token': process.env.INTERNAL_API_SECRET!,
    },
    next: { revalidate: 600 }, // Next.js will cache for 600 seconds
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch contacts cache: ${res.status}`);
  }

  return res.json();
}

/**
 * GET /api/contacts - Retrieve WhatsApp contacts with Next.js native caching
 *
 * Public API endpoint that retrieves all WhatsApp contact information for the
 * organization. Uses Next.js fetch with revalidation for reliable caching in
 * Vercel serverless environment. Used by contact components and WhatsApp
 * integration throughout the application.
 *
 * @returns {NextResponse<WpContactType[]>} JSON response with contacts array
 * @returns {NextResponse<{error: string}>} Error response with 500 status on failure
 *
 * @example
 * ```typescript
 * // Fetch contacts for WhatsApp integration
 * const response = await fetch('/api/contacts');
 * const contacts = await response.json();
 *
 * // Use in WhatsApp component
 * contacts.forEach(contact => {
 *   console.log(`${contact.name}: +${contact.countryCode}${contact.phone}`);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // React component usage
 * const [contacts, setContacts] = useState<WpContactType[]>([]);
 *
 * useEffect(() => {
 *   fetch('/api/contacts')
 *     .then(res => res.json())
 *     .then(setContacts);
 * }, []);
 * ```
 *
 * @note Uses Next.js native fetch caching with 600-second revalidation for reliable
 * performance in Vercel serverless environment. This is a public endpoint that
 * does not require authentication.
 */

export async function GET() {
  try {
    // Get banners from cache using Next.js native caching
    const data = await getBannersFromCache();

    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching banners:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
