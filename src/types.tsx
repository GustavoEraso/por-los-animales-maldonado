export interface Img {
  imgId: string,
  imgUrl: string,
  imgAlt: string,
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
  isAvalible: boolean,
  location: 'calle' | 'protectora' | 'transitorio' | 'adoptado',
  waitingSince: number,
}

interface ContactType {
  type: 'celular' | 'email' | 'other';
  value: string | number;
}

export type PrivateInfo ={
    isAvalible: boolean,   
    location: 'calle' | 'adoptado'|'transitorio'|'protectora';
    since: number;
    contactName: string;
    contacts?: ContactType[];
    notes?: string;
    date: number;
    modifiedBy: string;
  }
  