'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { handlePromiseToast } from '@/lib/handleToast';
import { createAuditLog } from '@/lib/firebase/createAuditLog';
import { retryEvaluation } from '@/lib/evaluation/actions';
import type { GoogleFormEvaluation } from '@/types';

interface UseRetryEvaluationReturn {
  /** Triggers a re-evaluation for the given form. Returns the evaluation or null on failure. */
  retryEvaluation: (
    formId: string,
    formName?: string,
    rawFormData?: Record<string, unknown>
  ) => Promise<GoogleFormEvaluation | null>;
  /** Whether a retry operation is currently in progress. */
  isRetrying: boolean;
}

/**
 * Custom hook that encapsulates the form evaluation retry flow.
 *
 * Handles audit logging (before the operation, per project convention),
 * calls the Server Action, and manages loading state + toast feedback.
 * Reusable across both the desktop DetailPanel and the mobile detail page.
 *
 * @example
 * const { retryEvaluation, isRetrying } = useRetryEvaluation();
 * await retryEvaluation(form.id, form.fullName);
 */
export function useRetryEvaluation(): UseRetryEvaluationReturn {
  const { currentUser } = useAuth();
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(
    async (
      formId: string,
      formName?: string,
      rawFormData?: Record<string, unknown>
    ): Promise<GoogleFormEvaluation | null> => {
      if (!currentUser || !rawFormData) return null;

      setIsRetrying(true);

      try {
        // Audit log BEFORE the operation (per AGENTS.md convention)
        await createAuditLog({
          type: 'form',
          action: 'update',
          entityId: formId,
          entityName: formName ?? formId,
          modifiedBy: currentUser.id,
          modifiedByName: currentUser.name,
          changes: {
            before: { evaluation: null },
            after: { evaluation: '(retrying)' },
          },
        });

        const result = await handlePromiseToast(retryEvaluation(formId, rawFormData), {
          messages: {
            pending: {
              title: 'Reevaluando...',
              text: 'sof-IA está analizando el formulario.',
            },
            success: {
              title: '¡Evaluación completada!',
              text: 'La evaluación ya está disponible.',
            },
            error: {
              title: 'Error',
              text: 'No se pudo completar la evaluación. Intentá de nuevo.',
            },
          },
        });

        return result ?? null;
      } finally {
        setIsRetrying(false);
      }
    },
    [currentUser]
  );

  return { retryEvaluation: retry, isRetrying };
}
