'use client';
import React from 'react'; 
import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Props for the CircleCard component.
 */
interface CircleCardProps {
  /** URL of the image to display */
  imgUrl: string;
  /** Alt text for the image */
  imgAlt: string;
  /** URL for the link destination */
  linkUrl: string;
  /** Text to display on the link button */
  linkText: string;
  /** Whether to use inverted color scheme for the button */
  invert?: boolean;
}

/**
 * Animated circular card component with image and action button.
 *
 * Features scroll-triggered animations, hover effects, and responsive behavior.
 * Uses GSAP for animations and supports reduced motion preferences.
 *
 * @param {CircleCardProps} props - Component props
 * @param {string} props.imgUrl - URL of the image to display
 * @param {string} props.imgAlt - Alt text for the image
 * @param {string} props.linkUrl - URL for the link destination
 * @param {string} props.linkText - Text to display on the link button
 * @param {boolean} [props.invert] - Whether to use inverted color scheme for the button
 * @returns {React.ReactElement} The rendered circular card component
 *
 * @example
 * // Basic usage
 * <CircleCard
 *   imgUrl="/path/to/image.jpg"
 *   imgAlt="Example image"
 *   linkUrl="/example"
 *   linkText="Learn More"
 * />
 *
 * @example
 * // With inverted button style
 * <CircleCard
 *   imgUrl="/path/to/image.jpg"
 *   imgAlt="Example image"
 *   linkUrl="/example"
 *   linkText="Get Started"
 *   invert={true}
 * />
 */
export default function CircleCard({
  imgUrl,
  imgAlt,
  linkUrl,
  linkText,
  invert,
}: CircleCardProps): React.ReactElement {
  const root = useRef<HTMLDivElement | null>(null);
  const hoverTl = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    ScrollTrigger.normalizeScroll(true);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /* 1️⃣ Create a matchMedia container */
    const mm = gsap.matchMedia();
    const ctx = gsap.context(self => {
      const q = self.selector;
        if (!q) return;

      /* 2️⃣ Register the queries */
      mm.add(
        {
          // mobile
          isMobile: '(max-width: 767px)',
          // desktop
          isDesktop: '(min-width: 768px)',
        },
        ({ conditions }) => {
          const start = conditions?.isMobile ? 'center 99%' : 'top 75%';

          gsap.fromTo(
            q('.circle-img'),
            { scale: 0.8, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 1,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: el,
                start,
                once: true,
              },
            }
          );
        }
      );

      /* Hover timeline (does not depend on media-query) */
      hoverTl.current = gsap
        .timeline({ paused: true })
        .to(q('.circle-img'), { scale: 1.05, duration: 0.3, ease: 'power1.out' })
        .to(
          q('.circle-link'),
          {
            y: -6,
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            scale: 1.2,
            duration: 0.3,
            ease: 'power1.out',
          },
          '<'
        );
    }, root);

    /* Cleanup */
    return () => {
      ctx.revert();   // timelines and styles
      mm.revert();    // media-queries + associated ScrollTriggers
    };
  }, []);

  /* Hover handlers */
  const handleEnter = () => hoverTl.current?.play();
  const handleLeave = () => hoverTl.current?.reverse();

  return (
    <div
      ref={root}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="relative flex w-full max-w-lg flex-col items-center pb-10"
    >
      <div className="aspect-square h-full w-full overflow-hidden rounded-full">
        <img
          src={imgUrl}
          alt={imgAlt}
          className="circle-img h-full w-full rounded-full object-cover shadow-md"
        />
      </div>

      <Link
        href={linkUrl}
        className={`circle-link absolute bottom-0 rounded-full px-4 py-2 text-2xl uppercase transition-colors duration-1000 ease-in-out ${
          !invert
            ? 'bg-caramel-deep text-white hover:text-black hover:bg-amber-sunset'
            : 'bg-green-dark text-white hover:bg-caramel-deep'
        }`}
      >
        {linkText}
      </Link>
    </div>
  );
}
