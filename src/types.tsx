interface img{
    imgId:string,
    imgUrl:string,
    imgAlt:string,
}

export interface Animal {
    id: string,
    name: string,
    gender:'macho'| 'hembra'
    species:'perro'|'gato'|'otros'
    images: img[],
    description: string,
    aproxBirthDate: number;
    lifeSatge: 'cachorro'|'adulto'|'mayor',
    size: 'pequeño' | 'mediano' | 'grande',
    status: 'disponible' | 'adoptado',
    location: 'calle' | 'protectora' | 'transitorio',
    waitingSince: number,
    statusInfo?: StatusInfo;
}

type StatusInfo =
  | {
      type: 'adoptado';
      adoptedAt: number;
      adopterName: string;
      contact?: string;
      notes?: string;
    }
  | {
      type: 'transitorio';
      contact: string;
      startedAt: number;
      notes?: string;
    }
  | {
      type: 'protectora';
      shelterName: string;
      responsible: string;
      since: number;
    };