import { NextRequest, NextResponse } from 'next/server';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/firebase';
import { logger } from '@/lib/logger';
import { prepareEvaluationData, runFullEvaluation } from '@/lib/evaluation/shared';
import { FIELD_MAP_V2, normalizeQuestion } from '@/lib/googleForms/formSchemas';

/**
 * Normalizes the v2 form payload into canonical Firestore fields using the
 * dedicated v2 question map. Only known question labels are mapped; unmapped
 * keys (e.g. the informational adoption-responsibility paragraph) are dropped
 * from the canonical fields and preserved only via `rawData`.
 */
function normalizeFormData(data: Record<string, string | string[]>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const cleanQuestion = normalizeQuestion(key);
    const normalizedKey = FIELD_MAP_V2[cleanQuestion];

    if (!normalizedKey) {
      continue;
    }

    result[normalizedKey] = Array.isArray(value) ? value[0] : value;
  }

  return result;
}

function cleanRawData(data: Record<string, string | string[]>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      normalizeQuestion(key),
      Array.isArray(value) ? (value[0] ?? '') : value,
    ])
  );
}

function normalizeEmail(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed.toLowerCase();
}

const EVALUATION_TIMEOUT_MS = 9500;

/**
 * POST /api/google-forms/v2
 *
 * Receives submissions from the NEW Google Form. Authenticates with the v2
 * secret, stores the record in `googleForms` with `formVersion: 'v2'`, stores
 * the two email fields independently, and starts the v2 AI evaluation.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (token !== process.env.GOOGLE_FORMS_V2_API_SECRET) {
    logger({ level: 'warn', code: 'UNAUTHORIZED', message: 'Invalid v2 token' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const dataRecord = data as Record<string, string | string[]>;

  const mappedData = normalizeFormData(dataRecord);
  const cleanedData = cleanRawData(dataRecord);
  const evaluationData = prepareEvaluationData(mappedData);

  // Store the two email fields independently (never merged, never overwritten).
  const applicantEmail = normalizeEmail(mappedData.applicantEmail);
  const googleAccountEmail = normalizeEmail(mappedData.googleAccountEmail);

  let docRef;
  try {
    docRef = await addDoc(collection(db, 'googleForms'), {
      ...mappedData,
      formVersion: 'v2',
      applicantEmail,
      googleAccountEmail,
      rawData: cleanedData,
      evaluation: null,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    logger({
      level: 'error',
      code: 'FIRESTORE_SAVE_FAILED',
      errorType: 'Firestore',
      statusCode: 500,
      message: 'Failed to save v2 form',
      data: err,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  // Always run the v2 evaluation profile.
  const evaluationPromise = runFullEvaluation(docRef.id, evaluationData, 'v2');

  const evaluation = await Promise.race([
    evaluationPromise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), EVALUATION_TIMEOUT_MS)),
  ]);

  if (evaluation) {
    return NextResponse.json({ id: docRef.id, evaluation }, { status: 201 });
  }

  return NextResponse.json({ id: docRef.id, status: 'pending' }, { status: 201 });
}
