'use client';

import React from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap/dist/gsap';

/**
 * Props for individual logo items.
 */
interface LogoItem {
  /** Source URL of the logo image */
  src: string;
  /** Alt text for the logo image */
  alt?: string;
  /** Optional link URL for the logo */
  href?: string;
}

/**
 * Props for the LogoCarousel component.
 */
interface LogoCarouselProps {
  /** Array of logo items to display */
  logos: LogoItem[];
  /** Animation speed in pixels per second */
  speed?: number;
  /** Whether to apply grayscale effect until hover */
  grayscale?: boolean;
}

/**
 * Animated logo carousel component with infinite horizontal scrolling.
 *
 * Displays an array of logos in a continuously scrolling carousel with smooth
 * GSAP animations. Features hover pause/resume, optional grayscale effects,
 * and automatic duplication to ensure seamless infinite loop. Uses optimized GSAP
 * imports for better performance.
 *
 * @param {LogoCarouselProps} props - Component props
 * @param {LogoItem[]} props.logos - Array of logo items to display
 * @param {number} [props.speed=120] - Animation speed in pixels per second
 * @param {boolean} [props.grayscale=true] - Whether to apply grayscale effect until hover
 * @returns {React.ReactElement} The rendered logo carousel component
 *
 * @example
 * // Basic usage
 * const logos = [
 *   { src: '/logo1.png', alt: 'Company 1' },
 *   { src: '/logo2.png', alt: 'Company 2', href: 'https://company2.com' },
 * ];
 * <LogoCarousel logos={logos} />
 *
 * @example
 * // With custom speed and no grayscale
 * <LogoCarousel logos={logos} speed={200} grayscale={false} />
 */
export default function LogoCarousel({
  logos,
  speed = 120,
  grayscale = true,
}: LogoCarouselProps): React.ReactElement {
  const root   = useRef<HTMLDivElement | null>(null);
  const track  = useRef<HTMLUListElement | null>(null);
  const tween  = useRef<gsap.core.Tween | null>(null); // Save tween reference
  const [copies, setCopies] = useState(2);

  // A. Adjusts how many copies are needed to cover 2× the width
  useLayoutEffect(() => {
    const parent = root.current;
    const t      = track.current;
    if (!parent || !t) return;

    const setWidth = t.scrollWidth / copies;
    const needed   = Math.ceil((parent.offsetWidth * 2) / setWidth);

    if (needed > copies) setCopies(needed);
  }, [logos, copies]);

  // B. Creates / updates the animation
  useLayoutEffect(() => {
    const t = track.current;
    if (!t) return;

    const dist = t.scrollWidth / copies;
    const dur  = dist / speed;

    tween.current = gsap.to(t, {
      x: -dist,
      ease: 'none',
      duration: dur,
        modifiers: {
            x: gsap.utils.unitize(x => parseFloat(x) % -dist ),
        },
      repeat: -1,
    });

    // Cleanup → Does NOT return Tween
    return () => {
      tween.current?.kill();
    };
  }, [copies, speed, logos]);

  // C. Hover pauses / resumes
  const pause  = () => tween.current?.pause();
  const resume = () => tween.current?.resume();

  // D. Complete duplicated list
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
      <ul
        ref={track}
        className="flex gap-12 whitespace-nowrap"
        style={{ willChange: 'transform' }}
      >
        {full.map((logo, idx) => (
          <li key={idx} className="shrink-0">
            {logo.href ? (
              <a
                href={logo.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={logo.alt ?? `Logo ${idx}`}
              >
                <img src={logo.src} alt={logo.alt ?? ''} className={imgClass} />
              </a>
            ) : (
              <img src={logo.src} alt={logo.alt ?? ''} className={imgClass} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
