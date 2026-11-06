import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { FIELD_MAP_V2, normalizeQuestion } from '@/lib/googleForms/formSchemas';
import { normalizeEmail } from '@/lib/applicants/contacts';
import { processApplicantSubmission } from '@/lib/applicants/submission';

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

/**
 * POST /api/google-forms/v2
 *
 * Receives submissions from the NEW Google Form. Authenticates with the v2
 * secret, stores the record in `googleForms` with `formVersion: 'v2'`, stores
 * the applicant Google Account email independently, and starts the v2 AI
 * evaluation.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Fail closed: a missing server secret must never authorize a request.
  const expectedSecret = process.env.GOOGLE_FORMS_V2_API_SECRET;
  if (!expectedSecret) {
    logger({
      level: 'error',
      code: 'MISSING_ENDPOINT_SECRET',
      message: 'GOOGLE_FORMS_V2_API_SECRET is not configured; rejecting request',
    });
    return NextResponse.json({ error: 'Service misconfigured' }, { status: 500 });
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  if (!token || token !== expectedSecret) {
    logger({ level: 'warn', code: 'UNAUTHORIZED', message: 'Invalid v2 token' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let data: unknown;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const dataRecord = data as Record<string, string | string[]>;

  const mappedData = normalizeFormData(dataRecord);
  const cleanedData = cleanRawData(dataRecord);

  // Store the applicant Google Account email independently (never merged).
  // The legacy "Mail" question is no longer part of the form, so rawData is the
  // only place where an applicant-provided email may appear if the sheet kept it.
  const googleAccountEmail = normalizeEmail(mappedData.googleAccountEmail);

  let result: Awaited<ReturnType<typeof processApplicantSubmission>>;
  try {
    result = await processApplicantSubmission({
      canonicalData: mappedData,
      evaluationProfile: 'v2',
      extraFields: {
        formVersion: 'v2',
        // Firestore rejects undefined values, so only write the email when present.
        ...(googleAccountEmail ? { googleAccountEmail } : {}),
        rawData: cleanedData,
      },
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

  if (result.evaluation) {
    return NextResponse.json({ id: result.formId, evaluation: result.evaluation }, { status: 201 });
  }

  // The evaluation timed out or failed — the UI offers a manual retry.
  return NextResponse.json({ id: result.formId, status: 'failed' }, { status: 201 });
}
