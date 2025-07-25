export interface Img {
  imgId: string,
  imgUrl: string,
  imgAlt: string,
}

type YesNoUnknown = 'si' | 'no' | 'no_se';

export interface CompatibilityType {
  dogs: YesNoUnknown;
  cats: YesNoUnknown;
  kids: YesNoUnknown;
}
export interface Animal {
  id: string,
  name: string,
  gender: 'macho' | 'hembra'
  species: 'perro' | 'gato' | 'otros'
  images: Img[],
  description: string,
  aproxBirthDate: number;
  lifeStage: 'cachorro' | 'adulto' | 'mayor',
  size: 'pequeño' | 'mediano' | 'grande',
  compatibility: CompatibilityType
  isSterilized: YesNoUnknown,
  isAvalible: boolean,
  isVisible: boolean,
  status: 'calle' | 'protectora' | 'transitorio' | 'adoptado',
  waitingSince: number,
  isDeleted?: boolean,
}

interface ContactType {
  type: 'celular' | 'email' | 'other';
  value: string | number,
}

export interface PrivateInfo {
  isAvalible: boolean,
  isVisible: boolean,
  status: 'calle' | 'adoptado' | 'transitorio' | 'protectora',
  since: number,
  contactName: string,
  contacts?: ContactType[],
  notes?: string,
  date: number,
  modifiedBy: string,
  isDeleted?: boolean,
}

export interface PrivateInfoDocType {
  id: string;
  data: Record<string, PrivateInfo>;
}


export interface UserType {
  id: string,
  name: string,
  role: string
}

export interface CollectionsType {
  currentColection: 'animals' | 'authorizedEmails' | 'privateInfo'
}