'use client';
import SmartLink from '@/lib/SmartLink';
import { useState } from 'react';
import styles from './styles.module.css';

/**
 * Represents an individual logo item in the carousel.
 */
interface LogoItem {
  /** Source URL of the logo image */
  src: string;
  /** Alt text for accessibility - describes the logo for screen readers */
  alt?: string;
  /** Optional link URL - if provided, the logo becomes clickable and opens in a new tab */
  href?: string;
}

/**
 * Props for the LogoCarousel component.
 */
interface LogoCarouselProps {
  /** Array of logo items to display in the infinite scrolling carousel */
  logos: LogoItem[];
  /**
   * Animation speed multiplier - higher values result in faster scrolling.
   * The duration is calculated as `(logos.length * 200) / speed` seconds.
   * @default 10
   */
  speed?: number;
  /**
   * Whether to apply grayscale filter to logos until hover for visual consistency.
   * When true, logos appear desaturated and gain color on hover.
   * @default true
   */
  grayscale?: boolean;
  /**
   * Whether to reverse the scrolling direction.
   * @default false
   */
  reverse?: boolean;
}

/**
 * Infinite horizontal logo carousel component with CSS animations.
 *
 * Displays an array of logos in a continuously scrolling carousel using pure CSS
 * animations. Features include hover pause/resume functionality, optional
 * grayscale effects for visual consistency, and reversible scroll direction.
 * The component duplicates logo content to create a seamless infinite loop effect.
 *
 * The carousel uses two identical groups of logos animated in parallel to ensure
 * there are no gaps during the infinite scroll. Each group contains the logos
 * duplicated twice for smooth looping.
 *
 * By default, logos scroll from left to right (→), which follows the natural
 * reading direction. Use the reverse prop to scroll right to left (←) for
 * visual contrast or parallax effects when using multiple carousels.
 *
 * Logos can be static images or clickable links that open in new tabs. All images
 * use lazy loading for optimal performance.
 *
 * @param {LogoCarouselProps} props - Component configuration
 * @param {LogoItem[]} props.logos - Array of logo items to display in the carousel
 * @param {number} [props.speed=10] - Animation speed multiplier (higher = faster scrolling)
 * @param {boolean} [props.grayscale=true] - Apply grayscale filter until hover
 * @param {boolean} [props.reverse=false] - Reverse scroll direction (right to left instead of left to right)
 * @returns {React.ReactElement} The rendered infinite logo carousel
 *
 * @example
 * // Basic usage with sponsor logos (left to right)
 * const sponsors = [
 *   { src: '/logo1.png', alt: 'Sponsor 1' },
 *   { src: '/logo2.png', alt: 'Sponsor 2', href: 'https://sponsor2.com' },
 *   { src: '/logo3.png', alt: 'Sponsor 3', href: 'https://sponsor3.com' }
 * ];
 * <LogoCarousel logos={sponsors} />
 *
 * @example
 * // Fast scrolling without grayscale
 * <LogoCarousel logos={sponsors} speed={20} grayscale={false} />
 *
 * @example
 * // Reversed direction (right to left) for visual contrast
 * <LogoCarousel logos={sponsors} reverse={true} />
 *
 * @example
 * // Slow, elegant scrolling with grayscale effect
 * <LogoCarousel logos={sponsors} speed={5} grayscale={true} />
 */
export default function LogoCarousel({
  logos,
  speed = 10,
  grayscale = true,
  reverse = false,
}: LogoCarouselProps): React.ReactElement {
  const [hovered, setHovered] = useState<boolean>(false);

  const imgClass = grayscale
    ? 'h-20 md:h-24 w-auto grayscale opacity-60 transition duration-300 hover:grayscale-0 hover:opacity-100'
    : 'h-12 md:h-24 w-auto';
  return (
    //carrousel
    <section
      className="relative w-full overflow-hidden py-6 bg-white/5 backdrop-blur-sm"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex">
        {/* //group 1 */}
        <ul
          className={`flex items-center ${reverse ? styles.carousel_animate_loop_reverse : styles.carousel_animate_loop} shrink-0`}
          style={{
            animationPlayState: hovered ? 'paused' : 'running',
            animationDuration: `${(logos.length * 200) / speed}s`,
          }}
        >
          {logos.map((logo, index) => (
            <li key={`${logo.src}-${index}-a`} className="ml-6 shrink-0">
              {logo.href ? (
                <SmartLink href={logo.href} aria-label={logo.alt ?? `Logo ${index}`}>
                  <img src={logo.src} alt={logo.alt ?? ''} className={imgClass} loading="lazy" />
                </SmartLink>
              ) : (
                <img src={logo.src} alt={logo.alt ?? ''} className={imgClass} loading="lazy" />
              )}
            </li>
          ))}
          {logos.map((logo, index) => (
            <li key={`${logo.src}-${index}-b`} className="ml-6 shrink-0">
              {logo.href ? (
                <SmartLink href={logo.href} aria-label={logo.alt ?? `Logo ${index}`}>
                  <img src={logo.src} alt={logo.alt ?? ''} className={imgClass} loading="lazy" />
                </SmartLink>
              ) : (
                <img src={logo.src} alt={logo.alt ?? ''} className={imgClass} loading="lazy" />
              )}
            </li>
          ))}
        </ul>
        {/* //group 2 */}
        <ul
          className={`flex items-center ${reverse ? styles.carousel_animate_loop_reverse : styles.carousel_animate_loop} shrink-0`}
          style={{
            animationPlayState: hovered ? 'paused' : 'running',
            animationDuration: `${(logos.length * 200) / speed}s`,
          }}
        >
          {logos.map((logo, index) => (
            <li key={`${logo.src}-${index}-a`} className="ml-6 shrink-0">
              {logo.href ? (
                <SmartLink href={logo.href} aria-label={logo.alt ?? `Logo ${index}`}>
                  <img src={logo.src} alt={logo.alt ?? ''} className={imgClass} loading="lazy" />
                </SmartLink>
              ) : (
                <img src={logo.src} alt={logo.alt ?? ''} className={imgClass} loading="lazy" />
              )}
            </li>
          ))}
          {logos.map((logo, index) => (
            <li key={`${logo.src}-${index}-b`} className="ml-6 shrink-0">
              {logo.href ? (
                <SmartLink href={logo.href} aria-label={logo.alt ?? `Logo ${index}`}>
                  <img src={logo.src} alt={logo.alt ?? ''} className={imgClass} loading="lazy" />
                </SmartLink>
              ) : (
                <img src={logo.src} alt={logo.alt ?? ''} className={imgClass} loading="lazy" />
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
