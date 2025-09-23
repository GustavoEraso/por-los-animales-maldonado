export interface Img {
  imgId: string;
  imgUrl: string;
  imgAlt: string;
}

type YesNoUnknown = 'si' | 'no' | 'no_se';

export interface CompatibilityType {
  dogs: YesNoUnknown;
  cats: YesNoUnknown;
  kids: YesNoUnknown;
}
export interface Animal {
  id: string;
  name: string;
  gender: 'macho' | 'hembra';
  species: 'perro' | 'gato' | 'otros';
  images: Img[];
  description: string;
  aproxBirthDate: number;
  lifeStage: 'cachorro' | 'adulto' | 'mayor';
  size: 'pequeño' | 'mediano' | 'grande';
  compatibility: CompatibilityType;
  isSterilized: YesNoUnknown;
  isAvalible: boolean;
  isVisible: boolean;
  status: 'calle' | 'protectora' | 'transitorio' | 'adoptado';
  waitingSince: number;
  isDeleted?: boolean;
  hardDeleted?: boolean;
}

interface ContactType {
  type: 'celular' | 'email' | 'other';
  value: string | number;
}

export interface PrivateInfoType {
  id: string;
  name: string;
  contactName?: string;
  contacts?: ContactType[];
}

export interface AnimalTransactionType extends Partial<Animal>, PrivateInfoType {
  id: string;
  name: string;
  notes?: string;
  date: number;
  modifiedBy: string;
  since: number;
}

export interface UserType {
  id: string;
  name: string;
  role: string;
}

export interface WpContactType {
  name: string;
  phone: string;
  countryCode: string;
}

export interface CollectionsType {
  currentColection:
    | 'animals'
    | 'authorizedEmails'
    | 'contacts'
    | 'animalTransactions'
    | 'animalPrivateInfo';
}
