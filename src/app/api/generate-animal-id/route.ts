import { NextRequest, NextResponse } from 'next/server';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/firebase'; // tu inicialización del cliente de Firebase

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

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-internal-token');
  if (token !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await req.json();

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Nombre inválido' }, { status: 400 });
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
    console.error('Error generando ID único:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
