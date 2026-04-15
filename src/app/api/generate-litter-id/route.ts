import { NextRequest, NextResponse } from 'next/server';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/firebase';

/**
 * Normalizes a litter name to create a URL-safe and database-friendly ID.
 * Removes accents, special characters, and converts spaces to hyphens.
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

type GenerateLitterIdResponse = { id: string } | { error: string };

/**
 * POST /api/generate-litter-id - Generate unique litter ID from name
 *
 * Generates a unique litter identifier based on the litter name.
 * Checks existing animals' litterId fields to ensure uniqueness.
 * Adds numeric suffixes if needed (e.g., "camada-parque-2").
 */
export async function POST(req: NextRequest): Promise<NextResponse<GenerateLitterIdResponse>> {
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
    const existingLitterIds = new Set<string>();
    snapshot.docs.forEach((doc) => {
      const litterId = doc.data().litterId;
      if (typeof litterId === 'string') {
        existingLitterIds.add(litterId);
      }
    });

    if (!existingLitterIds.has(baseId)) {
      return NextResponse.json({ id: baseId });
    }

    let suffix = 2;
    let newId = '';
    do {
      newId = `${baseId}-${suffix}`;
      suffix++;
    } while (existingLitterIds.has(newId));

    return NextResponse.json({ id: newId });
  } catch (err) {
    console.error('Error generating unique litter ID:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
