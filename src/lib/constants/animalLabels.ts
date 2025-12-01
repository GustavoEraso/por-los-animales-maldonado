/**
 * Contact label mappings based on animal status
 */
export const contactLabelMap: Record<string, string> = {
  adoptado: 'Adoptante',
  transitorio: 'Transitorio',
  calle: 'Contacto',
  protectora: 'Contacto',
  hogar: 'Con su dueño',
};

/**
 * Rescue reason translations
 */
export const RESCUE_REASON_PARSE: Record<string, string> = {
  abandonment: 'Abandono',
  lost: 'Perdido',
  sterilization: 'Esterilización',
  illness: 'Enfermedad',
  abuse: 'Maltrato',
  hit_by_vehicle: 'Atropellado',
  other: 'Otro',
};

/**
 * Yes/No/Unknown options translations
 */
export const YesNoUnknownMap: Record<string, string> = {
  si: 'Sí',
  no: 'No',
  no_se: 'No sabemos',
};

/**
 * Event type labels for animal events
 */
export const eventLabels: Record<string, string> = {
  medical: 'Médico',
  vaccination: 'Vacunación',
  sterilization: 'Esterilización',
  emergency: 'Emergencia',
  supply: 'Suministro',
  followup: 'Seguimiento',
  deceased: 'Fallecimiento',
  other: 'Otro',
};

/**
 * Get the translated label for a rescue reason
 * @param reason - The rescue reason key
 * @returns The translated label or the original reason if not found
 */
export function getRescueReasonLabel(reason?: string): string {
  if (!reason) return '';
  return RESCUE_REASON_PARSE[reason] || reason;
}
