import { Animal, AnimalTransactionType, PrivateInfoType } from '@/types';

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
}

/** Form data for transit change modal */
export interface TransitChangeFormData {
  contactName: string;
  contacts: FormContact[];
  note: string;
}

/** Event types available for registration */
export type EventType =
  | 'medical'
  | 'vaccination'
  | 'sterilization'
  | 'emergency'
  | 'supply'
  | 'followup'
  | 'deceased'
  | 'other';

/** Form data for event registration modal */
export interface EventFormData {
  eventType: EventType;
  note: string;
  cost: string;
  vaccineName?: string;
  vaccineDate?: string;
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

/** Default values for event form */
export const DEFAULT_EVENT_DATA: EventFormData = {
  eventType: 'medical',
  note: '',
  cost: '',
  vaccineName: '',
  vaccineDate: new Date().toISOString().split('T')[0],
};

/** Shared props for action modals that modify animal/private info */
export interface AnimalActionModalProps {
  animal: Animal;
  privateInfo: PrivateInfoType;
  setAnimal: React.Dispatch<React.SetStateAction<Animal | null>>;
  setPrivateInfo: React.Dispatch<React.SetStateAction<PrivateInfoType | null>>;
  setAllAnimalTransactions: React.Dispatch<React.SetStateAction<AnimalTransactionType[]>>;
}
