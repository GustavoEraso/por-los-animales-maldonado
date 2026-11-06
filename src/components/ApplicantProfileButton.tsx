'use client';

import Link from 'next/link';

interface ApplicantProfileButtonProps {
  /** Linked applicant profile id, when the form was already processed. */
  applicantId?: string;
  /** True while the ficha and contact index are being generated. */
  isProcessing: boolean;
  /**
   * True when the processing already ran but could not link a profile
   * (e.g. the form has no login email).
   */
  hasBeenProcessed?: boolean;
  /**
   * `link` navigates to the ficha page; `button` runs `onView` instead
   * (used by the desktop panel to embed the ficha without navigating).
   */
  variant: 'link' | 'button';
  /** Click handler for the `button` variant. */
  onView?: () => void;
}

/**
 * Applicant ficha action with its three states: generating (animated),
 * linked (link or embedded view) and unprocessed/unresolved.
 *
 * @example
 * <ApplicantProfileButton
 *   applicantId={form.applicantId}
 *   isProcessing={isProcessing}
 *   hasBeenProcessed={Boolean(form.identityProcessedAt)}
 *   variant="button"
 *   onView={() => setShowApplicant(true)}
 * />
 */
export default function ApplicantProfileButton({
  applicantId,
  isProcessing,
  hasBeenProcessed,
  variant,
  onView,
}: ApplicantProfileButtonProps) {
  if (isProcessing) {
    return (
      <span className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 rounded-lg animate-pulse">
        <Spinner />
        Generando ficha de postulante...
      </span>
    );
  }

  if (applicantId) {
    const content = (
      <>
        <UserIcon />
        Ficha del postulante
      </>
    );

    if (variant === 'link') {
      return (
        <Link
          href={`/plam-admin/postulantes/${applicantId}`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border text-green-forest bg-green-50 border-green-300 hover:bg-green-100 transition-colors"
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={onView}
        title="Ver la ficha del postulante en este panel"
        className="shrink-0 px-3 py-1.5 text-xs font-medium text-green-forest bg-green-50 border border-green-300 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1.5"
      >
        {content}
      </button>
    );
  }

  if (hasBeenProcessed) {
    return (
      <span
        className="shrink-0 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg"
        title="No se pudo asociar una ficha automáticamente; revisar el formulario"
      >
        Sin ficha · revisar
      </span>
    );
  }

  return null;
}

/** Inline spinner for the generating state. */
function Spinner() {
  return (
    <svg
      className="animate-spin h-3.5 w-3.5 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
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

/** Small user icon matching the other admin buttons. */
function UserIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}
