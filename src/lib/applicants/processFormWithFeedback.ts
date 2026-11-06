'use client';

import { toast } from 'react-toastify';
import { handleToast } from '@/lib/handleToast';
import { logger } from '@/lib/logger';
import { ensureApplicantProfile } from '@/lib/applicants/identity';
import type { EnsureApplicantProfileResult } from '@/lib/applicants/identity';

/**
 * Runs the applicant ficha/contact-index processing with the shared UI
 * feedback (pending toast, outcome toast) used by the form detail views and
 * the adoption/return modals.
 *
 * @param params.formId - The googleForms document ID to process
 * @param params.actor - Staff member triggering the processing
 * @returns The processing outcome, or null when it failed (the caller keeps
 *   working with the form data; processing is retried on the next open)
 *
 * @example
 * const result = await processApplicantProfileWithFeedback({ formId, actor });
 * const applicantId = result?.applicantId ?? form.applicantId;
 */
export async function processApplicantProfileWithFeedback(params: {
  formId: string;
  actor: { id: string; name: string };
}): Promise<EnsureApplicantProfileResult | null> {
  const pendingToastId = handleToast({
    type: 'info',
    title: 'Generando ficha de postulante...',
    text: 'Creando la ficha y dejando los contactos pendientes de confirmación.',
    autoClose: false,
    closeOnClick: false,
  });

  try {
    const result = await ensureApplicantProfile(params);
    toast.dismiss(pendingToastId);

    if (result.status === 'unresolved') {
      handleToast({
        type: 'warning',
        title: 'Sin ficha de postulante',
        text: 'No se pudo asociar automáticamente (falta el correo de login). Revisar manualmente.',
      });
    } else {
      handleToast({
        type: 'success',
        title: 'Ficha de postulante lista',
        text:
          result.status === 'created'
            ? 'Se creó una ficha nueva. El email automático de Google quedó confirmado y los teléfonos pendientes de revisión.'
            : 'El formulario se vinculó a la ficha existente.',
      });
    }

    return result;
  } catch (error) {
    toast.dismiss(pendingToastId);
    logger({
      level: 'error',
      code: 'ENSURE_APPLICANT_PROFILE_FAILED',
      message: `Could not process applicant identity for form ${params.formId}`,
      data: error,
    });
    handleToast({
      type: 'error',
      title: 'Error',
      text: 'No se pudo generar la ficha de postulante. Se reintentará al abrir el formulario.',
    });
    return null;
  }
}
