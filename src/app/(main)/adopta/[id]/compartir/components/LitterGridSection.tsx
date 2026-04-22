import { useEffect, useMemo, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Animal } from '@/types';
import AdjustableImage from '@/elements/AdjustableImage';

interface LitterGridSectionProps {
  animals: Animal[];
  rows: number;
  nameTextClass: string;
  secondaryBgColor: `#${string}`;
  secondaryTextColor: `#${string}`;
}

interface LitterImageAdjustments {
  imageIndex: number;
  scale: number;
  positionX: number;
  positionY: number;
}

interface PositionRange {
  x: number;
  y: number;
}

interface PopupOffset {
  x: number;
  y: number;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
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
  const MIN_SCALE = 1;
  const TEXT_OUTLINE_SHADOW =
    '0 1px 1.5px rgba(0,0,0,0.55), 0 0 1px rgba(0,0,0,0.3)';

  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [isAdjustPopupOpen, setIsAdjustPopupOpen] = useState(false);
  const [popupOffset, setPopupOffset] = useState<PopupOffset>({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [adjustmentsByAnimalId, setAdjustmentsByAnimalId] = useState<
    Record<string, LitterImageAdjustments>
  >({});
  const [positionRangeByAnimalId, setPositionRangeByAnimalId] = useState<
    Record<string, PositionRange>
  >({});

  const DEFAULT_ADJUSTMENTS: LitterImageAdjustments = {
    imageIndex: 0,
    scale: 1,
    positionX: 0,
    positionY: 0,
  };

  const getAnimalAdjustments = (animalId: string): LitterImageAdjustments => {
    return adjustmentsByAnimalId[animalId] || DEFAULT_ADJUSTMENTS;
  };

  const getAnimalPositionRange = (animalId: string): PositionRange => {
    return positionRangeByAnimalId[animalId] || { x: 0, y: 0 };
  };

  const updateAnimalPositionRange = (animalId: string, nextRange: PositionRange): void => {
    setPositionRangeByAnimalId((prev) => {
      const current = prev[animalId] || { x: 0, y: 0 };

      if (current.x === nextRange.x && current.y === nextRange.y) {
        return prev;
      }

      return {
        ...prev,
        [animalId]: nextRange,
      };
    });
  };

  const updateAnimalAdjustments = (
    animalId: string,
    updates: Partial<LitterImageAdjustments>
  ): void => {
    setAdjustmentsByAnimalId((prev) => {
      const current = prev[animalId] || DEFAULT_ADJUSTMENTS;
      const next = {
        ...current,
        ...updates,
      };

      if (
        next.imageIndex === current.imageIndex &&
        next.scale === current.scale &&
        next.positionX === current.positionX &&
        next.positionY === current.positionY
      ) {
        return prev;
      }

      return {
        ...prev,
        [animalId]: next,
      };
    });
  };

  const effectiveSelectedAnimalId = useMemo(() => {
    if (!isAdjustPopupOpen) return null;

    if (animals.length === 0) return null;

    const selectedStillExists = selectedAnimalId
      ? animals.some((animal) => animal.id === selectedAnimalId)
      : false;

    return selectedStillExists ? selectedAnimalId : animals[0].id;
  }, [animals, selectedAnimalId, isAdjustPopupOpen]);

  const selectedAnimal = useMemo(() => {
    if (!effectiveSelectedAnimalId) return null;

    return animals.find((animal) => animal.id === effectiveSelectedAnimalId) || null;
  }, [animals, effectiveSelectedAnimalId]);

  const selectedAdjustments = selectedAnimal
    ? getAnimalAdjustments(selectedAnimal.id)
    : DEFAULT_ADJUSTMENTS;
  const selectedPositionRange = selectedAnimal
    ? getAnimalPositionRange(selectedAnimal.id)
    : { x: 0, y: 0 };

  const selectedPositionXValue = Math.max(
    -selectedPositionRange.x,
    Math.min(selectedPositionRange.x, selectedAdjustments.positionX)
  );
  const selectedPositionYValue = Math.max(
    -selectedPositionRange.y,
    Math.min(selectedPositionRange.y, selectedAdjustments.positionY)
  );

  const handleSelectedZoomChange = (delta: number): void => {
    if (!selectedAnimal) return;

    const nextScale = selectedAdjustments.scale + delta;
    if (nextScale < MIN_SCALE) return;

    updateAnimalAdjustments(selectedAnimal.id, { scale: nextScale });
  };

  const handleSelectedImageChange = (direction: 1 | -1): void => {
    if (!selectedAnimal) return;

    const imagesCount = selectedAnimal.images?.length || 0;
    if (imagesCount <= 1) return;

    const nextIndex = (selectedAdjustments.imageIndex + direction + imagesCount) % imagesCount;

    updateAnimalAdjustments(selectedAnimal.id, { imageIndex: nextIndex });
  };

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

  const handlePopupPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();

    setDragState({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: popupOffset.x,
      originY: popupOffset.y,
    });
  };

  const handleAdjustButtonClick = (animalId: string): void => {
    if (isAdjustPopupOpen && selectedAnimalId === animalId) {
      setDragState(null);
      setIsAdjustPopupOpen(false);
      setSelectedAnimalId(null);
      return;
    }

    setSelectedAnimalId(animalId);
    setIsAdjustPopupOpen(true);
  };

  useEffect(() => {
    if (!dragState || !isAdjustPopupOpen) return;

    const handlePopupPointerMove = (event: PointerEvent): void => {
      if (event.pointerId !== dragState.pointerId) return;

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;

      setPopupOffset({
        x: dragState.originX + deltaX,
        y: dragState.originY + deltaY,
      });
    };

    const handlePopupPointerUp = (event: PointerEvent): void => {
      if (event.pointerId !== dragState.pointerId) return;

      setDragState(null);
    };

    window.addEventListener('pointermove', handlePopupPointerMove);
    window.addEventListener('pointerup', handlePopupPointerUp);
    window.addEventListener('pointercancel', handlePopupPointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePopupPointerMove);
      window.removeEventListener('pointerup', handlePopupPointerUp);
      window.removeEventListener('pointercancel', handlePopupPointerUp);
    };
  }, [dragState, isAdjustPopupOpen]);

  return (
    <section
      style={{
        backgroundColor: secondaryBgColor,
        color: secondaryTextColor,
      }}
      className="relative w-full overflow-hidden flex-1 min-h-0 p-0.5"
    >
      {selectedAnimal && isAdjustPopupOpen && (
        <div
          data-html2canvas-ignore
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${popupOffset.x}px), calc(-50% + ${popupOffset.y}px))`,
          }}
          className="fixed z-[120] w-[min(92vw,24rem)] rounded-lg border border-black/20 bg-white/95 px-2 py-1.5 text-black shadow-xl"
        >
          <div
            data-html2canvas-ignore
            onPointerDown={handlePopupPointerDown}
            className="mb-1 rounded border border-dashed border-black/25 bg-black/5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide cursor-move select-none touch-none"
          >
            Arrastrar
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold truncate">
              Ajustando: {selectedAnimal.name || 'Sin nombre'}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold">
                zoom {Math.round(selectedAdjustments.scale * 100)}%
              </span>
              <button
                type="button"
                className="rounded border border-black/20 bg-white px-2 py-0.5 text-[11px] font-bold"
                onClick={() => {
                  setDragState(null);
                  setIsAdjustPopupOpen(false);
                  setSelectedAnimalId(null);
                }}
              >
                Cerrar
              </button>
            </div>
          </div>

          <div className="mt-1 flex items-center gap-1">
            <button
              type="button"
              disabled={selectedAdjustments.scale <= MIN_SCALE}
              className="flex-1 rounded border border-black/20 bg-white px-2 py-1 text-xs font-semibold disabled:opacity-50"
              onClick={() => handleSelectedZoomChange(-0.05)}
            >
              - zoom
            </button>
            <button
              type="button"
              className="flex-1 rounded border border-black/20 bg-white px-2 py-1 text-xs font-semibold"
              onClick={() => handleSelectedZoomChange(0.05)}
            >
              + zoom
            </button>
            <button
              type="button"
              disabled={(selectedAnimal.images?.length || 0) <= 1}
              className="flex-1 rounded border border-black/20 bg-white px-2 py-1 text-xs font-semibold disabled:opacity-50"
              onClick={() => handleSelectedImageChange(-1)}
            >
              anterior
            </button>
            <button
              type="button"
              disabled={(selectedAnimal.images?.length || 0) <= 1}
              className="flex-1 rounded border border-black/20 bg-white px-2 py-1 text-xs font-semibold disabled:opacity-50"
              onClick={() => handleSelectedImageChange(1)}
            >
              siguiente
            </button>
          </div>

          <div className="mt-2 space-y-1.5">
            <label className="block">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span>Posición X</span>
                <span>{Math.round(selectedPositionXValue)}</span>
              </div>
              <input
                data-html2canvas-ignore
                type="range"
                min={-selectedPositionRange.x}
                max={selectedPositionRange.x}
                step={1}
                value={selectedPositionXValue}
                disabled={selectedPositionRange.x <= 0}
                onChange={(event) => {
                  if (!selectedAnimal) return;

                  updateAnimalAdjustments(selectedAnimal.id, {
                    positionX: Number(event.target.value),
                  });
                }}
                className="w-full disabled:opacity-50"
              />
            </label>

            <label className="block">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span>Posición Y</span>
                <span>{Math.round(selectedPositionYValue)}</span>
              </div>
              <input
                data-html2canvas-ignore
                type="range"
                min={-selectedPositionRange.y}
                max={selectedPositionRange.y}
                step={1}
                value={selectedPositionYValue}
                disabled={selectedPositionRange.y <= 0}
                onChange={(event) => {
                  if (!selectedAnimal) return;

                  updateAnimalAdjustments(selectedAnimal.id, {
                    positionY: Number(event.target.value),
                  });
                }}
                className="w-full disabled:opacity-50"
              />
            </label>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-0.5 w-full h-full">
        {animals.length === 0 && (
          <article className="col-span-full h-full flex items-center justify-center rounded-sm border border-black/10 bg-white/70 p-3 text-center">
            <p className="text-sm font-semibold">
              No hay integrantes para mostrar con los filtros seleccionados.
            </p>
          </article>
        )}

        {rowsOfAnimals.map((animalsInRow, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex-1 min-h-0 w-full flex gap-0.5">
            {animalsInRow.map((litterAnimal) => {
              const images = imageUrlsByAnimalId.get(litterAnimal.id) || [];
              const gender = litterAnimal.gender || '';
              const adjustments = getAnimalAdjustments(litterAnimal.id);
              const isSelected = litterAnimal.id === effectiveSelectedAnimalId;

              return (
                <article
                  key={litterAnimal.id}
                  className="relative flex-1 min-w-0 overflow-hidden rounded-sm border border-black/10"
                >
                  <button
                    type="button"
                    data-html2canvas-ignore
                    className={`absolute top-1 right-1 z-10 rounded-full px-2 py-0.5 text-[11px] font-bold border ${
                      isSelected
                        ? 'bg-amber-200 border-amber-400 text-black'
                        : 'bg-white/90 border-black/20 text-black'
                    }`}
                    onClick={() => handleAdjustButtonClick(litterAnimal.id)}
                  >
                    Ajustar
                  </button>

                  <AdjustableImage
                    width="100%"
                    height="100%"
                    imageUrls={images}
                    currentImageIndex={adjustments.imageIndex}
                    onCurrentImageIndexChange={(nextIndex) =>
                      updateAnimalAdjustments(litterAnimal.id, { imageIndex: nextIndex })
                    }
                    scale={adjustments.scale}
                    onScaleChange={(nextScale) =>
                      updateAnimalAdjustments(litterAnimal.id, {
                        scale: Math.max(MIN_SCALE, nextScale),
                      })
                    }
                    positionX={adjustments.positionX}
                    onPositionXChange={(nextPositionX) =>
                      updateAnimalAdjustments(litterAnimal.id, { positionX: nextPositionX })
                    }
                    positionY={adjustments.positionY}
                    onPositionYChange={(nextPositionY) =>
                      updateAnimalAdjustments(litterAnimal.id, { positionY: nextPositionY })
                    }
                    onPositionRangeChange={(nextRange) =>
                      updateAnimalPositionRange(litterAnimal.id, nextRange)
                    }
                    showControls={false}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 text-white px-1.5 py-1">
                    <p
                      style={{ textShadow: TEXT_OUTLINE_SHADOW }}
                      className={`${nameTextClass} font-extrabold uppercase truncate`}
                    >
                      {litterAnimal.name || 'Sin nombre'}
                    </p>
                    <p
                      style={{ textShadow: TEXT_OUTLINE_SHADOW }}
                      className="text-[10px] uppercase tracking-wide"
                    >
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
