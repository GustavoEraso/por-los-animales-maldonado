'use client';

import React from 'react';
import { useLayoutEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import SmartLink from '@/lib/SmartLink';

/**
 * Props for individual logo items in the carousel.
 */
interface LogoItem {
  /** Source URL of the logo image */
  src: string;
  /** Alt text for accessibility - describes the logo */
  alt?: string;
  /** Optional link URL for the logo - opens in new tab if provided */
  href?: string;
}

/**
 * Props for the LogoCarousel component.
 */
interface LogoCarouselProps {
  /** Array of logo items to display in the carousel */
  logos: LogoItem[];
  /**
   * Animation speed in pixels per second
   * @default 120
   */
  speed?: number;
  /**
   * Whether to apply grayscale effect until hover for visual consistency
   * @default true
   */
  grayscale?: boolean;
}

/**
 * Creates a seamless horizontal loop animation for logo items.
 * Based on GSAP's horizontalLoop helper function.
 *
 * @param {HTMLElement[]} items - Array of HTML elements to animate
 * @param {Object} config - Configuration options
 * @param {number} [config.speed=1] - Speed multiplier for animation (pixels per second / 100)
 * @param {number} [config.paddingRight=0] - Padding between items in pixels
 * @returns {gsap.core.Timeline} GSAP timeline with infinite loop animation
 */
function horizontalLoop(
  items: HTMLElement[],
  config: { speed?: number; paddingRight?: number }
): gsap.core.Timeline {
  config = config || {};
  const tl = gsap.timeline({
    repeat: -1,
    defaults: { ease: 'none' },
    onReverseComplete: () => {
      tl.totalTime(tl.rawTime() + tl.duration() * 100);
    },
  });

  const length = items.length;
  const startX = items[0].offsetLeft;
  const times: number[] = [];
  const widths: number[] = [];
  const xPercents: number[] = [];
  const pixelsPerSecond = (config.speed || 1) * 100;
  const snap = gsap.utils.snap(1);

  // Convert "x" to "xPercent" to make things responsive
  gsap.set(items, {
    xPercent: (i, el) => {
      const w = (widths[i] = parseFloat(gsap.getProperty(el, 'width', 'px') as string));
      xPercents[i] = snap(
        (parseFloat(gsap.getProperty(el, 'x', 'px') as string) / w) * 100 +
          (gsap.getProperty(el, 'xPercent') as number)
      );
      return xPercents[i];
    },
  });

  gsap.set(items, { x: 0 });

  const totalWidth =
    items[length - 1].offsetLeft +
    (xPercents[length - 1] / 100) * widths[length - 1] -
    startX +
    items[length - 1].offsetWidth * (gsap.getProperty(items[length - 1], 'scaleX') as number) +
    (parseFloat(String(config.paddingRight)) || 0);

  for (let i = 0; i < length; i++) {
    const item = items[i];
    const curX = (xPercents[i] / 100) * widths[i];
    const distanceToStart = item.offsetLeft + curX - startX;
    const distanceToLoop =
      distanceToStart + widths[i] * (gsap.getProperty(item, 'scaleX') as number);

    tl.to(
      item,
      {
        xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100),
        duration: distanceToLoop / pixelsPerSecond,
      },
      0
    )
      .fromTo(
        item,
        { xPercent: snap(((curX - distanceToLoop + totalWidth) / widths[i]) * 100) },
        {
          xPercent: xPercents[i],
          duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
          immediateRender: false,
        },
        distanceToLoop / pixelsPerSecond
      )
      .add('label' + i, distanceToStart / pixelsPerSecond);
    times[i] = distanceToStart / pixelsPerSecond;
  }

  tl.progress(1, true).progress(0, true); // pre-render for performance
  return tl;
}

/**
 * Animated logo carousel component with seamless infinite horizontal scrolling.
 *
 * Displays an array of logos in a continuously scrolling carousel with smooth
 * GSAP animations using the horizontalLoop helper. Features include hover pause/resume
 * functionality, optional grayscale effects for visual consistency, and automatic
 * content duplication to ensure a seamless infinite loop without visual jumps.
 *
 * Uses xPercent-based positioning for responsive animations that adapt to window
 * resizing. Logos can be clickable links or static images, and support lazy loading
 * for performance.
 *
 * @param {LogoCarouselProps} props - Component configuration props
 * @param {LogoItem[]} props.logos - Array of logo items to display in the carousel
 * @param {number} [props.speed=120] - Animation speed in pixels per second (higher = faster)
 * @param {boolean} [props.grayscale=true] - Apply grayscale filter until hover for consistency
 * @returns {React.ReactElement} The rendered infinite logo carousel component
 *
 * @example
 * // Basic usage with company logos
 * const companyLogos = [
 *   { src: '/logo1.png', alt: 'Company 1' },
 *   { src: '/logo2.png', alt: 'Company 2', href: 'https://company2.com' },
 *   { src: '/logo3.png', alt: 'Company 3', href: 'https://company3.com' }
 * ];
 * <LogoCarousel logos={companyLogos} />
 *
 * @example
 * // Custom speed and no grayscale effect
 * <LogoCarousel logos={companyLogos} speed={200} grayscale={false} />
 *
 * @example
 * // Slow animation with grayscale effect
 * <LogoCarousel logos={companyLogos} speed={60} grayscale={true} />
 */
export default function LogoCarousel({
  logos,
  speed = 120,
  grayscale = true,
}: LogoCarouselProps): React.ReactElement {
  const root = useRef<HTMLDivElement | null>(null);
  const tween = useRef<gsap.core.Timeline | null>(null);

  // Initialize animation with horizontalLoop
  useLayoutEffect(() => {
    const container = root.current;
    if (!container) return;

    // Get all logo items
    const items = gsap.utils.toArray<HTMLElement>('.logo-item');
    if (items.length === 0) return;

    // Kill existing animation
    tween.current?.kill();

    // Create new horizontal loop animation
    tween.current = horizontalLoop(items, {
      speed: speed / 100, // Convert to pixels per second factor
      paddingRight: 48, // Gap between items (12 * 4 = 48px for gap-12)
    });

    return () => {
      tween.current?.kill();
    };
  }, [logos, speed]);

  // Hover controls
  const pause = useCallback(() => {
    if (tween.current && !tween.current.paused()) {
      tween.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (tween.current && tween.current.paused()) {
      tween.current.resume();
    }
  }, []);

  // Duplicate logos for seamless loop (3 copies minimum)
  const copies = 3;
  const full = Array.from({ length: copies }, () => logos).flat();

  const imgClass = grayscale
    ? 'h-12 md:h-24 w-auto grayscale opacity-60 transition duration-300 hover:grayscale-0 hover:opacity-100'
    : 'h-12 md:h-24 w-auto';

  return (
    <div
      ref={root}
      onMouseEnter={pause}
      onMouseLeave={resume}
      className="relative w-full overflow-hidden py-6 bg-white/5 backdrop-blur-sm"
    >
      <ul className="flex gap-12 whitespace-nowrap" style={{ willChange: 'transform' }}>
        {full.map((logo, idx) => (
          <li key={`${logo.src}-${idx}`} className="logo-item shrink-0">
            {logo.href ? (
              <SmartLink href={logo.href} aria-label={logo.alt ?? `Logo ${idx}`}>
                <img src={logo.src} alt={logo.alt ?? ''} className={imgClass} loading="lazy" />
              </SmartLink>
            ) : (
              <img src={logo.src} alt={logo.alt ?? ''} className={imgClass} loading="lazy" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
