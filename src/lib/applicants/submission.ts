/**
 * Shared form-submission pipeline.
 *
 * Centralizes the steps that both `/api/google-forms` (legacy) and
 * `/api/google-forms/v2` perform when a form is ingested:
 *
 * 1. reserve the Firestore document id and store the form
 * 2. run the AI evaluation (with a hard timeout)
 *
 * Applicant identity (ficha + contact index) is NOT resolved here: it is
 * processed later from the client by `ensureApplicantProfile`, the first time
 * staff opens the form. That keeps this endpoint fast (Vercel duration limit)
 * and avoids needing server credentials to read the applicant collections.
 *
 * Each HTTP route is responsible for:
 * - validating the payload
 * - normalizing the body into canonical fields (`mappedData`) and `rawData`
 * - authenticating/secret-checking the request
 *
 * The caller keeps control of the HTTP response shape.
 */

import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { logger } from '@/lib/logger';
import { prepareEvaluationData, runFullEvaluation } from '@/lib/evaluation/shared';
export const EVALUATION_TIMEOUT_MS = 9500;

/** Result of the shared submission pipeline. */
export interface SubmissionResult {
  formId: string;
  /** Null when evaluation failed or timed out. */
  evaluation: Awaited<ReturnType<typeof runFullEvaluation>>;
  /** Short human/UI status: 'completed' | 'failed'. */
  status: 'completed' | 'failed';
}

/**
 * Processes an applicant submission end-to-end: saves the form document and
 * runs the AI evaluation.
 *
 * @param params.canonicalData - Canonical form fields (already mapped)
 * @param params.extraFields - Additional fields to store on the form document
 *   (e.g. `formVersion`, normalized emails, `rawData`)
 * @returns The submission result (id, evaluation, status)
 *
 * @example
 * const result = await processApplicantSubmission({
 *   canonicalData: mappedData,
 *   extraFields: { formVersion: 'v2', rawData: cleanedData, applicantEmail, googleAccountEmail },
 * });
 */
export async function processApplicantSubmission(params: {
  canonicalData: Record<string, unknown>;
  extraFields?: Record<string, unknown>;
  evaluationProfile?: Parameters<typeof runFullEvaluation>[2];
}): Promise<SubmissionResult> {
  const { canonicalData, extraFields = {}, evaluationProfile } = params;

  const formDocRef = doc(collection(db, 'googleForms'));
  const nowIso = new Date().toISOString();

  await setDoc(
    formDocRef,
    {
      ...canonicalData,
      ...extraFields,
      evaluation: null,
      evaluationState: 'pending',
      // Applicant identity (ficha + contact index) is processed from the
      // client when staff opens the form; see `ensureApplicantProfile`.
      identityProcessedAt: null,
      createdAt: nowIso,
    },
    { merge: false }
  );

  const evaluationData = prepareEvaluationData(canonicalData);

  // Mark as running so the UI can distinguish it from pending.
  setDoc(formDocRef, { evaluationState: 'running' }, { merge: true }).catch(() => {});

  const evaluationPromise = runFullEvaluation(formDocRef.id, evaluationData, evaluationProfile);

  const evaluation = await Promise.race([
    evaluationPromise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), EVALUATION_TIMEOUT_MS)),
  ]);

  if (evaluation) {
    setDoc(formDocRef, { evaluationState: 'completed' }, { merge: true }).catch(() => {});
    return { formId: formDocRef.id, evaluation, status: 'completed' };
  }

  // The evaluation timed out or failed — mark as failed so the UI offers a
  // retry instead of leaving the form in an ambiguous pending state.
  logger({
    level: 'warn',
    code: 'EVALUATION_FAILED',
    message: 'Evaluation failed or timed out for the submitted form',
    data: { formId: formDocRef.id },
  });
  setDoc(formDocRef, { evaluationState: 'failed' }, { merge: true }).catch(() => {});
  return { formId: formDocRef.id, evaluation: null, status: 'failed' };
}
