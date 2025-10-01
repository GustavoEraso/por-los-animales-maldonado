'use client';

import React from 'react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '../Icons';

/**
 * Props for individual carousel items.
 */
type ItemsProps = {
  /** Title of the carousel item */
  title: string;
  /** Description text for the carousel item */
  description: string;
  /** Text to display on the action button */
  buttonText: string;
  /** URL for the action button link */
  buttonUrl: string;
  /** Image configuration for the carousel item */
  image: {
    /** Source URL of the image */
    src: string;
    /** Alt text for the image */
    alt: string;
  };
};

/**
 * Props for the HeroCarrousel component.
 */
interface HeroCarrouselProps {
  /** Array of custom carousel items */
  items?: ItemsProps[];
  /** Whether to replace default items (true) or merge with them (false) */
  replaceDefault?: boolean;
}

/**
 * Hero carousel component with auto-sliding and touch/swipe support.
 *
 * Displays a full-width hero carousel with configurable content items.
 * By default includes adoption, transport, foster care, and donation information.
 * Supports custom items that can either replace or merge with default content.
 * Features automatic slideshow, manual navigation controls, touch/swipe gestures, and pause on hover.
 *
 * @param {HeroCarrouselProps} props - Component props
 * @param {ItemsProps[]} [props.items] - Array of custom carousel items
 * @param {boolean} [props.replaceDefault=false] - Whether to replace default items (true) or merge with them (false)
 * @returns {React.ReactElement} The rendered hero carousel component
 *
 * @example
 * // Basic usage with default items
 * <HeroCarrousel />
 *
 * @example
 * // Add custom items to default ones
 * const customItems = [
 *   {
 *     image: {
 *       src: '/custom-image.webp',
 *       alt: 'Custom image description',
 *     },
 *     title: 'CUSTOM TITLE',
 *     description: 'Custom description text for this carousel item.',
 *     buttonText: 'custom button',
 *     buttonUrl: '/custom-url',
 *   }
 * ];
 * <HeroCarrousel items={customItems} replaceDefault={false} />
 *
 * @example
 * // Replace default items completely
 * const replacementItems = [
 *   {
 *     image: {
 *       src: '/hero-image.webp',
 *       alt: 'Hero image',
 *     },
 *     title: 'NEW HERO',
 *     description: 'This replaces all default content.',
 *     buttonText: 'get started',
 *     buttonUrl: '/get-started',
 *   }
 * ];
 * <HeroCarrousel items={replacementItems} replaceDefault={true} />
 */
export default function HeroCarrousel({
  items: customItems,
  replaceDefault = false,
}: HeroCarrouselProps = {}): React.ReactElement {
  const itemsListS: ItemsProps[] = [
    {
      image: {
        src: '/manada-peluda.webp',
        alt: 'manada de perritos peludos',
      },
      title: 'ADOPTÁ',
      description:
        'Al pensar en adoptar, es crucial tener en cuenta diversos factores para garantizar una convivencia armoniosa.',
      buttonText: 'más información',
      buttonUrl: '/adopta',
    },

    {
      image: {
        src: '/perrito-negro-respaldo.webp',
        alt: 'perrito apollado en respaldo de auto',
      },
      title: 'traslados',
      description: '¿Te gustaría ayudarnos con algún traslado?',
      buttonText: 'más información',
      buttonUrl: '/involucrate#traslados',
    },
    {
      image: {
        src: '/perrito-negro-dormido.webp',
        alt: 'imagen de un perrito negro durmiendo',
      },
      title: 'TRANSITORIOS',
      description:
        '¿No podés adoptar? ¡Quizás podés hacerle un lugarcito hasta que encuentre una familia!',
      buttonText: 'si puedo!',
      buttonUrl: '/involucrate#transitorio',
    },
    {
      image: {
        src: '/perra-con-panuelo-masticando.webp',
        alt: 'imagen de una perra masticando una botella',
      },
      title: 'DONACIONES',
      description:
        'Los aportes económicos de ustedes son nuestro respaldo para continuar haciendo nuestro labor. Son destinados para pagar principalmente atención veterinaria (cirugías, tratamientos, análisis, medicación, honorarios), y también para comprar insumos y alimento para nuestros rescatados. ',
      buttonText: 'ver opciones',
      buttonUrl: '/donaciones',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Determine final items array based on props
  const finalItems = React.useMemo(() => {
    if (!customItems || customItems.length === 0) {
      return itemsListS;
    }
    return replaceDefault ? customItems : [...itemsListS, ...customItems];
  }, [customItems, replaceDefault]);

  const [items] = useState<ItemsProps[]>(finalItems);
  const carrouselRef = useRef<HTMLDivElement>(null);
  const intervalIdRef = useRef<number | null>(null);
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
    [items]
  );

  // Interval helpers
  const clearIntervalIfNeeded = () => {
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  const startInterval = () => {
    clearIntervalIfNeeded();
    intervalIdRef.current = window.setInterval(() => {
      handleImg('next');
    }, 10000);
  };

  // Auto slide + mouse hover pause/resume
  useEffect(() => {
    startInterval();

    const carrouselElement = carrouselRef.current;
    const handleMouseEnter = () => clearIntervalIfNeeded();
    const handleMouseLeave = () => startInterval();

    if (carrouselElement) {
      carrouselElement.addEventListener('mouseenter', handleMouseEnter);
      carrouselElement.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      clearIntervalIfNeeded();
      if (carrouselElement) {
        carrouselElement.removeEventListener('mouseenter', handleMouseEnter);
        carrouselElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [handleImg]);

  // Swipe gestures
  useEffect(() => {
    const carrouselElement = carrouselRef.current;

    const handleTouchStart = (event: TouchEvent) => {
      initialXRef.current = event.touches[0].clientX;
      clearIntervalIfNeeded();
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
    <div ref={carrouselRef} className="relative w-full ">
      {/* Carousel wrapper */}
      <div className="relative overflow-hidden rounded-lg h-[80svh]  w-full">
        {items.map((item, index) => (
          <div
            key={`${item.image.src}-image-${index}`}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              currentIndex === index ? 'opacity-100 visible' : 'opacity-0 invisible'
            }`}
          >
            <Image
              width={700}
              height={400}
              src={item.image.src}
              alt={item.image.alt}
              className="absolute w-full h-full object-cover -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
            />

            <section
              className={`${index == currentIndex && 'animate-wiggle'} w-full h-full md:h-3/4 z-10 flex flex-col justify-end items-center  absolute bottom-0 pb-8 left-1/2 -translate-x-1/2 text-black bg-gradient-to-t from-white to-zinc-900/0 p-4 rounded-lg`}
            >
              <section className="flex flex-col gap-4 w-full h-2/3 justify-end pb-10 max-w-4xl xl:pr-60 text-green-dark ">
                <h3 className="text-5xl font-extrabold self-start uppercase ">{item.title}</h3>
                <p className="text-2xl text-left font-bold">{item.description}</p>

                <Link
                  href={item.buttonUrl}
                  className="self-start z-10 text-2xl uppercase bg-caramel-deep text-white px-8 py-2 rounded-full hover:bg-caramel-deep/80 transition-colors duration-300"
                >
                  {item.buttonText}
                </Link>
              </section>
            </section>
          </div>
        ))}
      </div>

      {/* Slider indicators */}
      <div className="absolute flex space-x-3 -translate-x-1/2 bottom-5 left-1/2 z-20">
        {items.map((_, index) => (
          <button
            key={`indicator-${index}`}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={`w-4 h-4  rounded-full ${
              currentIndex === index
                ? 'bg-caramel-deep'
                : 'bg-white border border-caramel-deep hover:bg-caramel-deep/30'
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
