
import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";

import type { Metadata } from 'next'
import ShareButton from "@/elements/ShareButton";

export const generateMetadata = (): Metadata => {
  return {
    openGraph: {
      title: 'Ellos te necesitan 🐾',
      description: 'Necesitamos de tu ayuda para saldar nuestras deudas!.',
      url: 'https://por-los-animales-maldonado.vercel.app/donaciones',
      images: [
        {
          url: 'https://por-los-animales-maldonado.vercel.app/og/cachorritos.jpg',
          width: 1200,
          height: 630,
          alt: 'imagen de cachorritos',
        },
      ],
      type: 'website',
    },
  }
}


export default function Donaciones() {
  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-screen bg-white">

      <Hero />
      <section className="flex flex-col items-center justify-center p-8 w-full   text-black text-lg">
        <p className="max-w-7xl">Los aportes económicos de ustedes son nuestro respaldo para continuar haciendo nuestro labor. Son destinados para pagar principalmente atención veterinaria (cirugías, tratamientos, análisis, medicación, honorarios), y también para comprar insumos y alimento para nuestros rescatados.</p>
      </section>
      <section className=" w-full flex flex-col items-center justify-center  bg-cream-light py-6">
        {/* APORTES ECONOMICOS */}
        <h3 id="aportes-economicos" className="text-3xl font-bold text-green-dark text-center" >APORTES ECONOMICOS</h3>
        <section className="grid grid-cols-1 sm:grid-cols-2 w-full max-w-7xl py-6 px-3 gap-4">
          {/* Mercado Pago */}
          <article className=" flex flex-col items-center justify-between bg-white rounded-lg  w-full py-8 gap-10">
            <Image src='/Mercado-Pago-Logo-300x80.png' alt='logo mercado pago' width={300} height={80} />
            <p className="text-xl text-black   font-bold">Links para donar</p>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 w-full h-full place-items-center ">
              <Link target="_blank" href="https://mpago.la/1wGBy73" className="w-fit text-2xl text-center rounded-full px-4 py-2 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase">
                DONÁ $50
              </Link>
              <Link target="_blank" href="https://mpago.la/2rEweLb" className="w-fit text-2xl text-center rounded-full px-4 py-2 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase">
                DONÁ $100
              </Link>
              <Link target="_blank" href="https://mpago.la/2CwawDF" className="w-fit text-2xl text-center rounded-full px-4 py-2 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase">
                DONÁ $200
              </Link>
              <Link target="_blank" href="https://mpago.la/1NDdWeX" className="w-fit text-2xl text-center rounded-full px-4 py-2 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase">
                DONÁ $500
              </Link>
              <Link target="_blank" href="https://mpago.la/16nU73n" className="w-fit text-2xl text-center rounded-full px-4 py-2 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase">
                DONÁ $1000
              </Link>
              <Link target="_blank" href="https://mpago.la/2L5g2xM" className="w-fit text-2xl text-center rounded-full px-4 py-2 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase">
                DONÁ $1500
              </Link>
              <Link target="_blank" href="https://mpago.la/31eZYyd" className="w-fit text-2xl text-center rounded-full px-4 py-2 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase">
                DONÁ $2000
              </Link>

            </section>
            <section className="flex flex-col items-center justify-center gap-4 px-4 text-lg text-black font-semibold text-center text-balance">
              <p>Si preferís, podés suscribirte y hacer una donación automática todos los meses, por el monto que vos elijas.</p>
              <p>¡Es una forma súper simple de ayudar!</p>
              <Link target="_blank" href="https://www.mercadopago.com.uy/subscriptions/checkout?preapproval_plan_id=2c9380848dc7c6e8018dd0ac13f8052e" className="animate-bounce w-fit text-2xl text-center rounded-full px-4 py-2 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase">
                SUSCRIPCIÓN MENSUAL
              </Link>

            </section>

          </article>

          {/* MiDinero */}
          <article className=" flex flex-col items-center justify-between bg-white rounded-lg  w-full py-8 gap-10">
            <h3 className="  font-bold text-black text-2xl text-center text-balance">TRANSEFERENCIAS MIDINERO</h3>
            <Image src='/midinero-mastercard-logo-blue.svg' alt='logo Mi Dinero' width={300} height={80} />

            <section className="animate-wiggle relative min-h-70 w-full flex flex-col items-center justify-center gap-4">
              <Image className="absolute w-30 " src='/md-hero-telefono-espacio.png' alt='logo Mi Dinero' width={300} height={80} />
              <Image className=" animate-bounce absolute translate-x-18 rotate-12 w-30" src='/md-hero-tarjeta.png' alt='logo Mi Dinero' width={150} height={80} />

            </section>

            <section className="  text-black text-xl ">
              <p><strong>Numero de cuenta:</strong>679131</p>
            </section>

          </article>

          {/* Lopez quintana dinero */}
          <article className=" flex flex-col items-center justify-between bg-white rounded-lg  w-full py-8 px-4 gap-10">
            <h3 className="  font-bold text-black text-xl text-center text-balance">DONAR DIRECAMENTE EN LA VETERNARIA</h3>
            <Image className="rounded-xl" src='/lopezquintana-logo.jpg' alt='logo Mi Dinero' width={300} height={80} />
            <section>
              <p><strong>telefonos: </strong>
                <a href="tel:+59842223864">42223864</a> -
                <a href="tel:+59899811905">099811905</a>
              </p>
              <p><strong>dirección: </strong>25 de mayo 890 - Maldonado</p>
            </section>
            <section className="flex flex-col items-center justify-center gap-4 p-8 text-xl text-black font-bold text-center">
              <p>Quienes quieran darnos una mano pueden colaborar directamente en Lopez Quintana a nuestro nombre y nos envían por mail comprobante</p>
            </section>


            <section className="  text-black text-xl flex flex-wrap justify-center items-center ">
              <span className="font-bold">correo electronico:</span><a href="mailto:porlosanimalesmaldo@gmail.com">porlosanimalesmaldo@gmail.com</a>
            </section>

          </article>



        </section>

        <h3 id="donacion-de-insumos" className="text-3xl font-bold text-green-dark text-center" >DONACIÓN DE INSUMOS</h3>


        {/* DONACION DE INSUMOS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 w-full max-w-7xl py-6 px-3 gap-4">

          {/* Lopez quintana dinero */}
          <article className=" flex flex-col items-center justify-between bg-white rounded-lg  w-full py-8 px-4 gap-10">
            <h3 className="  font-bold text-black text-xl text-center text-balance">DONACION DE INSUMOS</h3>
            <Image className="rounded-xl" src='/lopezquintana-logo.jpg' alt='logo Mi Dinero' width={300} height={80} />
            <section>
              <p><strong>telefonos: </strong>
                <a href="tel:+59842223864">42223864</a> -
                <a href="tel:+59899811905">099811905</a>
              </p>
              <p><strong>dirección: </strong>25 de mayo 890 - Maldonado</p>
            </section>
            <section className="flex flex-col items-center justify-center gap-4 p-8 text-xl text-black font-bold text-center">
              <p>Si querés ayudar, podés donar medicamentos e insumos y dejarlos en la veterinaria a nuestro nombre.</p>
              <p>Algunas ideas: podés donar pipetas, collares antipulgas o pastillas. ¡Todo suma!</p>
            </section>
          </article>

          {/* Raciones la coronilla */}
          <article className=" flex flex-col items-center justify-between bg-white rounded-lg  w-full py-8 px-4 gap-10">
            <h3 className="  font-bold text-black text-xl text-center text-balance">DONAR RACIÓN</h3>
            <Image className="rounded-xl" src='/raciones-la-coronilla.jpg' alt='logo Mi Dinero' width={300} height={80} />
            <section>
              <p><strong>telefono: </strong>
                <a href="tel:+598099160536">099160536</a>
              </p>
            </section>
            <section className="flex flex-col items-center justify-center gap-4 p-8 text-xl text-black font-bold text-center">
              <p>Pueden donar ración a través de Raciones La Coronilla, ya que nos deja a precio de costo 🙌</p>
            </section>

          </article>


        </section>


        {/* OTRAS FORMAS DE APORTAR */}
        <h3 id="donacion-de-insumos" className="text-3xl font-bold text-green-dark text-center" >OTRAS FORMAS DE APORTAR</h3>

        <section className="grid grid-cols-1 sm:grid-cols-2 w-full max-w-7xl py-6 px-3 gap-4">

          {/* TRANSITORIO */}
          <article className=" flex flex-col items-center justify-between bg-white rounded-lg  w-full py-8 px-4 gap-10">
            <h3 className="  font-bold text-black text-xl text-center text-balance">SIENDO HOGAR TRANSITORIO</h3>
            <Image className="rounded-xl" src='/perrito-dormido.jpg' alt='logo Mi Dinero' width={300} height={80} />
            <section className="flex flex-col items-center justify-center gap-4 p-8 text-xl text-black font-bold text-center">
              <p>También podés ayudar siendo hogar de tránsito: prestás un espacio para que el animal esté seguro, mientras nosotros nos encargamos de todo, alimento, atención veterinaria y la búsqueda de un hogar definitivo. 🙌</p>
            </section>
            <Link href="/involucrate#transitorio" className="w-fit text-2xl text-center rounded-full px-4 py-2 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase">
              más info
            </Link>
          </article>

          {/* TRASLADOS SOLIDARIOS */}
          <article className=" flex flex-col items-center justify-between bg-white rounded-lg  w-full py-8 px-4 gap-10">
            <h3 className="  font-bold text-black text-xl text-center text-balance">TRASLADOS SOLIDARIOS</h3>
            <Image className="rounded-xl" src='/perrito-negro-respaldo.jpg' alt='logo Mi Dinero' width={300} height={80} />
            <section className="flex flex-col items-center justify-center gap-4 p-8 text-xl text-black font-bold text-center">
              <p>¿Tenés auto y un rato libre? Podés ayudarnos con traslados solidarios, llevando a los animalitos a la veterinaria o a su hogar de tránsito. ¡Es una gran forma de sumar!</p>
            </section>
            <Link href="/involucrate#transitorio" className="w-fit text-2xl text-center rounded-full px-4 py-2 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase">
              más info
            </Link>
          </article>
        </section>

        <section className="flex flex-col items-center justify-center w-full max-w-7xl  px-3 gap-4">
          <article className=" flex flex-col items-center justify-between bg-green-forest/15 rounded-lg  w-full py-8 px-4 ">
            <h3 className="  font-bold text-green-dark text-4xl text-center text-balance">Todo ayuda, todo suma</h3>
            {/* <Image className="rounded-xl" src='/perrito-negro-respaldo.jpg' alt='logo Mi Dinero' width={300} height={80} /> */}
            <section className="flex flex-col items-center justify-center gap-4 p-8 text-xl text-black font-bold text-center">
              <p>Si querés colaborar con otro tipo de donaciones, como mantas, cuchas u otros elementos útiles, no dudes en escribirnos por correo. ¡Gracias por tu ayuda!</p>
            </section>
            <section className="  text-black text-xl flex flex-wrap justify-center items-center ">
              <span className="font-bold">correo electronico:</span><a href="mailto:porlosanimalesmaldo@gmail.com">porlosanimalesmaldo@gmail.com</a>
            </section>
          </article>
        </section>

        <section className="flex flex-col items-center justify-center p-8 gap-8 w-full max-w-7xl font-semibold text-black text-lg  ">
          <h3 className="text-3xl font-bold">Tu ayuda cambia vidas 🐾</h3>
          <p>Gracias a tu ayuda, podemos alimentar, cuidar y encontrar un hogar para cientos de animales en situación de calle.
            Cada donación, por pequeña que sea, hace una gran diferencia.</p>
          <p>💗 <strong>¿No podés donar ahora?</strong> También podés ayudar compartiendo esta página con tus amigos, en redes sociales o con quien quieras.</p>
          <p>
            ¡Entre todos hacemos posible el cambio!
          </p>
          <ShareButton />


        </section>
      </section>

    </div>
  );
}