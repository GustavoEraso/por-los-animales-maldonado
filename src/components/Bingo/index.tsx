import Image from 'next/image';
import { WhatsAppIcon } from '@/components/Icons';
import SmartLink from '@/lib/SmartLink';
import ShareButton from '@/elements/ShareButton';

export default function Bingo() {
  return (
    <section className="flex flex-col items-center justify-center w-full bg-white p-6">
      <div className="flex flex-col lg:flex-row gap-8 items-center justify-center w-full  ">
        <Image
          width={500}
          height={500}
          src="https://res.cloudinary.com/dytabfg7v/image/upload/v1760111715/flyer_njhq2f.webp"
          alt="Flyer del Bingo solidario"
          className="w-full  lg:w-1/3 rounded-lg shadow-lg "
        />
        <div className="flex flex-col w-full gap-4 text-start text-black px-2 ">
          <h3 className="font-bold text-3xl  sm:text-4xl balance text-center">
            🎉¡BINGO, BINGO!🎉
          </h3>
          <p className="text-lg">
            ¡Ya están disponibles los bonos para nuestro gran Bingo solidario!
          </p>
          <p className="text-lg bg-[#25d366] active:scale-95 shadow-md text-white rounded-md p-2 w-fit">
            <SmartLink href="https://wa.me/59895260657" className="flex gap-1 w-fit">
              Pedí el tuyo al <strong>095 260 657</strong> <WhatsAppIcon />
            </SmartLink>
          </p>
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-lg">🪄 Comprar es muy fácil:</p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>Pedís por WhatsApp la cantidad de bonos que querés.</li>
              <li>Realizás el giro y enviás el comprobante.</li>
              <li>Te mandamos la foto de tu bono y lo retirás el día del evento, en el lugar.</li>
            </ol>
          </div>
          <p>
            ✨ Cada bono tiene un valor de <strong>$450</strong> e incluye una consumición de{' '}
            <strong>$250</strong> en los locales del Mercado Gastronómico 🍽️ y el primer cartón para
            jugar 🎟️.
          </p>
          <p>
            Si querés sumar más oportunidades de ganar, cada cartón adicional cuesta{' '}
            <strong>$50</strong>.
          </p>
          <p>
            También podés comprar tu bono el mismo día del Bingo (te recomendamos llegar un ratito
            antes del comienzo).
          </p>
          <p className="text-lg font-semibold">
            Será una tarde llena de diversión, solidaridad y premios…{' '}
            <span className="text-amber-sunset">
              PODES GANARTE UN PASAJE PARA 2 PERSONAS A BUENOS AIRES
            </span>{' '}
            y muchos premios más 🎁 incluso para los amigos de 4 🐾
          </p>
          <div className="flex flex-col gap-1 text-lg font-semibold">
            <p>📅 Martes 21 de octubre</p>
            <p>🕔 17:00 hs</p>
            <p>📍 Mercado San Fernando – tercer nivel de Punta Shopping</p>
          </div>
          <p className="text-sm italic">
            🙏 Gracias a{' '}
            <SmartLink href="https://www.instagram.com/clubrotarymaldonado/">
              @clubrotarymaldonado
            </SmartLink>{' '}
            y{' '}
            <SmartLink href="https://www.instagram.com/puntashoppinguy/">
              @puntashoppinguy
            </SmartLink>{' '}
            por impulsar este hermoso evento y apoyarnos siempre.
          </p>
          <p className="text-lg font-bold text-caramel-deep">
            No te quedes sin tu bono, se van rápido 🥳
          </p>
          <div className="flex flex-col gap-4 lg:flex-row items-center justify-center p-4">
            <p className="text-lg bg-[#25d366] shadow-md active:scale-95 text-white rounded-md p-2 w-fit">
              <SmartLink href="https://wa.me/59895260657" className="flex gap-1 w-fit">
                Pedí el tuyo al <strong>095 260 657</strong> <WhatsAppIcon />
              </SmartLink>
            </p>
            <ShareButton
              shareTitle="Bingo Solidario"
              shareText="¡Participa y gana increíbles premios!"
              urlToShare="https://www.porlosanimalesmaldonado.com/bingo"
              className="text-2xl bg-amber-sunset hover:bg-amber-600 active:scale-95 text-white font-bold py-2 px-4 rounded-full flex items-center justify-center w-fit mx-auto"
            >
              {' '}
              Avisale a tus amigos !
            </ShareButton>
          </div>
        </div>
      </div>
    </section>
  );
}
