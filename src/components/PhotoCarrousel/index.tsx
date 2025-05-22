'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SVGProps } from 'react';

function XCircleIcon(props: SVGProps<SVGSVGElement>): React.ReactNode {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="black" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

interface ItemsProps {
  imgUrl: string;
  imgAlt: string;
  imgId?: string,
};

export default function PhotoCarrousel({ images }: { images: ItemsProps[] }) {

  const [carrouselFullSize, setCarrouselFullSize] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [items] = useState<ItemsProps[]>(images);
  const carrouselRef = useRef<HTMLDivElement>(null);
  const initialXRef = useRef<number | null>(null);


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
    [items],
  );





  // Swipe gestures
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
    <div ref={carrouselRef} className={`${carrouselFullSize ? 'fixed z-50 top-0 bottom-0 left-0 right-0 bg-cream-light flex felx-col items-center justify-center' : 'w-full relative'}  `}>
      {/* Close button */}
      {carrouselFullSize && <button onClick={() => setCarrouselFullSize(false)} className=" absolute top-2 right-2 z-50 bg-white/60 rounded-full text-black">
        <XCircleIcon className="h-12 w-12 text-black" />
      </button>}
      {/* Carousel wrapper */}
      <div className={`${carrouselFullSize ? 'h-full' : 'aspect-video'} relative overflow-hidden rounded-lg   w-full`}>
        {items.map((item, index) => (
          <div
            key={`${item.imgUrl}-image-${index}`}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentIndex === index ? 'opacity-100 visible' : 'opacity-0 invisible'
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
            className={`w-8 h-8 sm:w-16 sm:h-16 cursor-pointer bg-center bg-no-repeat bg-cover rounded-2xl ${currentIndex === index ? ' border-white border-2' : 'grayscale-100'
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
            <path d="M5 1 1 5l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
            <path d="m1 9 4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
    </div>
  );
}
