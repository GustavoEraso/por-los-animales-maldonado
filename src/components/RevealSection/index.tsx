'use client';

import React from 'react';
import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import SplitText from 'gsap/SplitText';
import type { SplitText as SplitTextInstance } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * Props for the RevealSection component.
 */
export interface RevealSectionProps {
  /** Source URL of the image to display */
  imgSrc: string;
  /** Alt text for the image */
  imgAlt: string;
  /** Title text to display */
  title: string;
  /** Main content text */
  text: string;
  /** Optional link URL */
  linkHref?: string;
  /** Optional link text */
  linkText?: string;
}

/**
 * Animated reveal section component with GSAP scroll-triggered animations.
 *
 * Creates an engaging section with image and text content that animates into view
 * as the user scrolls. Features responsive design with different animation triggers
 * for mobile and desktop. Uses GSAP SplitText for line-by-line text animations,
 * and includes optional call-to-action link.
 *
 * @param {RevealSectionProps} props - Component props
 * @param {string} props.imgSrc - Source URL of the image to display
 * @param {string} props.imgAlt - Alt text for the image
 * @param {string} props.title - Title text to display
 * @param {string} props.text - Main content text
 * @param {string} [props.linkHref] - Optional link URL
 * @param {string} [props.linkText] - Optional link text
 * @returns {React.ReactElement} The rendered reveal section component
 *
 * @example
 * // Basic usage without link
 * <RevealSection
 *   imgSrc="/animal-care.jpg"
 *   imgAlt="Cuidado de animales"
 *   title="Nuestro Compromiso"
 *   text="Trabajamos todos los días para mejorar la vida de los animales en Maldonado."
 * />
 *
 * @example
 * // With call-to-action link
 * <RevealSection
 *   imgSrc="/volunteer.jpg"
 *   imgAlt="Voluntarios trabajando"
 *   title="Únete a Nosotros"
 *   text="Forma parte de nuestro equipo de voluntarios y ayuda a cambiar vidas."
 *   linkHref="/voluntarios"
 *   linkText="Ser Voluntario"
 * />
 */
export default function RevealSection({
  imgSrc,
  imgAlt,
  title,
  text,
  linkHref,
  linkText,
}: RevealSectionProps): React.ReactElement {
  const root = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!root.current) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Normalize mobile scroll behavior once
    ScrollTrigger.normalizeScroll(true);

    let split: SplitTextInstance | null = null;

    // Media queries container
    const mm = gsap.matchMedia();

    // GSAP context for easy cleanup
    const ctx = gsap.context(self => {
      const q = self.selector;
      if (!q) return;

      // Register media queries for responsive animations
      mm.add(
        {
          isMobile: '(max-width: 767px)',
          isDesktop: '(min-width: 768px)',
        },
        ({ conditions }) => {
          const start = conditions?.isMobile ? 'center 90%' : 'top 70%';
         
          // Image animation from right
          gsap.from(q('.img'), {
            xPercent: 100,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: root.current,
              start,
              once: true,
            },
          });

          // Text animation with SplitText line by line
          split = SplitText.create(q('.text'), { type: 'lines', aria: 'auto' });

          gsap.from(split.lines, {
            y: 24,
            opacity: 0,
            stagger: 0.08,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: root.current,
              start,
              once: true,
             
            },
          });

          // Title and button animations
          gsap.from(q(['.title', '.btn']), {
            y: 40,
            opacity: 0,
            stagger: 0.1,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: root.current,
              start,
              once: true,
            
            },
          });
        }
      );
    }, root);

    // Cleanup function
    return () => {
      ctx.revert();   // tweens and styles
      mm.revert();    // media queries and triggers
      split?.revert();
    };
  }, []);

  // Component JSX
  return (
    <section
      ref={root}
      className="flex w-full flex-col items-center justify-center bg-cream-light px-6"
    >
      <div className="flex w-full max-w-6xl flex-col items-center justify-center gap-8 py-16 md:flex-row-reverse">
        {/* Image container */}
        <div className="flex w-full lg:w-2/3 min-w-1/3 items-center justify-center">
          <div className="flex aspect-square w-full max-w-lg items-center justify-center rounded-full bg-cream-light">
            <img src={imgSrc} alt={imgAlt} className="img w-9/12" />
          </div>
        </div>

        {/* Text content and optional button */}
        <div className="flex w-full flex-col gap-4 px-2 text-start text-black">
          <h3 className="title text-4xl font-bold uppercase">{title}</h3>

          <p className="text">{text}</p>

          {linkHref && linkText && (
            <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
              <Link
                href={linkHref}
                className="btn w-fit rounded-full bg-caramel-deep px-4 py-2 text-2xl uppercase text-white transition duration-300 ease-in-out hover:bg-amber-sunset"
              >
                {linkText}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
