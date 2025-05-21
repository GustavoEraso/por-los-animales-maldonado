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
    lifeSatge: 'cachorro'|'adulto'|'mayor',
    size: 'pequeño' | 'mediano' | 'grande',
    status: 'disponible' | 'adoptado',
    location: 'calle' | 'protectora' | 'transitorio',
    waitingSince: number,
}