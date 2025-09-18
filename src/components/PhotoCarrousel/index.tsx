'use client';

import React from 'react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SVGProps } from 'react';

/**
 * X Circle icon component for closing the fullscreen carousel.
 *
 * @param {SVGProps<SVGSVGElement>} props - SVG element props
 * @returns {React.ReactNode} The rendered X circle icon
 */
function XCircleIcon(props: SVGProps<SVGSVGElement>): React.ReactNode {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="black"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

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
 * // With animal photos
 * const animalPhotos = [
 *   { imgUrl: '/perro1.jpg', imgAlt: 'Perro jugando en el parque' },
 *   { imgUrl: '/gato1.jpg', imgAlt: 'Gato durmiendo' }
 * ];
 * <PhotoCarrousel images={animalPhotos} />
 */
export default function PhotoCarrousel({ images }: { images: ItemsProps[] }): React.ReactElement {
  const [carrouselFullSize, setCarrouselFullSize] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [items, setItems] = useState<ItemsProps[]>(images);
  const carrouselRef = useRef<HTMLDivElement>(null);
  const initialXRef = useRef<number | null>(null);

  // Update items when images prop changes
  useEffect(() => {
    setItems(images);
  }, [images]);

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
          <XCircleIcon className="h-12 w-12 text-black" />
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
            <Image
              width={700}
              height={400}
              onClick={() => setCarrouselFullSize(true)}
              src={item.imgUrl}
              alt={item.imgAlt}
              className={` ${carrouselFullSize ? 'object-contain' : 'object-cover'} absolute w-full h-full  -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2`}
            />
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
          <svg className="w-4 h-4 text-caramel-deep" viewBox="0 0 6 10" fill="none">
            <path
              d="M5 1 1 5l4 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      <button
        onClick={() => handleImg('next')}
        type="button"
        className="absolute top-0 right-0 flex items-center justify-center h-full px-4 z-20"
      >
        <span className="w-10 h-10 rounded-full bg-caramel-deep/30 hover:bg-white/50 flex items-center justify-center">
          <svg className="w-4 h-4 text-caramel-deep" viewBox="0 0 6 10" fill="none">
            <path
              d="m1 9 4-4-4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
    </div>
  );
}
