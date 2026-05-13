import Image from 'next/image';
import Link from 'next/link';
import SmartLink from '@/lib/SmartLink';
import Hero from '@/components/Hero';

import type { Metadata } from 'next';
import ShareButton from '@/elements/ShareButton';
import PayPalDonationButton from '@/elements/PayPalDonationButton';

import PayPalProvider from '@/components/PaypalProvider';
import { ArrowUpRightIcon, LanguageIcon, ShieldIcon, WhatsAppIcon } from '@/components/Icons';
import ImpactoBanner from '@/components/ImpactoBanner';

export const generateMetadata = (): Metadata => {
  return {
    openGraph: {
      title: 'Ellos te necesitan 🐾',
      description: 'Necesitamos de tu ayuda para saldar nuestras deudas!.',
      url: 'https://www.porlosanimalesmaldonado.org/donaciones',
      images: [
        {
          url: 'https://www.porlosanimalesmaldonado.org/og/cachorritos.jpg',
          width: 1200,
          height: 630,
          alt: 'imagen de cachorritos',
        },
      ],
      type: 'website',
    },
  };
};

export default function Donaciones() {
  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-screen bg-white">
      <Hero imgURL="/perra-con-panuelo-masticando.webp" imgAlt="una perra mordiendo una botella" />
      <section className="flex flex-col items-center justify-center p-8 w-full   text-black text-lg">
        <p className="max-w-7xl">
          Los aportes económicos de ustedes son nuestro respaldo para continuar haciendo nuestro
          labor. Son destinados para pagar principalmente atención veterinaria (cirugías,
          tratamientos, análisis, medicación, honorarios), y también para comprar insumos y alimento
          para nuestros rescatados.
        </p>
      </section>
      <section className=" w-full flex flex-col items-center justify-center  bg-cream-light py-6">
        <ImpactoBanner />
        {/* MENSIONES */}
        <h3 id="mensiones" className="mt-4 text-2xl font-bold text-green-dark text-center">
          MENCIONANOS Y AYUDANOS!!!
        </h3>
        <section className="grid grid-cols-1 sm:grid-cols-2 w-full max-w-7xl py-6 px-3 gap-4 text-green-dark">
          <article className="flex flex-col items-center justify-between bg-white rounded-lg shadow-lg w-full py-8 px-4 gap-6">
            {/* Header */}
            <header className="flex flex-col items-center gap-4 w-full">
              <h3 className="font-bold text-2xl text-center text-balance text-green-dark">
                Mencionanos en Costa Mascotas
              </h3>
              <Image
                className="rounded-xl"
                src="/logo_costa_mascotas.webp"
                alt="logo costa mascotas"
                width={300}
                height={80}
              />
              <mark className="bg-green-forest text-white px-6 py-3 rounded-full">
                <p className="font-extrabold text-xl text-center lg:text-2xl">
                  1 COMPRA = 1KG DE COMIDA
                </p>
              </mark>
            </header>

            {/* Instrucciones */}
            <main className="w-full max-w-md flex flex-col gap-6 py-4">
              <h3 className="font-extrabold text-2xl text-center text-green-dark">¿Cómo ayudo?</h3>

              {/* Por la web */}
              <section className="flex flex-col items-center justify-center bg-cream-light p-4 rounded-lg">
                <h4 className="font-extrabold text-xl text-green-dark mb-3 flex items-center gap-2">
                  <LanguageIcon size={24} color="currentColor" /> Por la web
                </h4>
                <p className="text-base mb-2">
                  Comprá en la web de Costa Mascotas usando el código de descuento:
                </p>
                <mark className="bg-amber-sunset text-white px-4 py-2 rounded-md text-center font-bold text-xl my-3 block">
                  PLAM1K
                </mark>
                <SmartLink
                  href="https://www.costamascotas.uy"
                  className="text-caramel-deep hover:text-amber-sunset font-bold text-lg underline flex justify-center"
                >
                  <ArrowUpRightIcon size={24} color="currentColor" /> costamascotas.uy
                </SmartLink>
              </section>

              {/* Por WhatsApp */}
              <section className="flex flex-col items-center justify-center bg-cream-light p-4 rounded-lg">
                <h4 className="font-extrabold text-xl text-green-dark mb-3 flex items-center gap-2">
                  <WhatsAppIcon size={24} color="currentColor" /> Por WhatsApp
                </h4>
                <p className="text-base mb-2">
                  Deciles que vas de parte de{' '}
                  <strong className="text-green-dark">Por los Animales Maldonado</strong>
                </p>
                <SmartLink
                  href="https://wa.me/59899530841"
                  className="flex items-center gap-2 max-w-fit bg-green-500 hover:bg-green-600 text-white font-bold text-lg px-4 py-2 rounded-md mt-2"
                >
                  <WhatsAppIcon size={20} color="white" /> 099 530 841
                </SmartLink>
              </section>
            </main>

            {/* Footer explicativo */}
            <footer className="bg-green-forest/10 p-6 rounded-lg text-center max-w-md">
              <p className="text-lg font-semibold text-green-dark">
                Tu ayuda es muy importante. Por cada compra con el código{' '}
                <strong className="font-bold text-amber-sunset">PLAM1K</strong>, se dona 1kg de
                comida para nuestros rescatados
              </p>
            </footer>
          </article>

          <article className="flex flex-col items-center justify-between bg-white rounded-lg shadow-lg w-full py-8 px-4 gap-6">
            {/* Header */}
            <header className="flex flex-col items-center gap-4 w-full">
              <h3 className="font-bold text-2xl text-center text-balance text-green-dark">
                Mencionanos en Consentidos
              </h3>
              <Image
                className="rounded-xl"
                src="/consentidos_logo.webp"
                alt="logo consentidos"
                width={300}
                height={80}
              />
              <mark className="bg-green-forest text-white px-6 py-3 rounded-full">
                <p className="font-extrabold text-xl text-center lg:text-2xl">
                  1 COMPRA = 1KG DE COMIDA
                </p>
              </mark>
            </header>

            {/* Instrucciones */}
            <main className="w-full max-w-md flex flex-col gap-6 py-4">
              <h3 className="font-extrabold text-2xl text-center text-green-dark">¿Cómo ayudo?</h3>

              {/* Por WhatsApp */}
              <section className="flex flex-col items-center justify-center bg-cream-light p-4 rounded-lg">
                <h4 className="font-extrabold text-xl text-green-dark mb-3 flex items-center gap-2">
                  <WhatsAppIcon size={24} color="currentColor" /> Por WhatsApp
                </h4>
                <p className="text-base mb-2">
                  Deciles que vas de parte de{' '}
                  <strong className="text-green-dark">Por los Animales Maldonado</strong>
                </p>
                <SmartLink
                  href="https://wa.me/59899128780"
                  className="flex items-center gap-2 max-w-fit bg-green-500 hover:bg-green-600 text-white font-bold text-lg px-4 py-2 rounded-md mt-2"
                >
                  <WhatsAppIcon size={20} color="white" /> 099 128 780
                </SmartLink>
              </section>
            </main>

            {/* Footer explicativo */}
            <footer className="bg-green-forest/10 p-6 rounded-lg text-center max-w-md">
              <p className="text-lg font-semibold text-green-dark">
                Tu ayuda es muy importante. Por cada compra{' '}
                <strong className="font-bold text-amber-sunset">que nos mensiones</strong>, se dona
                1kg de comida para nuestros rescatados
              </p>
            </footer>
          </article>
        </section>
        {/* APORTES ECONOMICOS */}
        <h3 id="aportes-economicos" className="text-3xl font-bold text-green-dark text-center">
          APORTES ECONOMICOS
        </h3>
        <section className="grid grid-cols-1 sm:grid-cols-2 w-full max-w-7xl py-6 px-3 gap-4">
          {/* PayPal donacion */}
          <article className="flex flex-col items-center bg-white rounded-lg shadow-lg w-full py-8 px-4 gap-6">
            {/* Header */}
            <header className="flex flex-col items-center gap-4 w-full">
              <Image src="/paypal-3.svg" alt="logo PayPal" width={300} height={80} />
              <h3 className="text-xl text-green-dark font-bold text-center">
                Donaciones por PayPal
              </h3>
            </header>

            {/* Main - Botones de donación */}
            <main className="w-full flex flex-col gap-4">
              <p className="text-center text-base font-semibold text-green-dark">
                Para donar por única vez
              </p>
              <section className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full place-items-center">
                <PayPalProvider type="capture">
                  <PayPalDonationButton amount={5} />
                  <PayPalDonationButton amount={10} />
                  <PayPalDonationButton amount={15} />
                  <PayPalDonationButton amount={25} />
                  <PayPalDonationButton amount={40} />
                  <PayPalDonationButton amount={50} />
                  <PayPalDonationButton amount={75} />
                  <PayPalDonationButton amount={100} />
                </PayPalProvider>
              </section>
            </main>

            {/* Footer */}
            <footer className="bg-cream-light p-6 rounded-lg text-center w-full max-w-md">
              <p className="text-base font-semibold text-green-dark mb-3">
                ¿Preferís donar todos los meses?
              </p>
              <p className="text-sm mb-4">
                Suscribite y hacé una donación automática mensual por el monto que elijas.
              </p>
              <Link
                href="/donaciones/paypalsuscripciones"
                className="inline-block bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold text-sm py-3 px-5 rounded-lg text-center transition-colors duration-300"
              >
                Ver planes de suscripción
              </Link>
            </footer>
          </article>

          {/* Mercado Pago */}
          <article className="flex flex-col items-center justify-between bg-white rounded-lg shadow-lg w-full py-8 px-4 gap-6">
            {/* Header */}
            <header className="flex flex-col items-center gap-4 w-full">
              <Image
                src="/Mercado-Pago-Logo-300x80.webp"
                alt="logo mercado pago"
                width={300}
                height={80}
              />
              <h3 className="text-xl text-green-dark font-bold text-center">
                Donaciones por Mercado Pago
              </h3>
            </header>

            {/* Main - Botones de donación */}
            <main className="w-full flex flex-col gap-4">
              <p className="text-center text-base font-semibold text-green-dark">
                Elegí el monto a donar
              </p>
              <section className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full place-items-center">
                <SmartLink
                  href="https://mpago.la/1wGBy73"
                  className="flex w-full items-center justify-center rounded-full border border-amber-sunset bg-gradient-to-b from-amber-sunset to-caramel-deep px-8 py-2 text-lg font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                >
                  $50
                </SmartLink>
                <SmartLink
                  href="https://mpago.la/2rEweLb"
                  className="flex w-full items-center justify-center rounded-full border border-amber-sunset bg-gradient-to-b from-amber-sunset to-caramel-deep px-8 py-2 text-lg font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                >
                  $100
                </SmartLink>
                <SmartLink
                  href="https://mpago.la/2CwawDF"
                  className="flex w-full items-center justify-center rounded-full border border-amber-sunset bg-gradient-to-b from-amber-sunset to-caramel-deep px-8 py-2 text-lg font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                >
                  $200
                </SmartLink>
                <SmartLink
                  href="https://mpago.la/1NDdWeX"
                  className="flex w-full items-center justify-center rounded-full border border-amber-sunset bg-gradient-to-b from-amber-sunset to-caramel-deep px-8 py-2 text-lg font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                >
                  $500
                </SmartLink>
                <SmartLink
                  href="https://mpago.la/16nU73n"
                  className="flex w-full items-center justify-center rounded-full border border-amber-sunset bg-gradient-to-b from-amber-sunset to-caramel-deep px-8 py-2 text-lg font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                >
                  $1000
                </SmartLink>
                <SmartLink
                  href="https://mpago.la/2L5g2xM"
                  className="flex w-full items-center justify-center rounded-full border border-amber-sunset bg-gradient-to-b from-amber-sunset to-caramel-deep px-8 py-2 text-lg font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                >
                  $1500
                </SmartLink>
                <SmartLink
                  href="https://mpago.la/31eZYyd"
                  className="w-full  md:col-span-2 flex items-center justify-center rounded-full border border-amber-sunset bg-gradient-to-b from-amber-sunset to-caramel-deep px-8 py-2 text-lg font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                >
                  $2000
                </SmartLink>
              </section>
            </main>

            {/* Footer */}
            <footer className="bg-cream-light p-6 rounded-lg text-center w-full max-w-md">
              <p className="text-base font-semibold text-green-dark mb-3">
                ¿Preferís donar todos los meses?
              </p>
              <p className="text-sm mb-4">
                Suscribite y hacé una donación automática mensual. ¡Es súper simple!
              </p>
              <SmartLink
                href="https://www.mercadopago.com.uy/subscriptions/checkout?preapproval_plan_id=2c9380848dc7c6e8018dd0ac13f8052e"
                className="flex w-full items-center justify-center rounded-full border border-amber-sunset bg-gradient-to-b from-amber-sunset to-caramel-deep px-8 py-4 text-lg font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              >
                Suscripción mensual
              </SmartLink>
            </footer>
          </article>

          {/* MiDinero */}
          <article className="flex flex-col items-center bg-white rounded-lg shadow-lg w-full py-8 px-4 gap-6">
            {/* Header */}
            <header className="flex flex-col items-center gap-4 w-full">
              <h3 className="font-bold text-green-dark text-2xl text-center text-balance">
                Transferencias MiDinero
              </h3>
              <Image
                src="/midinero-mastercard-logo-blue.svg"
                alt="logo Mi Dinero"
                width={300}
                height={80}
              />
            </header>

            {/* Main - Visualización */}
            <main className="w-full flex flex-col items-center gap-6">
              <section className="animate-wiggle relative min-h-40 w-full flex items-center justify-center">
                <Image
                  className="-rotate-6"
                  src="/md-hero-telefono-espacio.webp"
                  alt="Transferencia MiDinero"
                  width={200}
                  height={80}
                />
                <Image
                  className="animate-bounce absolute translate-x-12 rotate-12"
                  src="/md-hero-tarjeta.webp"
                  alt="Tarjeta MiDinero"
                  width={120}
                  height={80}
                />
              </section>

              <mark className="bg-green-forest text-white px-6 py-3 rounded-lg text-center">
                <p className="font-bold text-xl">
                  Cuenta: <span className="font-extrabold">679131</span>
                </p>
              </mark>
            </main>

            {/* Footer */}
            <footer className="bg-cream-light p-6 rounded-lg text-center w-full">
              <p className="text-base font-semibold text-green-dark">
                Transferí directamente a nuestra cuenta MiDinero para ayudar a nuestros rescatados
              </p>
            </footer>
          </article>

          {/* Lopez quintana dinero */}
          <article className="flex flex-col items-center bg-white rounded-lg shadow-lg w-full py-8 px-4 gap-6">
            {/* Header */}
            <header className="flex flex-col items-center gap-4 w-full">
              <h3 className="font-bold text-green-dark text-2xl text-center text-balance">
                Donación Directa en Veterinaria
              </h3>
              <Image
                className="rounded-xl"
                src="/lopezquintana-logo.webp"
                alt="logo López Quintana"
                width={300}
                height={80}
              />
            </header>

            {/* Main - Información de contacto */}
            <main className="w-full max-w-md flex flex-col gap-4">
              <section className="bg-cream-light p-4 rounded-lg text-center">
                <h4 className="font-bold text-green-dark text-lg mb-3">Ubicación</h4>
                <p className="text-base mb-1">
                  <strong>Dirección:</strong> 25 de mayo 890, Maldonado
                </p>
              </section>

              <section className="bg-cream-light p-4 rounded-lg text-center">
                <h4 className="font-bold text-green-dark text-lg mb-3">Teléfonos</h4>
                <div className="flex flex-wrap justify-center gap-2">
                  <a
                    href="tel:+59842223864"
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition"
                  >
                    4222-3864
                  </a>
                  <a
                    href="tel:+59891929271"
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition"
                  >
                    091 929 271
                  </a>
                </div>
              </section>
            </main>

            {/* Footer */}
            <footer className="bg-green-forest/10 p-6 rounded-lg text-center w-full">
              <p className="text-base font-semibold text-green-dark mb-3">
                Podés colaborar directamente en López Quintana a nuestro nombre
              </p>
              <p className="text-sm text-green-dark">
                📧 Envianos el comprobante a:{' '}
                <a
                  href="mailto:porlosanimalesmaldo@gmail.com"
                  className="text-caramel-deep hover:text-amber-sunset font-bold underline"
                >
                  porlosanimalesmaldo@gmail.com
                </a>
              </p>
            </footer>
          </article>

          {/* 3IMPACTO */}
          <article className="sm:col-span-2 flex flex-col items-center bg-white rounded-lg shadow-lg w-full py-8 px-4 gap-6">
            {/* Header */}
            <header className="flex flex-col items-center gap-4 w-full">
              <h3 className="font-bold text-green-dark text-2xl text-center text-balance">
                Comunidad
              </h3>
              <Image
                className="rounded-xl"
                src="/LogoImpactoBig.svg"
                alt="logo Comunidad 3IMPACTO"
                width={300}
                height={80}
              />
            </header>

            {/* Main  */}
            <main className="w-full max-w-md sm:max-w-full flex flex-col gap-4 ">
              <section className="bg-cream-light p-4 rounded-lg text-center">
                <h4 className="font-bold text-green-dark text-lg mb-3">Ubicación</h4>
                <p className="text-base mb-1">
                  3Impacto es una plataforma que impulsa proyectos con impacto social y ambiental. A
                  través de su sistema de “escudos”, permite que personas y empresas apoyen causas
                  reales y transparentes.
                </p>
                <p className="text-base mb-1">
                  Gracias a esta alianza, PLAM suma una herramienta que facilita recibir apoyo,
                  financiar rescates y seguir mejorando la atención, rehabilitación y adopción de
                  nuestros peludos.
                </p>
              </section>
            </main>

            {/* Footer */}
            <footer className="bg-green-forest/10 p-6 rounded-lg text-center w-full">
              <h4 className="font-bold text-green-dark text-lg mb-3">Quiero unirme!</h4>
              <div className="flex flex-col justify-center items-center gap-2">
                <p className="text-base mb-1">
                  Cada escudo adquirido en 3Impacto ayuda directamente a que podamos continuar
                  nuestro trabajo con los peludos.{' '}
                </p>
                <SmartLink
                  href="https://3impacto.eco/marketplace/proyecto-plam"
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition"
                >
                  Adquirir escudo <ShieldIcon size={30} color="white" />
                </SmartLink>
              </div>
            </footer>
          </article>
        </section>

        <h3 id="donacion-de-insumos" className="text-3xl font-bold text-green-dark text-center">
          DONACIÓN DE INSUMOS
        </h3>

        {/* DONACION DE INSUMOS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 w-full max-w-7xl py-6 px-3 gap-4">
          {/* Lopez quintana insumos */}
          <article className="flex flex-col items-center bg-white rounded-lg shadow-lg w-full py-8 px-4 gap-6">
            {/* Header */}
            <header className="flex flex-col items-center gap-4 w-full">
              <h3 className="font-bold text-green-dark text-2xl text-center text-balance">
                Donación de Insumos
              </h3>
              <Image
                className="rounded-xl"
                src="/lopezquintana-logo.webp"
                alt="logo López Quintana"
                width={300}
                height={80}
              />
            </header>

            {/* Main - Información de contacto */}
            <main className="w-full max-w-md flex flex-col gap-4">
              <section className="bg-cream-light p-4 rounded-lg text-center">
                <h4 className="font-bold text-green-dark text-lg mb-3">Ubicación</h4>
                <p className="text-base mb-1">
                  <strong>Dirección:</strong> 25 de mayo 890, Maldonado
                </p>
              </section>

              <section className="bg-cream-light p-4 rounded-lg text-center">
                <h4 className="font-bold text-green-dark text-lg mb-3">Teléfonos</h4>
                <div className="flex flex-wrap justify-center gap-2">
                  <a
                    href="tel:+59842223864"
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition"
                  >
                    4222-3864
                  </a>
                  <a
                    href="tel:+59891929271"
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition"
                  >
                    091 929 271
                  </a>
                </div>
              </section>
            </main>

            {/* Footer */}
            <footer className="bg-green-forest/10 p-6 rounded-lg text-center w-full">
              <p className="text-base font-semibold text-green-dark mb-3">
                Podés donar medicamentos e insumos y dejarlos en la veterinaria a nuestro nombre
              </p>
              <p className="text-sm text-green-dark">
                Siempre necesitamos: <mark className="bg-amber-sunset/30 px-1">pipetas</mark>,{' '}
                <mark className="bg-amber-sunset/30 px-1">collares antipulgas</mark>,{' '}
                <mark className="bg-amber-sunset/30 px-1">pastillas antiparasitarias</mark> y más.
                ¡Todo suma!
              </p>
            </footer>
          </article>

          {/* Raciones la coronilla */}
          <article className="flex flex-col items-center bg-white rounded-lg shadow-lg w-full py-8 px-4 gap-6">
            {/* Header */}
            <header className="flex flex-col items-center gap-4 w-full">
              <h3 className="font-bold text-green-dark text-2xl text-center text-balance">
                Donación de Ración
              </h3>
              <Image
                className="rounded-xl"
                src="/raciones-la-coronilla.webp"
                alt="logo Raciones La Coronilla"
                width={300}
                height={80}
              />
            </header>

            {/* Main */}
            <main className="w-full max-w-md flex flex-col gap-4">
              <section className="flex flex-col  items-center justify-center bg-cream-light p-4 rounded-lg text-center">
                <h4 className="font-bold text-green-dark text-lg mb-3"> Contacto</h4>
                <SmartLink
                  href="https://wa.me/59899160536"
                  className="flex items-center justify-center gap-2 max-w-fit bg-green-500 hover:bg-green-600 text-white font-bold text-lg px-4 py-2 rounded-md mt-2"
                >
                  <WhatsAppIcon size={20} color="white" /> 099 160 536
                </SmartLink>
              </section>
            </main>

            {/* Footer */}
            <footer className="bg-green-forest/10 p-6 rounded-lg text-center w-full">
              <p className="text-base font-semibold text-green-dark mb-2">
                🙌 Donación a precio de costo
              </p>
              <p className="text-sm text-green-dark">
                Podés donar ración a través de Raciones La Coronilla,
                <mark className="bg-amber-sunset/30 px-1 ml-1">nos deja a precio de costo</mark>
              </p>
            </footer>
          </article>
        </section>

        {/* OTRAS FORMAS DE APORTAR */}
        <h3 id="donacion-de-insumos" className="text-3xl font-bold text-green-dark text-center">
          OTRAS FORMAS DE APORTAR
        </h3>

        <section className="grid grid-cols-1 sm:grid-cols-2 w-full max-w-7xl py-6 px-3 gap-4">
          {/* TRANSITORIO */}
          <article className="flex flex-col items-center bg-white rounded-lg shadow-lg w-full py-8 px-4 gap-6">
            {/* Header */}
            <header className="flex flex-col items-center gap-4 w-full">
              <h3 className="font-bold text-green-dark text-2xl text-center text-balance">
                Ser Hogar Transitorio
              </h3>
              <Image
                className="rounded-xl object-cover"
                src="/perrito-negro-dormido.webp"
                alt="perrito dormido en hogar transitorio"
                width={300}
                height={200}
              />
            </header>

            {/* Main */}
            <main className="w-full flex flex-col items-center gap-4">
              <section className="bg-cream-light p-6 rounded-lg text-center">
                <p className="text-base text-green-dark leading-relaxed">
                  Prestás un espacio seguro mientras nosotros nos encargamos de{' '}
                  <mark className="bg-amber-sunset/30 px-1">alimento</mark>,{' '}
                  <mark className="bg-amber-sunset/30 px-1">atención veterinaria</mark> y{' '}
                  <mark className="bg-amber-sunset/30 px-1">búsqueda de hogar definitivo</mark>
                </p>
              </section>
            </main>

            {/* Footer */}
            <footer className="w-full flex justify-center">
              <SmartLink href="/involucrate#transitorio" variant="primary">
                Más Información →
              </SmartLink>
            </footer>
          </article>

          {/* TRASLADOS SOLIDARIOS */}
          <article className="flex flex-col items-center bg-white rounded-lg shadow-lg w-full py-8 px-4 gap-6">
            {/* Header */}
            <header className="flex flex-col items-center gap-4 w-full">
              <h3 className="font-bold text-green-dark text-2xl text-center text-balance">
                Traslados Solidarios
              </h3>
              <Image
                className="rounded-xl object-cover"
                src="/perrito-negro-respaldo.webp"
                alt="perrito en auto esperando traslado"
                width={300}
                height={200}
              />
            </header>

            {/* Main */}
            <main className="w-full flex flex-col items-center gap-4">
              <section className="bg-cream-light p-6 rounded-lg text-center">
                <p className="text-base text-green-dark leading-relaxed mb-3">
                  ¿Tenés <mark className="bg-amber-sunset/30 px-1">auto</mark> y un{' '}
                  <mark className="bg-amber-sunset/30 px-1">rato libre</mark>?
                </p>
                <p className="text-base text-green-dark leading-relaxed">
                  Podés ayudarnos llevando animalitos a la veterinaria o a su hogar de tránsito. ¡Es
                  una gran forma de sumar! 🚗
                </p>
              </section>
            </main>

            {/* Footer */}
            <footer className="w-full flex justify-center">
              <SmartLink href="/involucrate#transitorio" variant="primary">
                Más Información →
              </SmartLink>
            </footer>
          </article>
        </section>

        <section className="flex flex-col items-center justify-center w-full max-w-7xl px-3 gap-4">
          <article className="flex flex-col items-center bg-green-forest/15 rounded-lg shadow-lg w-full py-8 px-4 gap-6">
            {/* Header */}
            <header className="w-full text-center">
              <h3 className="font-bold text-green-dark text-4xl text-balance mb-2">
                Todo ayuda, todo suma
              </h3>
            </header>

            {/* Main */}
            <main className="w-full flex flex-col items-center gap-4">
              <section className="bg-white/60 p-6 rounded-lg text-center max-w-2xl">
                <p className="text-base text-green-dark leading-relaxed">
                  Si querés colaborar con otro tipo de donaciones, como{' '}
                  <mark className="bg-amber-sunset/30 px-1">mantas</mark>,{' '}
                  <mark className="bg-amber-sunset/30 px-1">cuchas</mark> u{' '}
                  <mark className="bg-amber-sunset/30 px-1">otros elementos útiles</mark>, no dudes
                  en escribirnos. ¡Gracias por tu ayuda!
                </p>
              </section>
            </main>

            {/* Footer */}
            <footer className="w-full flex flex-col items-center gap-2">
              <p className="text-green-dark font-semibold">Correo electrónico:</p>
              <a
                href="mailto:porlosanimalesmaldo@gmail.com"
                className="text-caramel-deep hover:text-amber-sunset font-bold text-lg underline"
              >
                porlosanimalesmaldo@gmail.com
              </a>
            </footer>
          </article>
        </section>

        <section className="flex flex-col items-center justify-center p-8 gap-8 w-full max-w-7xl font-semibold text-black text-lg  ">
          <h3 className="text-3xl font-bold">Tu ayuda cambia vidas 🐾</h3>
          <p>
            Gracias a tu ayuda, podemos alimentar, cuidar y encontrar un hogar para cientos de
            animales en situación de calle. Cada donación, por pequeña que sea, hace una gran
            diferencia.
          </p>
          <p>
            💗 <strong>¿No podés donar ahora?</strong> También podés ayudar compartiendo esta página
            con tus amigos, en redes sociales o con quien quieras.
          </p>
          <p>¡Entre todos hacemos posible el cambio!</p>
          <ShareButton variant="primary" />
        </section>
      </section>
    </div>
  );
}
