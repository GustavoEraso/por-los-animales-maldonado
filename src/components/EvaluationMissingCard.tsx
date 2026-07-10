'use client';

import { useRetryEvaluation } from '@/hooks/useRetryEvaluation';
import type { GoogleFormEvaluation } from '@/types';

interface EvaluationMissingCardProps {
  /** The Firestore document ID of the form to retry evaluation for. */
  formId: string;
  /** The applicant's name, used for the progress toast context. */
  formName?: string;
  /** The raw form data from client state (avoids server-side Firestore read). */
  rawFormData: Record<string, unknown>;
  /**
   * Called when the evaluation completes successfully.
   * The parent component should update its local form state with the new evaluation.
   */
  onEvaluationComplete: (evaluation: GoogleFormEvaluation) => void;
}

/**
 * Card displayed when a form has no AI evaluation.
 *
 * Replaces the passive "no disponible" message with an actionable card
 * that explains why the evaluation is missing and provides a retry button.
 *
 * States:
 * - idle: yellow card with explanation + green "Reintentar evaluación" button
 * - loading: button disabled with spinner + "Evaluando..." text
 * - error: toast handles feedback, button re-enables
 * - success: onEvaluationComplete is called with the result; card disappears
 *
 * @example
 * <EvaluationMissingCard
 *   formId={form.id}
 *   formName={form.fullName}
 *   onEvaluationComplete={(evaluation) => setForm({ ...form, evaluation })}
 * />
 */
export default function EvaluationMissingCard({
  formId,
  formName,
  rawFormData,
  onEvaluationComplete,
}: EvaluationMissingCardProps) {
  const { retryEvaluation, isRetrying } = useRetryEvaluation();

  const handleRetry = async () => {
    const evaluation = await retryEvaluation(formId, formName, rawFormData);
    if (evaluation) {
      onEvaluationComplete(evaluation);
    }
  };

  return (
    <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">
          ⚠
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-yellow-800">
            Evaluación de{' '}
            <span className="text-cream-light bg-caramel-deep rounded-2xl px-2 py-1">sof-IA</span>{' '}
            no disponible
          </p>
          <p className="text-xs text-yellow-700 leading-relaxed">
            Es posible que el análisis automático haya excedido el tiempo límite al recibir el
            formulario. Podés reintentarlo manualmente.
          </p>
        </div>
      </div>

      <button
        onClick={handleRetry}
        disabled={isRetrying}
        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-forest text-white text-sm font-semibold rounded-xl hover:bg-green-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        {isRetrying ? (
          <>
            <Spinner />
            Evaluando...
          </>
        ) : (
          'Reintentar evaluación'
        )}
      </button>
    </div>
  );
}

/**
 * Inline spinner SVG for the button loading state.
 */
function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
