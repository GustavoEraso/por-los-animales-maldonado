// app/animals/[id]/page.tsx (Server Component)
import { getAnimalById, getLitterSiblings, getParents, getOffspring } from '@/lib/data/animals';
import Hero from '@/components/Hero';
import PhotoCarrousel from '@/components/PhotoCarrousel';
import { Modal } from '@/components/Modal';
import Loader from '@/components/Loader';
import Card from '@/components/Card';
import { ImageIcon, ShareIcon } from '@/components/Icons';
import ShareButton from '@/elements/ShareButton';

import { formatDateMMYYYY, yearsOrMonthsElapsed } from '@/lib/dateUtils';
import { Suspense, ViewTransition } from 'react';

import { buildFormUrl } from '@/lib/buildFormUrl';
import SmartLink from '@/lib/SmartLink';

type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Animal details component that fetches and displays animal data.
 * Receives params promise and awaits it inside Suspense boundary.
 */
async function AnimalDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const animal = await getAnimalById(id);

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

  const {
    name,
    description,
    isAvailable,
    images,
    gender,
    aproxBirthDate,
    status,
    size,
    species,
    waitingSince,
    compatibility,
    isSterilized,
    litterId,
    motherId,
    fatherId,
  } = animal;
  const img =
    images.length > 0
      ? images
      : [{ imgUrl: '/logo300.webp', imgAlt: 'Imagen no disponible', imgId: 'default-image' }];

  const siblings = litterId ? await getLitterSiblings(litterId, id) : [];
  const parents = await getParents(motherId, fatherId);
  const offspring = await getOffspring(id);

  const YesNoUnknownMap = {
    si: 'Sí',
    no: 'No',
    no_se: 'No sabemos',
  };

  return (
    <div className="flex flex-col items-center pb-6 gap-8 w-full min-h-screen bg-white">
      <ViewTransition name={`animal-${id}`}>
        <Hero imgURL={img[0].imgUrl} title={name} imgAlt={img[0].imgAlt} enableShare />
      </ViewTransition>

      <section className="flex flex-col lg:flex-row gap-4 py-4 w-full justify-center items-center">
        <div className="flex flex-col md:flex-row gap-4 px-9 py-4 w-full max-w-7xl">
          <div className="flex flex-col gap-4 text-start text-black px-2 md:w-3/5">
            <textarea
              className="text-green-dark text-lg font-bold field-sizing-content resize-none"
              value={description}
              readOnly
              aria-label="Descripción del animal"
              disabled
            />
            <ul className="list-disc pl-4 text-green-dark">
              <li className="text-xl font-semibold">
                Estado:{' '}
                <span className="font-normal">{`${isAvailable ? 'Disponible' : 'De momento no se puede adoptar'}`}</span>
              </li>
              <li className="text-xl font-semibold">
                Género: <span className="font-normal">{gender}</span>
              </li>
              <li className="text-xl font-semibold">
                Especie: <span className="font-normal">{species}</span>
              </li>
              <li className="text-xl font-semibold">
                Tamaño: <span className="font-normal">{size}</span>
              </li>
              <li className="text-xl font-semibold">
                Situación actual: <span className="font-normal">{status}</span>
              </li>
              <li className="text-xl font-semibold">
                Edad: <span className="font-normal">{yearsOrMonthsElapsed(aproxBirthDate)}</span>
              </li>
              <li className="text-xl font-semibold">
                Esperándote desde:{' '}
                <span className="font-normal">{`${formatDateMMYYYY(waitingSince)} (hace ${yearsOrMonthsElapsed(waitingSince)})`}</span>
              </li>
              <li className="text-xl font-semibold">
                Está esterilizado:{' '}
                <span className="font-normal">{YesNoUnknownMap[isSterilized]}</span>
              </li>
              <li>
                <span className="text-xl font-semibold">Compatibilidad:</span>
                <ul className="list-disc pl-4 ">
                  <li>
                    {' '}
                    <span className="font-semibold">Con perros:</span>{' '}
                    {YesNoUnknownMap[compatibility.dogs]}
                  </li>
                  <li>
                    <span className="font-semibold">Con gatos:</span>{' '}
                    {YesNoUnknownMap[compatibility.cats]}
                  </li>
                  <li>
                    <span className="font-semibold">Con niños:</span>{' '}
                    {YesNoUnknownMap[compatibility.kids]}
                  </li>
                </ul>
              </li>
            </ul>
            {isAvailable && (
              <Modal buttonText="Postularme para adopción">
                <section className="flex flex-col items-center justify-around bg-cream-light w-full h-full p-4 gap-1 text-center ">
                  <h4 className="font-extrabold text-2xl  text-green-dark">
                    Antes de continuar, por favor lee con atención:
                  </h4>
                  <p className=" text-green-dark text-md font-bold ">
                    Adoptar una mascota es un compromiso para toda la vida. No se trata de una
                    decisión impulsiva, sino de una responsabilidad que requiere tiempo, dedicación,
                    amor y recursos.
                  </p>

                  <p className=" text-green-dark text-md font-bold ">
                    Si estás completamente seguro de que puedes ofrecerle un hogar responsable y
                    amoroso, entonces te invitamos a continuar con el formulario.
                  </p>
                  <p className=" text-green-dark text-md font-bold ">
                    Gracias por querer cambiar una vida. 🐾❤️
                  </p>
                  {/* <a href="https://docs.google.com/forms/d/1csJabjokYazcnd5CB4inEXJF27_m_9UjK854l1p_G3o/edit?ts=62f54023#" target="_blank" */}
                  <SmartLink
                    href={buildFormUrl({ dogName: name, dogId: id })}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="primary"
                    aria-label={`Llenar formulario de adopción para ${name}`}
                  >
                    Llenar formulario
                  </SmartLink>
                </section>
              </Modal>
            )}

            {!isAvailable && (
              <div className="text-red-600 font-bold text-xl">
                Actualmente {name} no está disponible para adopción. Si deseas más información,
                contáctanos a través de nuestras redes sociales o correo electrónico.
              </div>
            )}
          </div>
          {/* Photo Carrousel */}
          <div className="w-full md:w-2/5 h-auto rounded-lg bg-amber-sunset">
            <PhotoCarrousel images={img} />
          </div>
        </div>
      </section>
      <section className=" flex flex-col md:flex-row items-center justify-center gap-3 px-9 py-2 w-full max-w-7xl">
        <SmartLink
          variant="primary"
          href={`/adopta/${id}/compartir`}
          aria-label={`Generar imagen para compartir perfil de ${name}`}
        >
          <ImageIcon size="lg" title={`Generar imagen para compartir perfil de ${name}`} />
          <div className="flex flex-col md:flex-row md:gap-1 ml-1 ">
            <span>Generar imagen </span>
            <span>para compartir</span>
          </div>
        </SmartLink>
        <ShareButton
          animate={false}
          variant="primary"
          shareTitle={`Conoce a ${name}`}
          shareText={`Ayudanos a que ${name} encuentre una familia.`}
          urlToShare={`https://porlosanimalesmaldonado.org/adopta/${id}`}
          aria-label={`Compartir perfil de ${name} con enlace`}
        >
          <ShareIcon size="lg" title={`Compartir perfil de ${name} con enlace`} />
          <span>Compartir enlace</span>
        </ShareButton>
      </section>
      {parents.length > 0 && (
        <section className="flex flex-col items-center gap-4 px-9 py-4 w-full max-w-7xl">
          <h3 className="text-2xl font-bold text-green-dark">Padres</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 w-full">
            {parents.map((parent) => (
              <div key={parent.id} className="flex flex-col items-center gap-1">
                <span className="text-sm font-semibold text-gray-600 capitalize">
                  {parent.parentRole}
                </span>
                <Card animal={parent} />
              </div>
            ))}
          </div>
        </section>
      )}

      {siblings.length > 0 && (
        <section className="flex flex-col items-center gap-4 px-9 py-4 w-full max-w-7xl">
          <h3 className="text-2xl font-bold text-green-dark">
            🐾 Hermanos de camada ({animal.litterName})
          </h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 w-full">
            {siblings.map((sibling) => (
              <Card key={sibling.id} animal={sibling} />
            ))}
          </div>
        </section>
      )}

      {offspring.length > 0 && (
        <section className="flex flex-col items-center gap-4 px-9 py-4 w-full max-w-7xl">
          <h3 className="text-2xl font-bold text-green-dark">Hijos ({offspring.length})</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 w-full">
            {offspring.map((child) => (
              <Card key={child.id} animal={child} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Loading fallback for animal details.
 * Must be completely static - no data fetching or dynamic components.
 */
function AnimalDetailsFallback() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full min-h-screen bg-white">
      <Loader />
      <p className="text-green-dark text-lg">Cargando información...</p>
    </div>
  );
}

export default async function AnimalPage({ params }: PageProps) {
  return (
    <Suspense fallback={<AnimalDetailsFallback />}>
      <AnimalDetails params={params} />
    </Suspense>
  );
}
