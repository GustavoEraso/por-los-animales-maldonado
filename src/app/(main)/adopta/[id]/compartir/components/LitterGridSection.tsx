import { useMemo } from 'react';
import { Animal } from '@/types';
import AdjustableImage from '@/elements/AdjustableImage';

interface LitterGridSectionProps {
  animals: Animal[];
  rows: number;
  nameTextClass: string;
  secondaryBgColor: `#${string}`;
  secondaryTextColor: `#${string}`;
}

function splitAnimalsByRows(animals: Animal[], requestedRows: number): Animal[][] {
  if (animals.length === 0) return [];

  const safeRows = Math.max(1, requestedRows);
  const effectiveRows = Math.min(safeRows, animals.length);
  const basePerRow = Math.floor(animals.length / effectiveRows);
  const extraItems = animals.length % effectiveRows;

  const rows: Animal[][] = [];
  let startIndex = 0;

  for (let rowIndex = 0; rowIndex < effectiveRows; rowIndex += 1) {
    const shouldReceiveExtra = rowIndex >= effectiveRows - extraItems;
    const itemsInRow = basePerRow + (shouldReceiveExtra ? 1 : 0);
    const endIndex = startIndex + itemsInRow;

    rows.push(animals.slice(startIndex, endIndex));
    startIndex = endIndex;
  }

  return rows;
}

/**
 * Renders the litter sharing grid used in the share poster preview.
 * Includes an empty state and a featured-first-card layout for bigger litters.
 *
 * @example
 * <LitterGridSection
 *   animals={visibleLitterAnimals}
 *   rows={2}
 *   nameTextClass="text-xs"
 *   secondaryBgColor="#fbf7ea"
 *   secondaryTextColor="#272727"
 * />
 */
export default function LitterGridSection({
  animals,
  rows,
  nameTextClass,
  secondaryBgColor,
  secondaryTextColor,
}: LitterGridSectionProps) {
  // Keep image URL arrays stable across parent re-renders (e.g. capture state changes)
  // so AdjustableImage does not reset zoom to 100% unexpectedly.
  const imageUrlsByAnimalId = useMemo(() => {
    const urlsMap = new Map<string, string[]>();

    animals.forEach((animal) => {
      urlsMap.set(animal.id, animal.images?.map((img) => img.imgUrl) || []);
    });

    return urlsMap;
  }, [animals]);

  const rowsOfAnimals = useMemo(() => {
    return splitAnimalsByRows(animals, rows);
  }, [animals, rows]);

  return (
    <section
      style={{
        backgroundColor: secondaryBgColor,
        color: secondaryTextColor,
      }}
      className="w-full overflow-hidden flex-1 min-h-0 p-0.5"
    >
      <div className="flex flex-col gap-0.5 w-full h-full">
        {animals.length === 0 && (
          <article className="col-span-full h-full flex items-center justify-center rounded-sm border border-black/10 bg-white/70 p-3 text-center">
            <p className="text-sm font-semibold">
              No hay integrantes para mostrar con los filtros seleccionados.
            </p>
          </article>
        )}

        {rowsOfAnimals.map((animalsInRow, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="flex-1 min-h-0 w-full flex gap-0.5"
          >
            {animalsInRow.map((litterAnimal) => {
              const images = imageUrlsByAnimalId.get(litterAnimal.id) || [];
              const gender = litterAnimal.gender || '';

              return (
                <article
                  key={litterAnimal.id}
                  className="relative flex-1 min-w-0 overflow-hidden rounded-sm border border-black/10"
                >
                  <AdjustableImage
                    width="100%"
                    height="100%"
                    imageUrls={images}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/55 text-white px-1.5 py-1">
                    <p className={`${nameTextClass} font-extrabold uppercase truncate`}>
                      {litterAnimal.name || 'Sin nombre'}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide">
                      {gender ? gender : 'Sin información'}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
