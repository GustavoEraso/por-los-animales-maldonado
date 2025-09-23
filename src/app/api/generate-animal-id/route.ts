import { NextRequest, NextResponse } from 'next/server';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/firebase'; // Firebase client initialization

/**
 * Normalizes an animal name to create a URL-safe and database-friendly ID.
 * Removes accents, special characters, and converts spaces to hyphens.
 *
 * @param {string} name - Animal name to normalize
 * @returns {string} Normalized name suitable for use as document ID
 *
 * @example
 * normalizeName("María José") → "maria-jose"
 * normalizeName("Perrito 123!") → "perrito-123"
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * POST /api/generate-animal-id - Generate unique animal ID from name
 *
 * Internal API endpoint that generates a unique document ID for new animals
 * based on their name. Normalizes the name and checks against existing IDs
 * in Firestore to ensure uniqueness. Adds numeric suffixes if needed.
 *
 * @param {NextRequest} req - Request object containing animal name in JSON body
 *
 * @headers {string} x-internal-token - Required internal API secret token for authentication
 *
 * @body {Object} requestBody - Request body object
 * @body {string} requestBody.name - Animal name to generate ID from
 *
 * @returns {NextResponse<{id: string}>} Generated unique ID for the animal
 * @returns {NextResponse<{error: string}>} 401 error if token is invalid or missing
 * @returns {NextResponse<{error: string}>} 400 error if name is invalid or missing
 * @returns {NextResponse<{error: string}>} 500 error if Firestore operation fails
 *
 * @example
 * ```typescript
 * // Generate ID for new animal
 * const response = await fetch('/api/generate-animal-id', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'x-internal-token': process.env.INTERNAL_API_SECRET!
 *   },
 *   body: JSON.stringify({ name: 'Luna' })
 * });
 *
 * const result = await response.json();
 * console.log('Generated ID:', result.id); // "luna" or "luna-2" if exists
 * ```
 *
 * @example
 * ```typescript
 * // Usage in animal creation form
 * const generateUniqueId = async (animalName: string) => {
 *   const response = await fetch('/api/generate-animal-id', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'x-internal-token': process.env.INTERNAL_API_SECRET!
 *     },
 *     body: JSON.stringify({ name: animalName })
 *   });
 *
 *   if (response.ok) {
 *     const { id } = await response.json();
 *     return id;
 *   }
 *   throw new Error('Failed to generate ID');
 * };
 * ```
 *
 * @note This is an internal API endpoint requiring authentication.
 * Ensures all animal document IDs are unique, URL-safe, and human-readable.
 * Uses incremental suffixes (name-1, name-2, etc.) for duplicate names.
 */

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-internal-token');
  if (token !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await req.json();

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  }

  const baseId = normalizeName(name);

  try {
    const snapshot = await getDocs(collection(db, 'animals'));
    const existingIds = new Set(snapshot.docs.map((doc) => doc.id));

    if (!existingIds.has(baseId)) {
      return NextResponse.json({ id: baseId });
    }

    let suffix = 1;
    let newId = '';
    do {
      newId = `${baseId}-${suffix}`;
      suffix++;
    } while (existingIds.has(newId));

    return NextResponse.json({ id: newId });
  } catch (err) {
    console.error('Error generating unique ID:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
