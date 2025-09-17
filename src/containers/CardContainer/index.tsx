import React from 'react';
import Card from "@/components/Card";
import { Animal } from "@/types";

/**
 * Props for the CardContainer component.
 */
interface CardContainerProps {
  /** Array of animals to display in the card grid */
  animalsList: Animal[];
}

/**
 * Container component that displays a responsive grid of animal cards.
 *
 * Renders a collection of animal cards in a responsive CSS grid layout that
 * automatically adjusts the number of columns based on available space.
 * Each card displays information about an individual animal and uses the
 * animal's ID for stable React keys.
 *
 * @param {CardContainerProps} props - Component props
 * @param {Animal[]} [props.animalsList=[]] - Array of animals to display in cards
 * @returns {React.ReactElement} The rendered card container with animal grid
 *
 * @example
 * // Display a list of animals in a responsive grid
 * const animals = [
 *   { 
 *     id: '1', 
 *     name: 'Luna', 
 *     species: 'perro', 
 *     gender: 'hembra',
 *     images: [{ imgId: '1', imgUrl: '/luna.jpg', imgAlt: 'Luna' }],
 *     description: 'Perrita muy cariñosa',
 *     // ...other Animal properties
 *   },
 *   { 
 *     id: '2', 
 *     name: 'Michi', 
 *     species: 'gato', 
 *     gender: 'macho',
 *     images: [{ imgId: '2', imgUrl: '/michi.jpg', imgAlt: 'Michi' }],
 *     description: 'Gatito juguetón',
 *     // ...other Animal properties
 *   },
 * ];
 * <CardContainer animalsList={animals} />
 *
 * @example
 * // Empty state with no animals
 * <CardContainer animalsList={[]} />
 */
export default function CardContainer({ animalsList = [] }: CardContainerProps): React.ReactElement {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 sm:p-4">
      {animalsList.map((animal, index) => (
        <Card key={`${animal.id}CardContainer${index}`} props={animal} />
      ))}
    </div>
  );
}