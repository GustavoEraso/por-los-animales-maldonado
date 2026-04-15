import React from 'react';
import { ViewTransition } from 'react';
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
 * @param {string} [props.href] - Optional custom href for the link. Defaults to `/adopta/${id}`
 * @returns {React.ReactElement} The rendered animal card component
 *
 * @example
 * // Basic usage
 * <Card props={animalData} />
 *
 * @example
 * // With custom href
 * <Card props={animalData} href={`/custom-path/${animalData.id}`} />
 *
 * @example
 * // With animal object
 * const animal = { id: '123', name: 'Max', gender: 'Macho', lifeStage: 'Adulto', status: 'Disponible', images: [...] };
 * <Card props={animal} />
 */
export default function Card({
  animal,
  href,
  adminView,
}: {
  animal: Animal;
  href?: string;
  adminView?: boolean;
}): React.ReactElement {
  const { id, name, gender, lifeStage, images, status } = animal;
  const img = images[0] ?? {
    imgUrl: '/logo300.webp',
    imgAlt: 'Imagen no disponible',
  };

  const isDeceased = status.toLowerCase() === 'fallecido';

  return (
    <article
      className={` relative grid grid-rows-[1.8fr_auto] rounded-xl overflow-hidden hover:scale-105 shadow bg-cream-light`}
    >
      <Link
        href={href || `/adopta/${id}`}
        className={` ${isDeceased ? 'grayscale' : ''} block w-full h-full`}
      >
        <div className="aspect-square">
          <ViewTransition name={`animal-${id}`}>
            <Image
              src={img.imgUrl}
              alt={img.imgAlt}
              className="w-full h-full object-cover bg-white"
              width={300}
              height={300}
            />
          </ViewTransition>
        </div>

        <div className="flex flex-col items-center gap-1 p-2">
          <h3 className="uppercase text-2xl text-center font-extrabold">{name}</h3>
          {status != 'fallecido' && <p className="text-center">{`${gender} | ${lifeStage} `}</p>}
        </div>
        {(adminView || animal.litterId) && (
          <div className="flex flex-col gap-1 absolute top-2 left-2">
            {animal.litterId && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-lg">
                🐾 {animal.litterName ?? 'Camada'}
              </span>
            )}
            {adminView && !animal.isVisible && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-lg">
                No se esta mostrando
              </span>
            )}
            {adminView && !animal.isAvailable && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-lg">
                No esta disponible
              </span>
            )}
          </div>
        )}
      </Link>
      {status === 'fallecido' && (
        <p className=" absolute top-2 left-2 text-center bg-red-600 text-white px-2 py-1 rounded-lg">
          Fallecido{' '}
        </p>
      )}
    </article>
  );
}
