// app/animals/[id]/page.tsx (Server Component)
import { fetchAnimals } from "@/lib/fetchAnimal";
import Hero from "@/components/Hero";
import PhotoCarrousel from "@/components/PhotoCarrousel";
import { Modal } from "@/components/Modal";

import { formatDateMMYYYY, yearsOrMonthsElapsed } from "@/lib/dateUtils";
import ShareButton from "@/elements/ShareButton";
import { unstable_ViewTransition as ViewTransition } from 'react';

import { buildFormUrl } from "@/lib/buildFormUrl";

type PageProps = {
  params: Promise<{ id: string }>
};

export default async function AnimalPage({ params }: PageProps) {
  const { id } = await params
  const [animal] = await fetchAnimals({ id });

  if (!animal) {
    return (
      <div className="flex flex-col items-center gap-8 w-full min-h-screen bg-white">
        <Hero title="ups" />
        <section className="flex flex-col gap-4 px-9 py-4 max-w-7xl">
          <h1>Mascota no encontrada</h1>
        </section>
      </div>
    );
  }

  const { name, description, isAvalible, images, gender, aproxBirthDate, status, size, species, waitingSince, compatibility, isSterilized } = animal;
  const img = images.length > 0 ? images : [{ imgUrl: '/logo300.webp', imgAlt: 'Imagen no disponible', imgId: 'default-image' }];

  const YesNoUnknownMap = {
    si: 'Sí',
    no: 'No',
    no_se: 'No sabemos',
  };

  return (
    <div className="flex flex-col items-center pb-6 gap-8 w-full min-h-screen bg-white">
      <ViewTransition name={`animal-${id}`}>
        <Hero imgURL={img[0].imgUrl} title={name} imgAlt={img[0].imgAlt} />
      </ViewTransition>

      <section className="flex flex-col lg:flex-row gap-4 py-4 w-full justify-center items-center">
        <div className="flex flex-col md:flex-row gap-4 px-9 py-4 max-w-7xl">
          <div className="flex flex-col gap-4 text-start text-black px-2 md:w-3/5">
            <p className="text-green-dark text-lg font-bold">{description}</p>
            <ul className="list-disc pl-4 text-green-dark">
              <li className="text-xl font-semibold">Estado: <span className="font-normal">{`${isAvalible ? 'Disponible' : 'De momento no se puede adoptar'}`}</span></li>
              <li className="text-xl font-semibold">Género: <span className="font-normal">{gender}</span></li>
              <li className="text-xl font-semibold">Especie: <span className="font-normal">{species}</span></li>
              <li className="text-xl font-semibold">Tamaño: <span className="font-normal">{size}</span></li>
              <li className="text-xl font-semibold">Situación actual: <span className="font-normal">{status}</span></li>
              <li className="text-xl font-semibold">Edad: <span className="font-normal">{yearsOrMonthsElapsed(aproxBirthDate)}</span></li>
              <li className="text-xl font-semibold">
                Esperándote desde: <span className="font-normal">{`${formatDateMMYYYY(waitingSince)} (hace ${yearsOrMonthsElapsed(waitingSince)})`}</span>
              </li>
              <li className="text-xl font-semibold">Está esterilizado: <span className="font-normal">{YesNoUnknownMap[isSterilized]}</span></li>
              <li>
                <span className="text-xl font-semibold">Compatibilidad:</span>
                <ul className="list-disc pl-4 ">
                  <li> <span className="font-semibold">Con perros:</span> {YesNoUnknownMap[compatibility.dogs]}</li>
                  <li><span className="font-semibold">Con gatos:</span> {YesNoUnknownMap[compatibility.cats]}</li>
                  <li><span className="font-semibold">Con niños:</span> {YesNoUnknownMap[compatibility.kids]}</li>
                </ul>
              </li>
            </ul>
            <Modal buttonText="Postularme para adopción">
              <section className="flex flex-col items-center justify-around bg-cream-light w-full h-full p-4 gap-1 text-center ">
                <h4 className="font-extrabold text-2xl  text-green-dark">Antes de continuar, por favor lee con atención:</h4>
                <p className=" text-green-dark text-md font-bold ">
                  Adoptar una mascota es un compromiso para toda la vida. No se trata de una decisión impulsiva, sino de una responsabilidad que requiere tiempo, dedicación, amor y recursos.

                </p>

                <p className=" text-green-dark text-md font-bold ">
                  Si estás completamente seguro de que puedes ofrecerle un hogar responsable y amoroso, entonces te invitamos a continuar con el formulario.
                </p>
                <p className=" text-green-dark text-md font-bold ">
                  Gracias por querer cambiar una vida. 🐾❤️
                </p>
                {/* <a href="https://docs.google.com/forms/d/1csJabjokYazcnd5CB4inEXJF27_m_9UjK854l1p_G3o/edit?ts=62f54023#" target="_blank" */}
                <a href={buildFormUrl({ dogName: name, dogId: id })} target="_blank"
                  rel="noopener noreferrer"
                  className="w-fit text-lg rounded-full px-4 py-3 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase text-center text-balance">Llenar formulario</a>
              </section>
            </Modal>

          </div>
          {/* Photo Carrousel */}
          <div className="w-full md:w-2/5 h-auto rounded-lg bg-amber-sunset">

            <PhotoCarrousel images={img} />
          </div>

        </div>
      </section>
      <Modal buttonText="Ver formas de Compartir" buttonStyles="w-fit text-2xl rounded-full px-4 py-3 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase text-center text-balance cursor-pointer">
        <section className="flex flex-col items-center justify-around bg-cream-light w-full h-full p-4 gap-2 text-center ">
          <h4 className="font-extrabold text-2xl text-green-dark">¡Comparte y ayuda a {name} a encontrar familia!</h4>
          <p className="text-green-dark text-md font-bold">
            Difunde el perfil de {name} para que más personas puedan conocerlo y darle una oportunidad de tener un hogar lleno de amor.
          </p>
          <ShareButton animate={false} />
          <p className="text-green-dark text-md font-bold">
            Si usas redes sociales, puedes crear una imagen especial para compartir en tus historias:
          </p>
          <a
            href={`http://localhost:3000/adopta/${id}/compartir`}
            className="w-fit text-xl rounded-full px-2 py-3 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase text-center text-balance cursor-pointer"
            target="_blank"
            rel="noopener noreferrer"
          >
            Generar imagen para historias
          </a>
          <p className="text-green-dark text-md font-bold">
            ¡Gracias por apoyar la adopción y ayudar a cambiar vidas!
          </p>
        </section>
      </Modal>
    </div>
  );
}

