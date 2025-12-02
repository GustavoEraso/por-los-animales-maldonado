/**
 * Contact label mappings based on animal status
 */
export const contactLabelMap: Record<string, string> = {
  adoptado: 'Adoptante',
  transitorio: 'Transitorio',
  calle: 'Contacto',
  protectora: 'Contacto',
  hogar: 'Con su dueño',
  fallecido: 'Ultimo contacto',
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
 * Transaction type labels mapping for display
 */
export const transactionLabels: Record<string, string> = {
  create: 'Creación',
  update: 'Actualización',
  delete: 'Eliminación',
  transit_change: 'Cambio de tránsito',
  adoption: 'Adopción',
  return: 'Devolución',
  medical: 'Evento médico',
  vaccination: 'Vacunación',
  sterilization: 'Esterilización',
  emergency: 'Emergencia',
  supply: 'Suministro',
  followup: 'Seguimiento',
  note: 'Nota',
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

/**
 * Get the translated label for a transaction type
 * @param type - The transaction type key
 * @returns The translated label or the original type if not found
 */
export function getTransactionLabel(type?: string): string {
  if (!type) return 'Sin tipo';
  return transactionLabels[type] || type;
}
