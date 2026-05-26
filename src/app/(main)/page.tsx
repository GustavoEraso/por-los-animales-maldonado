import HeroCarrousel from '@/components/HeroCarrousel';
import CircleCard from '@/components/CircleCard';
import RevealSection from '@/components/RevealSection';
import LogoCarousel from '@/components/LogoCarousel';
import SmartLink from '@/lib/SmartLink';
import { FacebookIcon, InstagramIcon } from '@/components/Icons';
import ImpactoBanner from '@/components/ImpactoBanner';
import { getSponsorsData, getCarouselsForPlace } from '@/lib/data/sponsors';
import { SponsorType } from '@/types';

export default async function Home() {
  const [sponsors, carousels] = await Promise.all([
    getSponsorsData(),
    getCarouselsForPlace('home'),
  ]);

  const sponsorMap = new Map<string, SponsorType>(sponsors.map((s) => [s.id, s]));

  return (
    <div className="flex flex-col items-center min-h-screen overflow-x-hidden">
      <HeroCarrousel />
      {/* <Hero /> */}
      <main className="flex flex-col w-full  items-center justify-center">
        <section className="flex flex-col items-center justify-center w-full bg-white px-6">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full max-w-6xl py-16">
            <div className="bg-cream-light rounded-full w-full max-w-lg aspect-square flex items-center justify-center">
              <img className="w-9/12" src="/logo300.webp" alt="logo" />
            </div>
            <div className="flex flex-col gap-4   text-start text-black px-2">
              <h3 className="font-bold text-4xl">CONOCENOS</h3>
              <p>
                Somos un equipo de personas impulsadas por la empatía hacia los animales,
                reconociéndolos como nuestros semejantes debido a su capacidad para experimentar
                placer, alegría, dolor y sufrimiento.
              </p>
              <SmartLink variant="primary" href="/nosotros">
                Ver más
              </SmartLink>
            </div>
          </div>
        </section>

        <section className="flex flex-col items-center justify-center w-full bg-cream-light px-6">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full max-w-6xl py-16">
            <div className="w-full min-w-1/3 flex items-center justify-center">
              <CircleCard
                imgAlt="imagen madre cn sus cachorros"
                imgUrl="/madre-con-cachorros.webp"
                linkUrl="/adopta"
                linkText="quiero adoptar"
              />
            </div>
            <div className="flex flex-col gap-4   text-start text-black px-2">
              <h3 className="font-bold text-4xl uppercase">adoptá</h3>
              <p>
                Al pensar en adoptar, es crucial tener en cuenta diversos factores para garantizar
                una convivencia armoniosa. Evalúa el espacio disponible en tu hogar, el tiempo que
                puedes dedicar al juego y paseo, así como los costos asociados con la alimentación,
                atención veterinaria y cuidado durante las vacaciones. Asegúrate de que tu elección
                de mascota se ajuste a tu estilo de vida y a la cantidad de tiempo que puedes
                comprometer.
              </p>
              <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                <SmartLink variant="primary" href="/adopta#antes-de-adoptar">
                  Antes de adoptar
                </SmartLink>
                <SmartLink variant="primary" href="/adopta#requisitos">
                  Requisitos
                </SmartLink>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col items-center justify-center w-full bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2  gap-8 w-full max-w-6xl p-4 py-16">
            <CircleCard
              imgUrl={'/perro-amarillo-feliz.webp'}
              imgAlt={'imagen perro amarillo feliz'}
              linkUrl={'/donaciones#aportes-economicos'}
              linkText="doná ahora"
              invert={true}
            />
            <CircleCard
              imgUrl="/perro-pelado.webp"
              imgAlt={'imagen perro blanco que necesita atencion medica'}
              linkUrl={'/donaciones#donacion-de-insumos'}
              linkText="doná insumos"
              invert={false}
            />
          </div>
        </section>

        <RevealSection
          imgSrc="/logo300.webp"
          imgAlt="Logo"
          title="Involucrate"
          text="Hay muchas formas de ayudar a los animales más allá de adoptar. Podés colaborar ayudando con traslados, siendo hogar transitorio, ofreciendo un espacio para guardar donaciones, difundiendo casos en redes o incluso denunciando situaciones de maltrato animal. También recibimos donaciones de insumos, alimentos, mantas o cualquier elemento útil. Cada granito de arena cuenta y suma al bienestar de quienes más nos necesitan. ¡Tu compromiso puede hacer una gran diferencia!"
          linkHref="/involucrate"
          linkText="Ver más"
        />
        <section className="flex flex-col items-center justify-center w-full  py-12">
          {/* <h3 className="font-bold text-2xl text-center text-balance md:text-4xl uppercase">
            Infintas gracias a ellos:
          </h3> */}

          {carousels.length > 0 &&
            carousels.map((carousel) => {
              const logos = carousel.sponsorIds
                .map((id) => sponsorMap.get(id))
                .filter((s): s is SponsorType => s !== undefined)
                .map((s) => ({ src: s.image.imgUrl, alt: s.image.imgAlt, href: s.href }));

              return logos.length > 0 ? (
                <LogoCarousel
                  key={carousel.id}
                  speed={carousel.speed}
                  reverse={carousel.direction === 'reverse'}
                  logos={logos}
                />
              ) : null;
            })}
        </section>

        <section className="flex flex-col items-center justify-center w-full bg-white px-6 py-12">
          <div className="flex flex-col gap-4   text-start text-black px-2">
            <h3 className="font-bold text-4xl uppercase text-center text-balance">
              siguenos en nuestras redes:
            </h3>
            <section className="flex flex-col md:flex-row gap-6 items-center justify-center ">
              <SmartLink
                href="https://www.facebook.com/PorLosAnimalesMaldonado"
                aria-label="Enlace a Facebook"
              >
                <span className="flex justify-center items-center p-4 rounded-full gap-2 text-2xl hover:bg-white transition duration-300 ease-in-out">
                  <FacebookIcon />
                  FACEBOOK
                </span>
              </SmartLink>
              <SmartLink
                href="https://www.instagram.com/porlosanimales_maldonado/?hl=es"
                aria-label="Enlace a Instagram"
              >
                <span className="flex justify-center items-center p-4 rounded-full gap-2 text-2xl hover:bg-white transition duration-300 ease-in-out">
                  <InstagramIcon />
                  INSTAGRAM
                </span>
              </SmartLink>
            </section>
            <h3 className="font-bold text-4xl uppercase text-center text-balance">
              nuestro correo electronico:
            </h3>
            <SmartLink
              className=" text-xl md:text-3xl text-center"
              href="mailto:porlosanimalesmaldo@gmail.com"
            >
              porlosanimalesmaldo@gmail.com
            </SmartLink>
          </div>
        </section>
        <ImpactoBanner />
      </main>
    </div>
  );
}
