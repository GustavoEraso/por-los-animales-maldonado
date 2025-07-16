'use client';

import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import SplitText from 'gsap/SplitText';
import type { SplitText as SplitTextInstance } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

export interface RevealSectionProps {
  imgSrc: string;
  imgAlt: string;
  title: string;
  text: string;
  linkHref?: string;
  linkText?: string;
}

export default function RevealSection({
  imgSrc,
  imgAlt,
  title,
  text,
  linkHref,
  linkText,
}: RevealSectionProps) {
  const root = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!root.current) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /* 1️⃣  Normaliza el scroll móvil una sola vez */
    ScrollTrigger.normalizeScroll(true);

    let split: SplitTextInstance | null = null;

    /* 2️⃣  Contenedor de media-queries */
    const mm = gsap.matchMedia();

    /* 3️⃣  Contexto GSAP, para limpiar fácilmente */
    const ctx = gsap.context(self => {
      const q = self.selector;
      if (!q) return;

      /* 4️⃣  Registro de queries */
      mm.add(
        {
          isMobile: '(max-width: 767px)',
          isDesktop: '(min-width: 768px)',
        },
        ({ conditions }) => {
          const start = conditions?.isMobile ? 'center 90%' : 'top 70%';
         

          /* Imagen desde la derecha */
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

          /* Texto en líneas con SplitText */
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

          /* Título + botón */
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

    /* 5️⃣  Limpieza */
    return () => {
      ctx.revert();   // tweens + estilos
      mm.revert();    // media-queries y triggers
      split?.revert();
    };
  }, []);

  /* 6️⃣  JSX */
  return (
    <section
      ref={root}
      className="flex w-full flex-col items-center justify-center bg-cream-light px-6"
    >
      <div className="flex w-full max-w-6xl flex-col items-center justify-center gap-8 py-16 md:flex-row-reverse">
        {/* Imagen */}
        <div className="flex w-full lg:w-2/3 min-w-1/3 items-center justify-center">
          <div className="flex aspect-square w-full max-w-lg items-center justify-center rounded-full bg-cream-light">
            <img src={imgSrc} alt={imgAlt} className="img w-9/12" />
          </div>
        </div>

        {/* Texto + botón */}
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
