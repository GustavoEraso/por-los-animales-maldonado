'use server';

import {
  prepareEvaluationData,
  resolveEvaluationProfile,
  runFullEvaluation,
} from '@/lib/evaluation/shared';
import { logger } from '@/lib/logger';
import type { GoogleFormEvaluation } from '@/types';

/**
 * Firestore metadata fields that should be stripped before sending data to the AI.
 * These are not adoption-relevant and would confuse the evaluation prompt.
 */
const METADATA_FIELDS = new Set([
  'id',
  'rawData',
  'createdAt',
  'evaluation',
  'status',
  'approvedAnimalId',
  'approvedAnimalName',
  'applicantId',
  'identityResolution',
  'decisionReason',
  'decisionAt',
  'decisionBy',
  'evaluationState',
  'formVersion',
]);

/**
 * Server Action: retries the AI evaluation for an adoption form that lacks one.
 * Called directly from client components — no API route or manual auth needed.
 *
 * Receives the raw form data from the client to avoid server-side Firestore reads
 * (which require auth that isn't available in the server context).
 *
 * @param formId - The Firestore document ID of the googleForms entry
 * @param rawFormData - The full form document data (from client state)
 * @returns The evaluation result, or null if all providers failed
 *
 * @example
 * import { retryEvaluation } from '@/lib/evaluation/actions';
 * const evaluation = await retryEvaluation(form.id, form);
 */
export async function retryEvaluation(
  formId: string,
  rawFormData: Record<string, unknown>,
  userRole?: string
): Promise<GoogleFormEvaluation | null> {
  if (!formId || !rawFormData) {
    logger({
      level: 'warn',
      code: 'RETRY_INVALID_PARAMS',
      message: 'Missing formId or rawFormData for evaluation retry',
    });
    return null;
  }

  // Server-side role check (defense-in-depth; primary check is in the client hook).
  // Once Firebase Admin SDK is integrated, this should verify the session cookie.
  // When the role is not provided at all we also reject, because the client
  // should always supply it and a missing value could indicate tampering.
  const ALLOWED_ROLES = ['rescatista', 'admin', 'superadmin'];
  if (!userRole || !ALLOWED_ROLES.includes(userRole)) {
    logger({
      level: 'warn',
      code: 'RETRY_ROLE_DENIED',
      message: `Retry rejected: user role "${userRole ?? 'missing'}" is not authorized`,
    });
    return null;
  }

  // Ensure the client-submitted document id matches the form being retried so a
  // caller cannot request evaluation for an arbitrary form id.
  if (rawFormData.id !== undefined && String(rawFormData.id) !== String(formId)) {
    logger({
      level: 'warn',
      code: 'RETRY_FORM_ID_MISMATCH',
      message: 'Retry formId does not match the submitted document id',
    });
    return null;
  }

  // Fail closed: a form skipped because of a blacklist must never be evaluated
  // through the retry path.
  if (rawFormData.evaluationState === 'skipped_blacklist') {
    logger({
      level: 'warn',
      code: 'RETRY_BLACKLISTED',
      message: `Refusing to evaluate form ${formId} because it is blacklisted`,
    });
    return null;
  }

  // Strip metadata fields before sending to AI
  const cleanData = Object.fromEntries(
    Object.entries(rawFormData).filter(([key]) => !METADATA_FIELDS.has(key))
  );

  // Select the evaluation profile from the stored form version so a legacy form
  // is never re-evaluated with the new-form prompt (and vice versa).
  const profile = resolveEvaluationProfile(rawFormData.formVersion as string | undefined);

  if (
    rawFormData.formVersion !== undefined &&
    rawFormData.formVersion !== 'legacy' &&
    rawFormData.formVersion !== 'v2'
  ) {
    logger({
      level: 'warn',
      code: 'RETRY_INVALID_FORM_VERSION',
      message: `Retry received an invalid formVersion for form ${formId}; falling back to legacy`,
    });
  }

  const evaluationData = prepareEvaluationData(cleanData);
  const result = await runFullEvaluation(formId, evaluationData, profile);

  return result as GoogleFormEvaluation | null;
}
