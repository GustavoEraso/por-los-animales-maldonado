import { Animal, AnimalTransactionType, PrivateInfoType } from '@/types';
import { createTimestamp } from '@/lib/dateUtils';

/** Initial state for a new animal */
export const INITIAL_ANIMAL: Animal = {
  id: '',
  name: '',
  gender: 'macho',
  species: 'perro',
  images: [],
  description: '',
  aproxBirthDate: createTimestamp(),
  lifeStage: 'cachorro',
  size: 'mediano',
  compatibility: {
    dogs: 'no_se',
    cats: 'no_se',
    kids: 'no_se',
  },
  isSterilized: 'no_se',
  isAvailable: false,
  isVisible: false,
  isDeleted: false,
  status: 'transitorio',
  waitingSince: createTimestamp(),
};

/** Initial state for private info */
export const INITIAL_PRIVATE_INFO: PrivateInfoType = {
  caseManager: '',
  id: '',
  name: '',
  contactName: '',
  contacts: [],
};

/** Initial state for the first transaction */
export const INITIAL_TRANSACTION: AnimalTransactionType = {
  id: '',
  name: '',
  isAvailable: false,
  isVisible: false,
  isDeleted: false,
  status: 'transitorio',
  date: createTimestamp(),
  modifiedBy: '',
  since: createTimestamp(),
};

/** Age options for the approximate birth date selector */
export const DATE_OPTIONS = [
  { label: '15 días', value: 0.5 },
  { label: '1 mes', value: 1 },
  { label: '1 mes y medio', value: 1.5 },
  { label: '2 meses', value: 2 },
  { label: '3 meses', value: 3 },
  { label: '4 meses', value: 4 },
  { label: '5 meses', value: 5 },
  { label: '6 meses', value: 6 },
  { label: '7 meses', value: 7 },
  { label: '8 meses', value: 8 },
  { label: '9 meses', value: 9 },
  { label: '10 meses', value: 10 },
  { label: '11 meses', value: 11 },
  { label: '1 año', value: 12 },
  { label: '1 año y medio', value: 18 },
  { label: '2 años', value: 24 },
  { label: '3 años', value: 36 },
  { label: '4 años', value: 48 },
  { label: '5 años', value: 60 },
  { label: '6 años', value: 72 },
  { label: '7 años', value: 84 },
  { label: '8 años', value: 96 },
  { label: '9 años', value: 108 },
  { label: '10 años', value: 120 },
  { label: '12 años', value: 144 },
  { label: '14 años', value: 168 },
] as const;

/** Form validation error keys */
export interface FormErrors {
  name: boolean;
  images: boolean;
  description: boolean;
  rescueReason: boolean;
  contactName: boolean;
  contacts: boolean;
}

/** Error messages shown for each form field */
export const FIELD_ERROR_MESSAGES: Record<keyof FormErrors, string> = {
  name: 'Debes ingresar el nombre del animal.',
  images: 'No subiste ninguna imagen.',
  description: 'Falta una descripción.',
  rescueReason: 'Debes seleccionar un motivo del rescate.',
  contactName: 'Falta el nombre de contacto.',
  contacts: 'Faltan medios de contacto.',
};
