import { NextRequest, NextResponse } from 'next/server';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/firebase';

export async function GET() {
  return NextResponse.json({ message: 'Hello from Google Forms API route!' });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (token !== process.env.GOOGLE_FORMS_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();

  try {
    const docRef = await addDoc(collection(db, 'googleForms'), {
      ...data,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id: docRef.id });
  } catch (err) {
    console.error('Error saving form data:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
