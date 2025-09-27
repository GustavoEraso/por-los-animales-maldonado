'use client';

import React from 'react';
import { useLayoutEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap/dist/gsap';

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
 * Animated logo carousel component with seamless infinite horizontal scrolling.
 *
 * Displays an array of logos in a continuously scrolling carousel with smooth
 * GSAP animations. Features include hover pause/resume functionality, optional
 * grayscale effects for visual consistency, and automatic content duplication
 * to ensure a seamless infinite loop without visual jumps. Uses optimized GSAP
 * animations and mathematical modifiers for performance.
 *
 * The component automatically calculates the required number of logo copies
 * based on viewport width to ensure smooth infinite scrolling. Logos can be
 * clickable links or static images, and support lazy loading for performance.
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
  const track = useRef<HTMLUListElement | null>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const [copies, setCopies] = useState(3); // Start with 3 copies for better overlap
  const [isInitialized, setIsInitialized] = useState(false);

  // A. Calculate required copies (run once after mount)
  useLayoutEffect(() => {
    const parent = root.current;
    const t = track.current;
    if (!parent || !t || isInitialized) return;

    // Wait for next frame to ensure elements are properly sized
    const timer = setTimeout(() => {
      const originalWidth = t.scrollWidth / copies; // Width of one set of logos
      if (originalWidth > 0) {
        // Calculate optimal copies: viewport width + 2 extra sets for buffer
        const viewportMultiplier = Math.ceil(parent.offsetWidth / originalWidth);
        const needed = Math.max(3, viewportMultiplier + 2); // Minimum 3, max reasonable number

        if (needed !== copies && needed <= 10) {
          // Cap at 10 copies max
          setCopies(needed);
        }
        setIsInitialized(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [logos, copies, isInitialized]);

  // B. Create/update animation (only when initialized) - Seamless infinite loop
  useLayoutEffect(() => {
    const t = track.current;
    if (!t || !isInitialized) return;

    // Kill existing animation
    tween.current?.kill();

    const singleSetWidth = t.scrollWidth / copies;
    if (singleSetWidth <= 0) return; // Prevent invalid animation

    const dur = singleSetWidth / speed;

    // Set starting position
    gsap.set(t, { x: 0 });

    // Create seamless infinite animation
    tween.current = gsap.to(t, {
      x: -singleSetWidth,
      ease: 'none',
      duration: dur,
      repeat: -1,
      onRepeat: () => {
        // Reset to starting position without visual jump
        gsap.set(t, { x: 0 });
      },
    });

    return () => {
      tween.current?.kill();
    };
  }, [copies, speed, isInitialized]);

  // C. Hover controls with safety checks
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

  // D. Generate duplicated list
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
      <ul ref={track} className="flex gap-12 whitespace-nowrap" style={{ willChange: 'transform' }}>
        {full.map((logo, idx) => (
          <li key={`${logo.src}-${idx}`} className="shrink-0">
            {logo.href ? (
              <a
                href={logo.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={logo.alt ?? `Logo ${idx}`}
              >
                <img src={logo.src} alt={logo.alt ?? ''} className={imgClass} loading="lazy" />
              </a>
            ) : (
              <img src={logo.src} alt={logo.alt ?? ''} className={imgClass} loading="lazy" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
