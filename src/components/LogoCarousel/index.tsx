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
 * Dual-mode logo display component: infinite scrolling carousel or static centered grid.
 *
 * When `speed` is greater than 0, renders a continuously scrolling horizontal carousel
 * using pure CSS animations. Logos are repeated internally to guarantee the strip always
 * fills the full viewport width, regardless of how few logos are provided.
 * Two animated groups run in parallel so the loop is seamless with no visible gaps.
 *
 * When `speed` is 0, renders a static flex-wrap grid where all logos are centered
 * on screen and wrap naturally to additional rows as needed.
 *
 * Both modes support optional grayscale-on-idle hover effects and clickable logo links.
 * The scrolling mode also pauses on hover and supports reversed scroll direction.
 *
 * @param {LogoCarouselProps} props - Component configuration
 * @param {LogoItem[]} props.logos - Array of logo items to display
 * @param {number} [props.speed=10] - Animation speed multiplier (higher = faster). Use 0 for static grid mode.
 * @param {boolean} [props.grayscale=true] - Apply grayscale filter until hover
 * @param {boolean} [props.reverse=false] - Reverse scroll direction (right to left). Ignored in static mode.
 * @returns {React.ReactElement} The rendered logo display
 *
 * @example
 * // Scrolling carousel (left to right)
 * <LogoCarousel logos={sponsors} speed={15} />
 *
 * @example
 * // Reversed direction for visual contrast
 * <LogoCarousel logos={sponsors} speed={10} reverse={true} />
 *
 * @example
 * // Static centered grid (speed=0)
 * <LogoCarousel logos={sponsors} speed={0} />
 *
 * @example
 * // Without grayscale effect
 * <LogoCarousel logos={sponsors} speed={20} grayscale={false} />
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

  // Static grid mode: speed 0 renders a centered flex-wrap grid instead of scrolling
  if (speed === 0) {
    return (
      <section className="w-full py-6 bg-white/5 backdrop-blur-sm">
        <ul className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 px-6">
          {logos.map((logo, index) => (
            <li key={`${logo.src}-${index}`} className="shrink-0">
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
      </section>
    );
  }

  // Repeat logos until there are at least MIN_VISIBLE items per group so the strip
  // always fills the full viewport width even when very few logos are provided.
  const MIN_VISIBLE = 10;
  const repeatCount = Math.max(1, Math.ceil(MIN_VISIBLE / logos.length));
  const repeatedLogos = Array.from({ length: repeatCount }, () => logos).flat();
  const duration = `${(repeatedLogos.length * 200) / speed}s`;

  const renderGroup = (groupKey: string) => (
    <ul
      key={groupKey}
      className={`flex items-center ${reverse ? styles.carousel_animate_loop_reverse : styles.carousel_animate_loop} shrink-0`}
      style={{ animationPlayState: hovered ? 'paused' : 'running', animationDuration: duration }}
    >
      {repeatedLogos.map((logo, index) => (
        <li key={`${groupKey}-${logo.src}-${index}`} className="ml-6 shrink-0">
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
  );

  return (
    <section
      className="relative w-full overflow-hidden py-6 bg-white/5 backdrop-blur-sm"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex">
        {renderGroup('g1')}
        {renderGroup('g2')}
      </div>
    </section>
  );
}
