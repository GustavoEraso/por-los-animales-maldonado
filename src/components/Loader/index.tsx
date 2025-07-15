'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Loader() {
    const root = useRef<HTMLDivElement | null>(null);

    /* 15 huesos con escala y z‑index variables */
    const bones = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        scale: gsap.utils.mapRange(0, 14, 1.6, 0.5, i), // ← usa i
        z: gsap.utils.mapRange(0, 14, 0, 14, i),
    }));

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            /* ───── Huesos flotantes ───── */
            const vw = window.innerWidth;
            const distance = vw * 2.2;          // 110 vw → –110 vw
            const baseSpeed = 600;              // px/s; sube/baja para “viento”

            gsap.set('.bone', {
                visibility: 'visible',
                y: () => gsap.utils.random(-50, window.innerHeight - 50),
                x: '110vw',
                opacity: () => gsap.utils.random(0.35, 0.8),
                rotate: () => gsap.utils.random(-15, 15),
            });

            gsap.to('.bone', {
                x: '-110vw',
                ease: 'none',
                duration: () =>
                    (distance / baseSpeed) * gsap.utils.random(0.8, 1.2), // igual velocidad en todos los viewports
                stagger: {
                    repeat: -1,                       // cada hueso se auto‑reinicia
                    each: 0.2,                      // muchos huesos al mismo tiempo
                    from: 'random',
                },
            });

            /* ───── Texto “Cargando…” ───── */
            gsap.set('.loading-dot', { opacity: 0 });
            gsap.timeline({ repeat: -1 })
                .to('.loading-dot', {
                    opacity: 1,
                    duration: 0.25,
                    stagger: 0.25,
                    ease: 'power1.inOut',
                })
                .to(
                    '.loading-dot',
                    {
                        opacity: 0,
                        duration: 0.25,
                        stagger: 0.25,
                        ease: 'power1.inOut',
                    },
                    '+=0.25' // pequeña pausa antes de reiniciar
                );
        }, root);

        return () => ctx.revert();
    }, []);

    return (
        <div
            ref={root}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-amber-sunset/90"
        >
            {/* Capa de huesos */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {bones.map(({ id, scale, z }) => (
                    <img
                        key={id}
                        src="/hueso-200.webp"
                        alt=""
                        aria-hidden="true"
                        style={{
                            transform: `scale(${scale})`,
                            zIndex: z,
                            visibility: 'hidden',
                        }}
                        className="bone absolute top-0"
                    />
                ))}
            </div>

            {/* Logo + texto */}
            <div className="relative z-20 flex flex-col items-center">
                <img src="/logo300.webp" alt="logo" className="w-40 md:w-56" />
                <p className="mt-4 text-center text-2xl font-bold text-white select-none">
                    Cargando
                    <span className="loading-dot">.</span>
                    <span className="loading-dot">.</span>
                    <span className="loading-dot">.</span>
                </p>
            </div>
        </div>
    );
}
