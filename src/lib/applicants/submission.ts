/**
 * Shared form-submission pipeline for applicant profiles.
 *
 * Centralizes the steps that both `/api/google-forms` (legacy) and
 * `/api/google-forms/v2` perform when a form is ingested, so a rule applied to
 * one source (identity resolution, blacklist handling, evaluation skip) is
 * automatically applied to the other and to any future web form.
 *
 * Each HTTP route is responsible for:
 * - validating the payload
 * - normalizing the body into canonical fields (`mappedData`) and `rawData`
 * - reserving the Firestore document id
 * - authenticating/secret-checking the request
 *
 * This service then:
 * 1. resolves the applicant profile from the canonical contacts
 * 2. writes the form document with the correct `evaluationState`
 * 3. runs the AI evaluation when allowed (never for blacklisted/unverified)
 *
 * The caller keeps control of the HTTP response shape.
 */

import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { logger } from '@/lib/logger';
import { prepareEvaluationData, runFullEvaluation } from '@/lib/evaluation/shared';
import { resolveIdentityForForm } from '@/lib/applicants/identity';
import type { IdentityResolutionOutcome } from '@/lib/applicants/identity';
export const EVALUATION_TIMEOUT_MS = 9500;

/** Result of the shared submission pipeline. */
export interface SubmissionResult {
  formId: string;
  /** Null when evaluation failed or was skipped. */
  evaluation: Awaited<ReturnType<typeof runFullEvaluation>>;
  /** Short human/UI status: 'pending' | 'skipped_blacklist' | 'skipped_error' | 'completed'. */
  status: string;
  identity: IdentityResolutionOutcome;
}

/**
 * Decides whether AI evaluation must be skipped for a submission. Fail closed:
 * if the identity layer could not verify the blacklist (missing secret or a
 * resolution error), the submission is NOT evaluated, and neither is one that
 * conclusively resolved to a blacklisted profile.
 *
 * @param identity - The identity resolution outcome
 * @returns True when evaluation must be skipped
 */
export function isEvaluationSkipped(identity: IdentityResolutionOutcome): boolean {
  return (
    identity.blacklisted ||
    identity.skippedReason === 'missing_index_secret' ||
    identity.skippedReason === 'resolution_error'
  );
}

/**
 * Processes an applicant submission end-to-end: resolves identity, saves the
 * form document, and runs (or skips) the AI evaluation.
 *
 * @param params.canonicalData - Canonical form fields (already mapped)
 * @param params.extraFields - Additional fields to store on the form document
 *   (e.g. `formVersion`, normalized emails, `rawData`)
 * @returns The submission result (id, evaluation, status, identity)
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

  const identity = await resolveIdentityForForm({
    mappedData: canonicalData,
    formId: formDocRef.id,
    nowIso,
  });

  const skipped = isEvaluationSkipped(identity);
  const initialEvaluationState = identity.blacklisted
    ? 'skipped_blacklist'
    : skipped
      ? 'skipped_error'
      : 'pending';

  await setDoc(
    formDocRef,
    {
      ...canonicalData,
      ...extraFields,
      evaluation: null,
      evaluationState: initialEvaluationState,
      identityResolution: identity.resolution,
      ...(identity.applicantId ? { applicantId: identity.applicantId } : {}),
      createdAt: nowIso,
    },
    { merge: false }
  );

  const evaluationData = prepareEvaluationData(canonicalData);

  // A blacklisted applicant never triggers a new AI evaluation.
  if (identity.blacklisted) {
    logger({
      level: 'warn',
      code: 'BLACKLISTED_APPLICANT',
      message: 'Form received from a blacklisted applicant; evaluation skipped',
      data: { formId: formDocRef.id },
    });
    return { formId: formDocRef.id, evaluation: null, status: 'skipped_blacklist', identity };
  }

  // If identity could not verify the blacklist, avoid evaluating at all.
  if (skipped) {
    logger({
      level: 'warn',
      code: 'EVALUATION_SKIPPED',
      message: 'Evaluation skipped because identity could not be verified',
      data: { formId: formDocRef.id, skippedReason: identity.skippedReason },
    });
    return {
      formId: formDocRef.id,
      evaluation: null,
      status: 'skipped_error',
      identity,
    };
  }

  // Mark as running so the UI can distinguish it from pending.
  setDoc(formDocRef, { evaluationState: 'running' }, { merge: true }).catch(() => {});

  const evaluationPromise = runFullEvaluation(formDocRef.id, evaluationData, evaluationProfile);

  const evaluation = await Promise.race([
    evaluationPromise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), EVALUATION_TIMEOUT_MS)),
  ]);

  if (evaluation) {
    setDoc(formDocRef, { evaluationState: 'completed' }, { merge: true }).catch(() => {});
    return { formId: formDocRef.id, evaluation, status: 'completed', identity };
  }

  // The evaluation timed out or failed — mark as failed so the UI offers a
  // retry instead of leaving the form in an ambiguous pending state.
  setDoc(formDocRef, { evaluationState: 'failed' }, { merge: true }).catch(() => {});
  return { formId: formDocRef.id, evaluation: null, status: 'pending', identity };
}
