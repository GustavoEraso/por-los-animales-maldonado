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

const ALLOWED_ROLES = ['rescatista', 'admin', 'superadmin'];

/**
 * Validates a manual evaluation request coming from the client.
 *
 * Rejects when the role is missing/unauthorized or when the client-submitted
 * document id does not match the form being evaluated, so a caller cannot
 * request evaluation for an arbitrary form id.
 *
 * @param formId - The Firestore document ID of the form to evaluate
 * @param rawFormData - The full form document data (from client state)
 * @param userRole - Role of the signed-in staff member
 * @returns true when the request may proceed
 */
function validateManualEvaluation(
  formId: string,
  rawFormData: Record<string, unknown>,
  userRole?: string
): boolean {
  // Server-side role check (defense-in-depth; primary check is in the client hook).
  // Once Firebase Admin SDK is integrated, this should verify the session cookie.
  // When the role is not provided at all we also reject, because the client
  // should always supply it and a missing value could indicate tampering.
  if (!userRole || !ALLOWED_ROLES.includes(userRole)) {
    logger({
      level: 'warn',
      code: 'MANUAL_EVAL_ROLE_DENIED',
      message: `Evaluation rejected: user role "${userRole ?? 'missing'}" is not authorized`,
    });
    return false;
  }

  if (rawFormData.id !== undefined && String(rawFormData.id) !== String(formId)) {
    logger({
      level: 'warn',
      code: 'MANUAL_EVAL_FORM_ID_MISMATCH',
      message: 'Evaluation formId does not match the submitted document id',
    });
    return false;
  }

  return true;
}

/**
 * Runs the AI evaluation for a form document, shared by the retry flow and
 * the manual blacklist override. Expects `rawFormData` already validated.
 *
 * @param formId - The Firestore document ID of the form to evaluate
 * @param rawFormData - The full form document data (from client state)
 * @returns The evaluation result, or null if all providers failed
 */
async function runEvaluationForForm(
  formId: string,
  rawFormData: Record<string, unknown>
): Promise<GoogleFormEvaluation | null> {
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
      code: 'MANUAL_EVAL_INVALID_FORM_VERSION',
      message: `Received an invalid formVersion for form ${formId}; falling back to legacy`,
    });
  }

  const evaluationData = prepareEvaluationData(cleanData);
  const result = await runFullEvaluation(formId, evaluationData, profile);

  return result as GoogleFormEvaluation | null;
}

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

  if (!validateManualEvaluation(formId, rawFormData, userRole)) {
    return null;
  }

  // Fail closed: a form skipped because of a blacklist must never be evaluated
  // through the retry path; use evaluateBlacklistedForm for that (it is audited
  // as an explicit override).
  if (rawFormData.evaluationState === 'skipped_blacklist') {
    logger({
      level: 'warn',
      code: 'RETRY_BLACKLISTED',
      message: `Refusing to evaluate form ${formId} because it is blacklisted`,
    });
    return null;
  }

  return runEvaluationForForm(formId, rawFormData);
}

/**
 * Server Action: manually evaluates a form whose evaluation was skipped because
 * the applicant is (or was) on the blacklist.
 *
 * This is an explicit staff override: a human decided that the form should be
 * evaluated anyway (e.g. the applicant was removed from the blacklist or the
 * staff wants the AI analysis before making a decision). The evaluation only
 * fills in the AI analysis — it does NOT change the applicant's blacklist
 * status nor the form's adoption status.
 *
 * Only works on forms whose current `evaluationState` is `'skipped_blacklist'`,
 * so it cannot be used as a bypass for the regular retry flow.
 *
 * @param formId - The Firestore document ID of the googleForms entry
 * @param rawFormData - The full form document data (from client state)
 * @param userRole - Role of the signed-in staff member (rescatista or above)
 * @param overrideReason - Optional free-text reason, kept for the audit trail
 * @returns The evaluation result, or null if all providers failed
 *
 * @example
 * const evaluation = await evaluateBlacklistedForm(form.id, form, role, 'Salió de la lista negra');
 */
export async function evaluateBlacklistedForm(
  formId: string,
  rawFormData: Record<string, unknown>,
  userRole?: string,
  overrideReason?: string
): Promise<GoogleFormEvaluation | null> {
  if (!formId || !rawFormData) {
    logger({
      level: 'warn',
      code: 'BLACKLIST_EVAL_INVALID_PARAMS',
      message: 'Missing formId or rawFormData for blacklisted form evaluation',
    });
    return null;
  }

  if (!validateManualEvaluation(formId, rawFormData, userRole)) {
    return null;
  }

  // Inverse guard: this action is ONLY for forms skipped by the blacklist.
  if (rawFormData.evaluationState !== 'skipped_blacklist') {
    logger({
      level: 'warn',
      code: 'BLACKLIST_EVAL_NOT_SKIPPED',
      message: `Refusing override for form ${formId}: evaluationState is "${String(
        rawFormData.evaluationState
      )}", not 'skipped_blacklist'`,
    });
    return null;
  }

  logger({
    level: 'info',
    code: 'MANUAL_BLACKLIST_EVALUATION',
    message: `Staff overrode the blacklist evaluation skip for form ${formId}`,
    data: { overrideReason: overrideReason?.trim() || null },
  });

  return runEvaluationForForm(formId, rawFormData);
}
