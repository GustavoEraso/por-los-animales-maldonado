import Image from 'next/image';
import Hero from '@/components/Hero';
import IconCard from '@/components/IconCard';

export default function Nosotros() {
  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-screen bg-white">
      <Hero
        imgURL="/madre-con-cachorros.webp"
        imgAlt="cachorros jugando mientras su madre mira desde atras"
      />
      <section className="flex flex-col lg:flex-row gap-4 px-9 py-4 w-full  max-w-7xl justify-center items-center">
        <section className="w-full">
          {/* Imagen flotante */}
          <div className="float-right lg:w-1/2 w-full ml-4 mb-2 ">
            <Image
              src="/heroImg.webp"
              alt="Rescate animal"
              width={300}
              height={400}
              className="w-full h-auto object-cover rounded-lg"
              priority
            />
          </div>

          {/* Texto que rodea la imagen */}
          <p className="mt-4 text-lg leading-relaxed">
            <strong>Por Los Animales</strong> empezó sin saber en lo que se iba a convertir. Una de
            nuestras compañeras hizo la página para difundir algún caso que se encontraba en la
            calle y no molestar a sus contactos personales. Enseguida tuvo el apoyo de conocidos y
            los casos llegaban, quizás porque estábamos más atentas, o porque éramos la única página
            de ayuda animal (aparte de la protectora) en Maldonado en ese entonces. <br />
            <br />
            Al poco tiempo se sumó otra colega. Entre amistad y rescates, de a poquito fue creciendo
            en seguidores. Hubo casos muy graves y nosotras éramos inexpertas, no sabíamos ni cómo
            proceder. Pero publicando con la mano en el corazón cada caso, siempre se encontraba
            solución. Año a año se sumaban nuevas compañeras: íbamos contando cómo trabajábamos y
            formando equipo. Algunos se quedaban, otros se iban, pero un grupito pequeño siempre
            sostenía. <br />
            <br />
            De a poco se fue gestando una verdadera organización. Sin tener espacio físico y eso fue
            clave fuimos creciendo en seguidores, en casos, en gastos y en gente que quería ayudar.
            Hasta lo que somos hoy: un grupo de rescatistas independientes que tienen como bandera
            el respeto entre nosotros y una serie de mecanismos para actuar de la manera más
            organizada y eficaz posible dentro de nuestras posibilidades. <br />
            <br />
            Seguimos siendo personas comunes y corrientes, mejor organizadas, y siempre con un fin
            común: ayudar animalitos necesitados en situación de calle.
          </p>

          {/* Limpia el float para que la siguiente sección no se meta al costado */}
          <div className="clear-both"></div>
        </section>
      </section>
      <h3 className="uppercase text-center text-balance text-2xl lg:text-4xl font-bold   text-black px-4 ">
        ¿Cómo desarrollamos nuestras actividades?
      </h3>
      <section>
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 px-9 py-4 w-full">
          <IconCard
            icon="/logo300.webp"
            title="Transitorios"
            description="Dado que no somos refugio ni tenemos espacio físico, para poder rescatar y ayudar es fundamental contar con hogares transitorios. Sin estos nuestra tarea se hace imposible."
          />
          <IconCard
            icon="/logo300.webp"
            title="Traslados"
            description="Los animales necesitan traslados diarios: a la veterinaria, al hogar transitorio o al definitivo. Por eso nos apoyamos en voluntarios. Si tenés vehículo y unos minutos, ¡sumate como traslado solidario y cambiá su historia!"
          />
          <IconCard
            icon="/logo300.webp"
            title="Donaciones"
            description="Los aportes económicos de ustedes son nuestro respaldo para continuar haciendo nuestro labor. Son destinados para pagar principalmente atención veterinaria (cirugías, tratamientos, análisis, medicación, honorarios), y también para comprar insumos y alimento para nuestros rescatados."
          />
          <IconCard
            icon="/logo300.webp"
            title="Adopciones"
            description="Encontramos hogar para cada animal difundiendo sus historias en redes sociales y realizando jornadas de adopción en locales amigos. ¿Querés sumar tu ayuda? Adoptá, participá en los encuentros o simplemente compartí nuestras publicaciones: ¡difundir también salva vidas!"
          />
          <IconCard
            icon="/logo300.webp"
            title="Voluntariado"
            description="En Por Los Animales Maldonado todas somos voluntarias: nadie cobra sueldo. Cada aporte económico se invierte en alimento, veterinaria y cuidado directo de los animales. ¿Querés sumarte? Tu tiempo o talento puede marcar la diferencia."
          />
        </section>
      </section>
    </div>
  );
}
