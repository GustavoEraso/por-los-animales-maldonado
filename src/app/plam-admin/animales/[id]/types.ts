import type { AnimalActionModalProps } from '@/types';

/** Contact entry used in adoption/transit forms */
export interface FormContact {
  type: 'celular' | 'email' | 'other';
  value: string;
}

/** Shared form data for adoption and return modals */
export interface AdoptionFormData {
  contactName: string;
  contacts: FormContact[];
  note: string;
  newStatus?: 'transitorio' | 'adoptado';
  selectedFormId?: string;
  selectedFormName?: string;
}

/** Form data for transit change modal */
export interface TransitChangeFormData {
  contactName: string;
  contacts: FormContact[];
  note: string;
}

/** Default values for adoption form */
export const DEFAULT_ADOPTION_DATA: AdoptionFormData = {
  contactName: '',
  contacts: [{ type: 'celular', value: '' }],
  note: '',
  newStatus: 'transitorio',
};

/** Default values for transit change form */
export const DEFAULT_TRANSIT_DATA: TransitChangeFormData = {
  contactName: '',
  contacts: [{ type: 'celular', value: '' }],
  note: '',
};

// Re-export types moved to @/types so existing imports still work
export type { AnimalActionModalProps };
