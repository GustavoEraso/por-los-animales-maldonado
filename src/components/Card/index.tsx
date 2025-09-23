import React from 'react';
import { unstable_ViewTransition as ViewTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Animal } from '@/types';

/**
 * Animal card component for displaying animal information in a grid layout.
 *
 * Renders an animal card with an image, name, basic info (gender, life stage, status),
 * and a link to view more details. Includes hover animations and view transitions.
 *
 * @param {Object} props - Component props
 * @param {Animal} props.props - Animal data object containing all animal information
 * @returns {React.ReactElement} The rendered animal card component
 *
 * @example
 * // Basic usage
 * <Card props={animalData} />
 *
 * @example
 * // With animal object
 * const animal = { id: '123', name: 'Max', gender: 'Macho', lifeStage: 'Adulto', status: 'Disponible', images: [...] };
 * <Card props={animal} />
 */
export default function Card({ props }: { props: Animal }): React.ReactElement {
  const { id, name, gender, lifeStage, status, images } = props;
  const img = images[0] ?? {
    imgUrl: '/logo300.webp',
    imgAlt: 'Imagen no disponible',
  };

  return (
    <article className="grid grid-rows-[1.8fr_1fr] rounded-xl overflow-hidden hover:scale-105 shadow bg-cream-light">
      <div className="aspect-square">
        <ViewTransition name={`animal-${id}`}>
          <Link href={`/adopta/${id}`} className="block w-full h-full">
            <Image
              src={img.imgUrl}
              alt={img.imgAlt}
              className="w-full h-full object-cover bg-white"
              width={300}
              height={300}
            />
          </Link>
        </ViewTransition>
      </div>

      <div className="flex flex-col items-center gap-1 p-2">
        <h3 className="uppercase text-2xl text-center font-extrabold">{name}</h3>
        <p className="text-center">{`${gender} | ${lifeStage} | ${status}`}</p>
        <Link
          href={`/adopta/${id}`}
          className="w-fit text-xl rounded-full px-2 py-1 text-white bg-caramel-deep hover:bg-amber-sunset"
        >
          Ver más info
        </Link>
      </div>
    </article>
  );
}
