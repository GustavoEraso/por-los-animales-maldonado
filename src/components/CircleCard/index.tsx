'use client';

import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface CircleCardProps {
  imgUrl: string;
  imgAlt: string;
  linkUrl: string;
  linkText: string;
  invert?: boolean;
}

export default function CircleCard({
  imgUrl,
  imgAlt,
  linkUrl,
  linkText,
  invert,
}: CircleCardProps) {
  const root = useRef<HTMLDivElement | null>(null);
  const hoverTl = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    ScrollTrigger.normalizeScroll(true);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /* 1️⃣  Crea un contenedor matchMedia */
    const mm = gsap.matchMedia();
    const ctx = gsap.context(self => {
      const q = self.selector;
        if (!q) return;

      /* 2️⃣  Registra las queries */
      mm.add(
        {
          // móvil
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

      /* Timeline de hover (no depende de media-query) */
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

    /* Limpieza */
    return () => {
      ctx.revert();   // timelines y styles
      mm.revert();    // media-queries + ScrollTriggers asociados
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
