'use client';
import Image from 'next/image';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useRef } from 'react';

gsap.registerPlugin(useGSAP, SplitText, ScrollTrigger);

export default function ImpactoBanner(): React.ReactElement {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });

      // Split text into characters for animation
      const titleSplit = new SplitText('.banner_title', { type: 'chars' });
      const descriptionSplit = new SplitText('.banner_description', { type: 'words' });

      tl.to('.dog_image', {
        x: '0%',
        duration: 1.5,
      })
        .from(
          titleSplit.chars,
          {
            opacity: 0,
            y: 50,
            rotateX: -90,
            stagger: 0.02,
            duration: 0.8,
            ease: 'back.out(1.7)',
          },
          '-=1'
        )
        .to('.logo', {
          x: 0,
          opacity: 1,
          stagger: 0.2,
          duration: 0.5,
        })
        .to(
          '.logo_container',
          {
            x: 0,
            opacity: 1,
            duration: 0.3,
          },
          '<'
        )
        .from(
          descriptionSplit.words,
          {
            opacity: 0,
            y: 20,
            stagger: 0.03,
            duration: 0.5,
            ease: 'power2.out',
          },
          '-=0.3'
        )
        .to('.btn_info', {
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: 'back.out(1.7)',
        });

      return () => {
        titleSplit.revert();
        descriptionSplit.revert();
      };
    },
    { scope: containerRef }
  );
  return (
    <section
      ref={containerRef}
      className=" relative impacto-banner bg-[url('/paisaje_16_9.webp')] bg-cover bg-center w-full h-auto overflow-hidden"
    >
      <a
        href="https://3impacto.eco/marketplace/proyecto-plam"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full h-full"
      >
        <div className="absolute top-0 left-0 right-0 bottom-0 flex flex-col justify-around pl-6">
          <h3 className="banner_title text-3xl sm:text-5xl md:text-7xl font-bold text-white">
            Nos unimos!
          </h3>
          <div className="flex  items-center justify-around sm:justify-normal pl-2 gap-8 w-full bg-white/30 rounded-l-xl  translate-x-full logo_container z-10 sm:z-0">
            <Image
              src="/logo300.webp"
              alt="Impacto Banner"
              width={200}
              height={600}
              className="logo w-16 sm:w-24 lg:w-40 h-auto object-contain translate-x-[300%]"
            />
            <Image
              src="/LogoImpactoBig.svg"
              alt="Impacto Banner"
              width={200}
              height={600}
              className="logo w-24 sm:w-44 lg:w-64 h-auto object-contain translate-x-[300%]"
            />

            <span className="logo sm:hidden bg-caramel-deep text-white text-sm sm:text-lg md:text-3xl lg:text-6xl w-fit px-6 py-1 mt-1 rounded-xl opacity-0 -translate-x-full ">
              más info!
            </span>
          </div>

          <span className="btn_info hidden sm:block bg-caramel-deep text-white text-sm sm:text-lg md:text-3xl lg:text-6xl w-fit px-6 py-1 mt-1 rounded-xl opacity-0 -translate-x-full ">
            más info!
          </span>

          <p className="banner_description text-white text-md lg:text-3xl leading-tight p-2 w-full  z-10">
            Ahora puedes ayudarnos sumandote a la comunidad 3Impacto.eco.
          </p>
        </div>

        <Image
          src="/perro_16_9.webp"
          alt="Impacto Banner"
          width={1200}
          height={400}
          className="dog_image w-full h-auto object-cover translate-x-2/3 -z-10"
        />
      </a>
    </section>
  );
}
