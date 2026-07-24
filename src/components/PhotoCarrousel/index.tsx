'use client';

import React from 'react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, XCircleIcon } from '../Icons';

/**
 * Props for individual carousel items.
 */
interface ItemsProps {
  /** URL of the image */
  imgUrl: string;
  /** Alt text for the image */
  imgAlt: string;
  /** Optional unique identifier for the image */
  imgId?: string;
  /** Whether this image comes from a follow-up event */
  isEventImage?: boolean;
}

/**
 * Photo carousel component with fullscreen mode and touch gestures.
 *
 * Displays a collection of images in a carousel format with navigation controls,
 * thumbnail indicators, and fullscreen viewing capability. Supports touch gestures
 * for mobile devices and automatic image transitions. Can be used in both normal
 * and fullscreen modes.
 *
 * @param {Object} props - Component props
 * @param {ItemsProps[]} props.images - Array of image objects to display in the carousel
 * @param {Img[]} [props.eventImages] - Optional event/follow-up images displayed with a badge
 * @returns {React.ReactElement} The rendered photo carousel component
 *
 * @example
 * // Basic usage
 * const images = [
 *   { imgUrl: '/photo1.jpg', imgAlt: 'Primera foto' },
 *   { imgUrl: '/photo2.jpg', imgAlt: 'Segunda foto' },
 *   { imgUrl: '/photo3.jpg', imgAlt: 'Tercera foto', imgId: 'unique-id' }
 * ];
 * <PhotoCarrousel images={images} />
 *
 * @example
 * // With event/follow-up images
 * const eventImages = [
 *   { imgUrl: '/event1.jpg', imgAlt: 'Vacunación' },
 * ];
 * <PhotoCarrousel images={animalImages} eventImages={eventImages} />
 */
export default function PhotoCarrousel({
  images,
  eventImages,
}: {
  images: ItemsProps[];
  eventImages?: ItemsProps[];
}): React.ReactElement {
  const allImages: ItemsProps[] = useMemo(
    () => [...images, ...(eventImages || []).map((ei) => ({ ...ei, isEventImage: true }))],
    [images, eventImages]
  );
  const [carrouselFullSize, setCarrouselFullSize] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [items, setItems] = useState<ItemsProps[]>(allImages);
  const carrouselRef = useRef<HTMLDivElement>(null);
  const initialXRef = useRef<number | null>(null);

  // Update items when images prop changes
  useEffect(() => {
    setItems(allImages);
  }, [allImages]);

  // Handle image navigation (next/previous)
  const handleImg = useCallback(
    (direction: 'next' | 'prev') => {
      setCurrentIndex((prevIndex) => {
        const lastIndex = items.length - 1;
        if (direction === 'next') {
          return prevIndex >= lastIndex ? 0 : prevIndex + 1;
        } else {
          return prevIndex <= 0 ? lastIndex : prevIndex - 1;
        }
      });
    },
    [items]
  );

  // Setup touch gesture handlers for mobile swipe navigation
  useEffect(() => {
    const carrouselElement = carrouselRef.current;

    const handleTouchStart = (event: TouchEvent) => {
      initialXRef.current = event.touches[0].clientX;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const initialX = initialXRef.current;
      if (initialX === null) return;

      const currentX = event.touches[0].clientX;
      const diffX = initialX - currentX;

      // Swipe right to go to next image, swipe left for previous
      if (diffX > 3) handleImg('next');
      else if (diffX < -3) handleImg('prev');

      initialXRef.current = null;
    };

    if (carrouselElement) {
      carrouselElement.addEventListener('touchstart', handleTouchStart);
      carrouselElement.addEventListener('touchmove', handleTouchMove);
    }

    return () => {
      if (carrouselElement) {
        carrouselElement.removeEventListener('touchstart', handleTouchStart);
        carrouselElement.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [handleImg]);

  return (
    <div
      ref={carrouselRef}
      className={`${carrouselFullSize ? 'fixed z-50 top-0 bottom-0 left-0 right-0 bg-cream-light flex felx-col items-center justify-center' : 'w-full h-full aspect-[3/4] relative'}  `}
    >
      {/* Close button */}
      {carrouselFullSize && (
        <button
          onClick={() => setCarrouselFullSize(false)}
          className=" absolute top-2 right-2 z-50 bg-white/60 rounded-full text-black"
        >
          <XCircleIcon size={48} color="black" title="Cerrar" />
        </button>
      )}
      {/* Carousel wrapper */}
      <div className={` relative overflow-hidden rounded-lg  h-full w-full`}>
        {items.map((item, index) => (
          <div
            key={`${item.imgUrl}-image-${index}`}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              currentIndex === index ? 'opacity-100 visible' : 'opacity-0 invisible'
            }`}
          >
            {carrouselFullSize ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                <div
                  className={`relative ${item.isEventImage ? 'outline-4 outline-dashed outline-green-600 -outline-offset-8' : ''}`}
                  style={{ maxWidth: '90vw', maxHeight: '85vh' }}
                >
                  <Image
                    width={1200}
                    height={900}
                    onClick={() => setCarrouselFullSize(true)}
                    src={item.imgUrl}
                    alt={item.imgAlt}
                    className="object-contain max-w-full max-h-[85vh] w-auto h-auto block rounded-lg"
                  />
                  {item.isEventImage && (
                    <span className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
                      Seguimiento (privada)
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Image
                  width={700}
                  height={400}
                  onClick={() => setCarrouselFullSize(true)}
                  src={item.imgUrl}
                  alt={item.imgAlt}
                  className={`object-cover absolute w-full h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 ${item.isEventImage ? 'outline-4 outline-dashed outline-green-600 -outline-offset-8' : ''}`}
                />
                {item.isEventImage && (
                  <span className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
                    Seguimiento (privada)
                  </span>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Slider indicators */}
      <div className="absolute flex space-x-3 -translate-x-1/2 bottom-1 sm:bottom-5 left-1/2 z-20">
        {items.map((_, index) => (
          <button
            key={`indicator-${index}`}
            type="button"
            onClick={() => setCurrentIndex(index)}
            style={{ backgroundImage: `url(${items[index].imgUrl})` }}
            className={`w-8 h-8 sm:w-16 sm:h-16 cursor-pointer bg-center bg-no-repeat bg-cover rounded-2xl ${
              currentIndex === index ? ' border-white border-2' : 'grayscale-100'
            }`}
            aria-current={currentIndex === index}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slider controls */}
      <button
        onClick={() => handleImg('prev')}
        type="button"
        className="absolute top-0 left-0 flex items-center justify-center h-full px-4 z-20"
      >
        <span className="w-10 h-10 rounded-full bg-caramel-deep/30 hover:bg-white/50 flex items-center justify-center">
          <ChevronLeftIcon size={16} className="w-4 h-4 text-caramel-deep" title="Anterior" />
        </span>
      </button>
      <button
        onClick={() => handleImg('next')}
        type="button"
        className="absolute top-0 right-0 flex items-center justify-center h-full px-4 z-20"
      >
        <span className="w-10 h-10 rounded-full bg-caramel-deep/30 hover:bg-white/50 flex items-center justify-center">
          <ChevronRightIcon size={16} className="w-4 h-4 text-caramel-deep" title="Siguiente" />
        </span>
      </button>
    </div>
  );
}
