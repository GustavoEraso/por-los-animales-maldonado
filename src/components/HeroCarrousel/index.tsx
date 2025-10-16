'use client';

import React from 'react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ChevronLeftIcon, ChevronRightIcon } from '../Icons';
import { BannerType } from '@/types';
import SmartLink from '@/lib/SmartLink';

const INITIAL_ITEMS: BannerType[] = [
  {
    id: '1',
    image: {
      imgId: 'default-1',
      imgUrl: '/manada-peluda.webp',
      imgAlt: 'manada de perritos peludos',
    },
    showTitle: true,
    title: 'ADOPTÁ',
    showDescription: true,
    description:
      'Al pensar en adoptar, es crucial tener en cuenta diversos factores para garantizar una convivencia armoniosa.',
    showButton: true,
    buttonText: 'más información',
    buttonUrl: '/adopta',
  },

  {
    id: '2',
    image: {
      imgId: 'default-2',
      imgUrl: '/perrito-negro-respaldo.webp',
      imgAlt: 'perrito apollado en respaldo de auto',
    },
    showTitle: true,
    title: 'traslados',
    showDescription: true,
    description: '¿Te gustaría ayudarnos con algún traslado?',
    showButton: true,
    buttonText: 'más información',
    buttonUrl: '/involucrate#traslados',
  },
  {
    id: '3',
    image: {
      imgId: 'default-3',
      imgUrl: '/perrito-negro-dormido.webp',
      imgAlt: 'imagen de un perrito negro durmiendo',
    },
    showTitle: true,
    title: 'TRANSITORIOS',
    showDescription: true,
    description:
      '¿No podés adoptar? ¡Quizás podés hacerle un lugarcito hasta que encuentre una familia!',
    showButton: true,
    buttonText: 'si puedo!',
    buttonUrl: '/involucrate#transitorio',
  },
  {
    id: '4',
    image: {
      imgId: 'default-4',
      imgUrl: '/perra-con-panuelo-masticando.webp',
      imgAlt: 'imagen de una perra masticando una botella',
    },
    showTitle: true,
    title: 'DONACIONES',
    showDescription: true,
    description:
      'Los aportes económicos de ustedes son nuestro respaldo para continuar haciendo nuestro labor. Son destinados para pagar principalmente atención veterinaria (cirugías, tratamientos, análisis, medicación, honorarios), y también para comprar insumos y alimento para nuestros rescatados. ',
    showButton: true,
    buttonText: 'ver opciones',
    buttonUrl: '/donaciones',
  },
];

/**
 * Props for the HeroCarrousel component.
 */
interface HeroCarrouselProps {
  /** Array of custom carousel items */
  items?: BannerType[];
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
 * @param {BannerType[]} [props.items] - Array of custom carousel items
 * @param {boolean} [props.replaceDefault=false] - Whether to replace default items (true) or merge with them (false)
 * @returns {React.ReactElement} The rendered hero carousel component
 *
 * @example
 * // Basic usage with default items fetched from API
 * <HeroCarrousel />
 *
 * @example
 * // Add custom items to default ones
 * const customItems = [
 *   {
 *     id: 'custom-1',
 *     image: {
 *       imgId: 'custom-banner-1',
 *       imgUrl: '/custom-image.webp',
 *       imgAlt: 'Custom image description',
 *     },
 *     showTitle: true,
 *     title: 'CUSTOM TITLE',
 *     showDescription: true,
 *     description: 'Custom description text for this carousel item.',
 *     showButton: true,
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
 *     id: 'hero-1',
 *     image: {
 *       imgId: 'hero-banner-1',
 *       imgUrl: '/hero-image.webp',
 *       imgAlt: 'Hero image',
 *     },
 *     showTitle: true,
 *     title: 'NEW HERO',
 *     showDescription: true,
 *     description: 'This replaces all default content.',
 *     showButton: true,
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
  const [banners, setBanners] = useState<BannerType[]>(INITIAL_ITEMS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    console.log('Banners state updated:', banners);
  }, [banners]);

  useEffect(() => {
    async function fetchBanners() {
      console.log('Fetching banners from API...');
      try {
        const response = await fetch('/api/banners');
        if (response.ok) {
          const data: BannerType[] = await response.json();
          if (data && data.length > 0) {
            setBanners(data);
            console.log('Banners fetched successfully:', data);
          }
        } else {
          console.error('Failed to fetch banners:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching banners:', error);
      }
    }

    if (!customItems || !replaceDefault) fetchBanners();
  }, []);

  // Determine final items array based on props
  const items = React.useMemo(() => {
    if (!customItems || customItems.length === 0) {
      return banners;
    }
    return replaceDefault ? customItems : [...banners, ...customItems];
  }, [customItems, replaceDefault, banners]);

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
      {/* <div className="relative overflow-hidden rounded-lg h-[80svh]  w-full"> */}
      <div className="relative overflow-hidden rounded-lg aspect-[21/9]  w-full">
        {items.map((item, index) => (
          <div
            key={`${item.image.imgId}-image-${index}`}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              currentIndex === index ? 'opacity-100 visible' : 'opacity-0 invisible'
            }`}
          >
            <Image
              width={700}
              height={400}
              src={item.image.imgUrl}
              alt={item.image.imgAlt}
              className="absolute w-full h-full object-cover -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
            />

            {(item.showTitle || item.showDescription || item.showButton) && (
              <section
                className={`${index == currentIndex && 'animate-wiggle'} w-full h-full md:h-3/4 z-10 flex flex-col justify-end items-center  absolute bottom-0 lg:pb-8 left-1/2 -translate-x-1/2 text-black  p-4 rounded-lg`}
              >
                <section className="flex flex-col gap-2 lg:gap-4 w-full h-2/3 justify-end p-2 lg:pb-10 max-w-4xl xl:pr-60 text-cream-light text-shadow-xs  text-shadow-black">
                  {item.showTitle && item.title && (
                    <h3 className="text-xl lg:text-5xl font-bold lg:font-extrabold self-start uppercase ">
                      {item.title}
                    </h3>
                  )}
                  {item.showDescription && item.description && (
                    <p className="text-sm lg:text-2xl text-left font-bold">{item.description}</p>
                  )}

                  {item.showButton && (
                    <SmartLink
                      href={item?.buttonUrl || '#'}
                      className="self-start z-10 text-sm lg:text-2xl text-shadow-none font-bold bg-caramel-deep text-white px-4 py-1 lg:px-8 lg:py-2 rounded-full hover:bg-caramel-deep/80 transition-colors duration-300"
                    >
                      {item.buttonText || 'más información'}
                    </SmartLink>
                  )}
                </section>
              </section>
            )}
          </div>
        ))}
      </div>

      {/* Slider indicators */}
      <div className="hidden absolute sm:flex space-x-3 -translate-x-1/2 bottom-5 left-1/2 z-20">
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
