// app/animals/[id]/page.tsx (Server Component)
import { fetchAnimals } from "@/lib/fetchAnimal";
import Hero from "@/components/Hero";
import PhotoCarrousel from "@/components/PhotoCarrousel";
import { Modal } from "@/components/Modal";

import { formatDateMMYYYY, yearsOrMonthsElapsed } from "@/lib/dateUtils";


type PageProps = {
  params: Promise<{ id: string }>
};

export default async function AnimalPage({ params }: PageProps) {
  const { id } = await params
  const [animal] = await fetchAnimals({ id});

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

  const { name, description, isAvalible , images, gender, aproxBirthDate, status, size, species, waitingSince } = animal;
  const img = images.length > 0 ? images : [{ imgUrl: '/logo300.webp', imgAlt: 'Imagen no disponible' }];

  return (
    <div className="flex flex-col items-center pb-6 gap-8 w-full min-h-screen bg-white">
      <Hero imgURL={img[0].imgUrl} title={name} imgAlt={img[0].imgAlt} />

      <section className="flex flex-col lg:flex-row gap-4 py-4 w-full justify-center items-center">
        <div className="flex flex-col md:flex-row gap-4 px-9 py-4 max-w-7xl">
          <div className="flex flex-col gap-4 text-start text-black px-2">
            <p className="text-green-dark text-lg font-bold">{description}</p>
            <ul className="list-disc pl-4 text-green-dark">
              <li className="text-xl font-semibold">Estado: <span className="font-normal">{`${isAvalible ? 'Disponible': 'De momento no se puede adoptar'}`}</span></li>
              <li className="text-xl font-semibold">Género: <span className="font-normal">{gender}</span></li>
              <li className="text-xl font-semibold">Especie: <span className="font-normal">{species}</span></li>
              <li className="text-xl font-semibold">Tamaño: <span className="font-normal">{size}</span></li>
              <li className="text-xl font-semibold">Situación actual: <span className="font-normal">{status}</span></li>
              <li className="text-xl font-semibold">Edad: <span className="font-normal">{yearsOrMonthsElapsed(aproxBirthDate)}</span></li>
              <li className="text-xl font-semibold">
                Esperándote desde: <span className="font-normal">{`${formatDateMMYYYY(waitingSince)} (hace ${yearsOrMonthsElapsed(waitingSince)})`}</span>
              </li>
            </ul>
          </div>
          <img src={img[0].imgUrl} alt={img[0].imgAlt} width={300} height={400} className="w-full md:w-1/3 h-auto rounded-lg object-cover" />
        </div>
      </section>

      <section className="flex flex-col gap-4 px-9 py-4 w-full max-w-7xl items-center">
        <h3 className="font-extrabold text-4xl text-green-dark">Más imágenes</h3>
        <PhotoCarrousel images={img} />
      </section>

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
            <a href="https://docs.google.com/forms/d/1csJabjokYazcnd5CB4inEXJF27_m_9UjK854l1p_G3o/edit?ts=62f54023#" target="_blank"
                rel="noopener noreferrer"
                className="w-fit text-lg rounded-full px-4 py-3 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase text-center text-balance">Llenar formulario</a>
        </section>
      </Modal>
    </div>
  );
}

