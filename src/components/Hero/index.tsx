'use client';
import React from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

/**
 * Props for the Hero component.
 */
interface Props {
  /** URL of the hero image */
  imgURL?: string;
  /** Alt text for the hero image */
  imgAlt?: string;
  /** Title to display on the hero section */
  title?: string;
}

/**
 * Hero section component with customizable image and title.
 *
 * Displays a full-width hero section with background image and overlaid title.
 * If no title is provided, uses the current page path as the title.
 * Features responsive design with gradient overlay for better text readability.
 *
 * @param {Props} props - Component props
 * @param {string} [props.imgURL] - URL of the hero image (defaults to "/heroImg.webp")
 * @param {string} [props.imgAlt] - Alt text for the hero image (defaults to "Hero image")
 * @param {string} [props.title] - Title to display (defaults to current pathname)
 * @returns {React.ReactElement} The rendered hero section component
 *
 * @example
 * // Basic usage with defaults
 * <Hero />
 *
 * @example
 * // With custom image and title
 * <Hero
 *   imgURL="/custom-hero.jpg"
 *   imgAlt="Custom hero image"
 *   title="Welcome"
 * />
 */
export default function Hero({ imgURL, imgAlt, title }: Props): React.ReactElement {
  const pathName = usePathname().split('/').filter(Boolean).pop();

  const imageSrc = imgURL ?? '/heroImg.webp';
  const imageAlt = imgAlt ?? 'Hero image';
  const displayTitle = title ?? pathName;

  return (
    <section className="flex justify-center  w-full h-[60svh]  overflow-hidden relative  ">
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={700}
        height={400}
        className="absolute w-full h-full object-cover -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
      />
      <section
        className={
          'animate-wiggle w-full h-3/4 z-10 flex flex-col justify-end items-center  absolute bottom-0 pb-8 left-1/2 -translate-x-1/2 text-green-dark bg-gradient-to-t from-white to-zinc-900/0 p-4 '
        }
      >
        <section className="flex flex-col gap-4 w-full h-2/3 justify-end max-w-4xl xl:pr-60 ">
          <h3 className="text-5xl lg:text-8xl font-extrabold text-green-dark self-start uppercase ">
            {displayTitle}
          </h3>
        </section>
      </section>
    </section>
  );
}
