/**
 * Responsible-ownership alert classification.
 *
 * The answer to the responsible-ownership-law question is a human-review
 * signal. It must never block a submission nor mutate the form status; it only
 * surfaces a prominent alert to the evaluator.
 */

export type ResponsibleOwnershipAlert = 'red' | 'amber' | 'review' | 'none';

export interface ResponsibleOwnershipAlertInfo {
  category: ResponsibleOwnershipAlert;
  message: string;
}

/**
 * Normalizes the stored answer only for classification purposes.
 * The original answer is preserved in the document and in `rawData`.
 *
 * @param answer - The stored responsibleOwnershipAgreement value
 * @returns A stable alert category and a human-readable message
 */
export function classifyResponsibleOwnership(answer?: string): ResponsibleOwnershipAlertInfo {
  const normalized = (answer ?? '').trim().toLowerCase();

  if (!normalized) {
    return {
      category: 'review',
      message:
        'No se registró una respuesta sobre la ley de tenencia responsable. Revisar antes de decidir.',
    };
  }

  if (normalized === 'estoy de acuerdo') {
    return { category: 'none', message: '' };
  }

  if (normalized === 'no estoy de acuerdo') {
    return {
      category: 'red',
      message:
        'El postulante no está de acuerdo con la tenencia responsable y la esterilización. No asignar un animal sin revisión humana de esta respuesta.',
    };
  }

  if (normalized.startsWith('otro')) {
    return {
      category: 'amber',
      message:
        'El postulante eligió una respuesta alternativa sobre tenencia responsable. Revisar la respuesta completa antes de decidir.',
    };
  }

  return {
    category: 'review',
    message: 'Respuesta inesperada sobre la ley de tenencia responsable. Revisar antes de decidir.',
  };
}

/**
 * Tailwind classes for each alert category.
 */
export const RESPONSIBLE_OWNERSHIP_ALERT_STYLES: Record<
  ResponsibleOwnershipAlert,
  { container: string; badge: string }
> = {
  red: {
    container: 'border-red-300 bg-red-50',
    badge: 'bg-red-600 text-white',
  },
  amber: {
    container: 'border-amber-300 bg-amber-50',
    badge: 'bg-amber-500 text-white',
  },
  review: {
    container: 'border-yellow-300 bg-yellow-50',
    badge: 'bg-yellow-500 text-white',
  },
  none: {
    container: '',
    badge: '',
  },
};
