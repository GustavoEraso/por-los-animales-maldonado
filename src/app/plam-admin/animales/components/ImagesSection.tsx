import { Img } from '@/types';
import UploadImages from '@/elements/UploadImage';
import { CaretUpIcon, CaretDownIcon, XIcon } from '@/components/Icons';
import { useState, useRef, useCallback, useEffect } from 'react';

interface ImagesSectionProps {
  images: Img[];
  setImages: React.Dispatch<React.SetStateAction<Img[]>>;
  formErrors: { images: boolean };
  handleImageDelete: (imgId: string) => Promise<void>;
  isLitter?: boolean;
  imagesErrorMessage?: string;
}

/**
 * Section for displaying uploaded images, deleting them, and uploading new ones.
 * Shows validation errors and limits uploads to 5 images.
 * Hidden in litter mode (images are managed per member).
 * Supports drag-and-drop reordering of images.
 */
export default function ImagesSection({
  images,
  setImages,
  formErrors,
  handleImageDelete,
  isLitter = false,
  imagesErrorMessage = 'No subiste ninguna imagen.',
}: ImagesSectionProps): React.ReactElement {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [focusTargetIndex, setFocusTargetIndex] = useState<number | null>(null);
  const dragItemIndex = useRef<number | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (focusTargetIndex === null) return;
    const el = sectionRef.current?.querySelector(`[data-image-index="${focusTargetIndex}"]`);
    const btn = el?.querySelector('button');
    btn?.focus();
    setFocusTargetIndex(null);
  }, [focusTargetIndex]);

  const handleDragStart = useCallback((index: number) => {
    dragItemIndex.current = index;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      const sourceIndex = dragItemIndex.current;
      if (sourceIndex === null || sourceIndex === targetIndex) {
        dragItemIndex.current = null;
        setDragOverIndex(null);
        return;
      }

      setImages((prev) => {
        const newImages = [...prev];
        const [draggedItem] = newImages.splice(sourceIndex, 1);
        newImages.splice(targetIndex, 0, draggedItem);
        return newImages;
      });

      dragItemIndex.current = null;
      setDragOverIndex(null);
    },
    [setImages]
  );

  const handleDragEnd = useCallback(() => {
    dragItemIndex.current = null;
    setDragOverIndex(null);
  }, []);

  const handleMoveUp = useCallback(
    (index: number, isPointerEvent: boolean) => {
      if (index === 0) return;
      setImages((prev) => {
        const newImages = [...prev];
        [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
        return newImages;
      });
      if (isPointerEvent) {
        setFocusTargetIndex(index);
      }
    },
    [setImages]
  );

  const handleMoveDown = useCallback(
    (index: number, isPointerEvent: boolean) => {
      setImages((prev) => {
        if (index >= prev.length - 1) return prev;
        const newImages = [...prev];
        [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
        return newImages;
      });
      if (isPointerEvent) {
        setFocusTargetIndex(index);
      }
    },
    [setImages]
  );

  if (isLitter) return <></>;
  return (
    <>
      <section
        ref={sectionRef}
        className="flex flex-col flex-wrap gap-4 items-center justify-center"
      >
        {images.length > 0 &&
          images.map((img, index) => (
            <div
              key={img.imgId}
              data-image-index={index}
              draggable
              className={`group relative flex items-center cursor-grab active:cursor-grabbing transition-opacity ${
                dragOverIndex === index ? 'opacity-50' : ''
              }`}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleImageDelete(img.imgId);
                }}
                className="bg-white rounded-full w-8 h-8 absolute top-1 right-1 shadow z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
              >
                <XIcon size="sm" />
              </button>
              <div className="absolute left-1 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                {index > 0 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleMoveUp(index, e.detail !== 0);
                    }}
                    className="bg-white rounded-full w-8 h-8 shadow flex items-center justify-center"
                  >
                    <CaretUpIcon size="md" />
                  </button>
                )}
                {index < images.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleMoveDown(index, e.detail !== 0);
                    }}
                    className="bg-white rounded-full w-8 h-8 shadow flex items-center justify-center"
                  >
                    <CaretDownIcon size="md" />
                  </button>
                )}
              </div>
              <img
                src={img.imgUrl}
                alt={img.imgAlt}
                className="w-40 h-40 object-cover rounded mb-2 pointer-events-none"
                draggable={false}
              />
              {/* <span className="text-sm text-gray-500">{img.imgId}</span> */}
            </div>
          ))}
      </section>
      {formErrors.images && (
        <div className="bg-red-500 text-white text-sm rounded px-2">{imagesErrorMessage}</div>
      )}
      {images.length < 5 && (
        <UploadImages
          onImagesAdd={(newImages) => {
            setImages((prev) => [...prev, ...newImages]);
          }}
        />
      )}
    </>
  );
}
