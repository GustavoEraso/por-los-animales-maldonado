'use client';
import React from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import ShareButton from '@/elements/ShareButton';
import { ShareIcon } from '@/components/Icons';

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
  /** Enables share action next to title */
  enableShare?: boolean;
  /** Custom URL to share when share action is enabled */
  shareUrl?: string;
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
 * @param {boolean} [props.enableShare=false] - Enables the share button next to the title
 * @param {string} [props.shareUrl] - Custom URL to share (defaults to current page URL when omitted)
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
 *
 * @example
 * // With share button and a custom URL
 * <Hero
 *   imgURL="/animals/luna.webp"
 *   imgAlt="Luna in foster care"
 *   title="Luna"
 *   enableShare
 *   shareUrl="https://porlosanimalesmaldonado.org/adopta/luna"
 * />
 */
export default function Hero({
  imgURL,
  imgAlt,
  title,
  enableShare = false,
  shareUrl,
}: Props): React.ReactElement {
  const pathName = usePathname().split('/').filter(Boolean).pop();

  const imageSrc = imgURL ?? '/heroImg.webp';
  const imageAlt = imgAlt ?? 'Hero image';
  const displayTitle = title ?? pathName;
  const shareTargetName = displayTitle ?? 'este perfil';

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
          <div className="flex items-end gap-2 lg:gap-4 self-start">
            <h3 className="text-5xl lg:text-8xl font-extrabold text-green-dark uppercase ">
              {displayTitle}
            </h3>
            {enableShare && (
              <ShareButton
                animate={false}
                className="mb-2 lg:mb-3 w-fit rounded-full p-2 lg:p-3 ease-in-out  inline-flex items-center justify-center border border-amber-sunset bg-gradient-to-b from-amber-sunset to-caramel-deep px-8 py-2 text-lg font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                shareTitle={`Conoce a ${shareTargetName}`}
                shareText={`Ayudanos a que ${shareTargetName} encuentre una familia.`}
                urlToShare={shareUrl}
                aria-label={`Compartir perfil de ${shareTargetName}`}
              >
                <span className="block lg:hidden p-0" aria-hidden="true">
                  <ShareIcon size="sm" title={`Compartir perfil de ${shareTargetName}`} />
                </span>
                <span className="hidden lg:block  p-0" aria-hidden="true">
                  <ShareIcon size="xl" title={`Compartir perfil de ${shareTargetName}`} />
                </span>
              </ShareButton>
            )}
          </div>
        </section>
      </section>
    </section>
  );
}
