import { NextResponse } from 'next/server';
import { WpContactType } from '@/types';
import { getContactsData } from '@/lib/data/contacts';

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
 * @note Uses Next.js native fetch caching with 60-second revalidation for reliable
 * performance in Vercel serverless environment. This is a public endpoint that
 * does not require authentication.
 */

export async function GET(): Promise<NextResponse<WpContactType[] | { error: string }>> {
  try {
    const contacts = await getContactsData();

    return NextResponse.json(contacts);
  } catch (err) {
    console.error('Error fetching contacts:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
