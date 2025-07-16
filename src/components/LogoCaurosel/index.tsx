'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface LogoItem {
  src: string;
  alt?: string;
  href?: string;
}

interface LogoCarouselProps {
  logos: LogoItem[];
  speed?: number;       // px / s
  grayscale?: boolean;  // gris hasta hover
}

export default function LogoCarousel({
  logos,
  speed = 120,
  grayscale = true,
}: LogoCarouselProps) {
  const root   = useRef<HTMLDivElement | null>(null);
  const track  = useRef<HTMLUListElement | null>(null);
  const tween  = useRef<gsap.core.Tween | null>(null); // ← guardamos tween
  const [copies, setCopies] = useState(2);

  /* A. Ajusta cuántas copias necesita para cubrir 2× el ancho */
  useLayoutEffect(() => {
    const parent = root.current;
    const t      = track.current;
    if (!parent || !t) return;

    const setWidth = t.scrollWidth / copies;
    const needed   = Math.ceil((parent.offsetWidth * 2) / setWidth);

    if (needed > copies) setCopies(needed);
  }, [logos, copies]);

  /* B. Crea / actualiza la animación */
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

    /* Limpieza → NO devuelve Tween */
    return () => {
      tween.current?.kill();
    };
  }, [copies, speed, logos]);

  /* C. Hover pausa / reanuda */
  const pause  = () => tween.current?.pause();
  const resume = () => tween.current?.resume();

  /* D. Lista completa duplicada */
  const full = Array.from({ length: copies }, () => logos).flat();

  const imgClass = grayscale
    ? 'h-24 w-auto grayscale opacity-60 transition duration-300 hover:grayscale-0 hover:opacity-100'
    : 'h-24 w-auto';

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
