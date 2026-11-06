'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { processApplicantProfileWithFeedback } from '@/lib/applicants/processFormWithFeedback';
import type { EnsureApplicantProfileResult } from '@/lib/applicants/identity';
import type { GoogleFormEntry } from '@/types';

interface UseEnsureApplicantProfileOptions {
  /** The form being viewed; processing runs once when it has no ficha yet. */
  form: GoogleFormEntry | null;
  /** Called after the processing finishes so the caller can update its state. */
  onProcessed?: (result: EnsureApplicantProfileResult) => void;
}

interface UseEnsureApplicantProfileReturn {
  /** True while the ficha and contact index are being generated. */
  isProcessing: boolean;
}

/**
 * Generates the applicant ficha and the contact index for a form the first
 * time it is opened by staff.
 *
 * The processing itself runs inside a Firestore transaction in
 * `ensureApplicantProfile`, so opening the same form twice is safe. The hook
 * only adds the UI feedback (toast + `isProcessing` flag for the button
 * animation).
 *
 * @example
 * const { isProcessing } = useEnsureApplicantProfile({
 *   form,
 *   onProcessed: (result) => setForm((prev) => ({ ...prev, ...result })),
 * });
 */
export function useEnsureApplicantProfile({
  form,
  onProcessed,
}: UseEnsureApplicantProfileOptions): UseEnsureApplicantProfileReturn {
  const { currentUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const triggeredFormIds = useRef<Set<string>>(new Set());
  const onProcessedRef = useRef(onProcessed);

  useEffect(() => {
    onProcessedRef.current = onProcessed;
  }, [onProcessed]);

  useEffect(() => {
    if (!form || !currentUser) return;
    if (form.identityProcessedAt) return;
    if (triggeredFormIds.current.has(form.id)) return;

    triggeredFormIds.current.add(form.id);
    // Auto-start the processing when the form loads; the flag drives the
    // button animation while the transaction runs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsProcessing(true);

    processApplicantProfileWithFeedback({
      formId: form.id,
      actor: { id: currentUser.id, name: currentUser.name },
    })
      .then((result) => {
        if (!result) {
          // Allow a retry the next time the form is opened.
          triggeredFormIds.current.delete(form.id);
          return;
        }
        onProcessedRef.current?.(result);
      })
      .finally(() => setIsProcessing(false));
  }, [form, currentUser]);

  return { isProcessing };
}
