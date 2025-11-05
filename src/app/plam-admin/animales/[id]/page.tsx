'use client';
import Hero from '@/components/Hero';
import PhotoCarrousel from '@/components/PhotoCarrousel';
import { Modal } from '@/components/Modal';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Animal, AnimalTransactionType, PrivateInfoType } from '@/types';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import { auth } from '@/firebase';

import { formatDateMMYYYY, yearsOrMonthsElapsed } from '@/lib/dateUtils';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import Loader from '@/components/Loader';
import { deleteImage } from '@/lib/deleteIgame';
import { deleteFirestoreData } from '@/lib/firebase/deleteFirestoreData';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import ProtectedRoute from '@/components/ProtectedRoute';

const contactLabelMap = {
  adoptado: 'Adoptante',
  transitorio: 'Transitorio',
  calle: 'Contacto',
  protectora: 'Contacto',
};

export default function AnimalPage() {
  const router = useRouter();
  const params = useParams();
  const currentId = params.id as string;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const MIN_LOADING_TIME = 600;

  const [animal, setAnimal] = useState<Animal>({} as Animal);
  const [privateInfo, setPrivateInfo] = useState<PrivateInfoType>({} as PrivateInfoType);
  // const [animalTransaction, setAnimalTransaction] = useState<AnimalTransactionType>({} as AnimalTransactionType);
  const [allAnimalTransactions, setAllAnimalTransactions] = useState<AnimalTransactionType[]>(
    [] as AnimalTransactionType[]
  );

  useEffect(() => {
    const fetchAnimalData = async () => {
      try {
        if (!currentId) return null;
        const animal = await getFirestoreDocById<Animal>({
          currentCollection: 'animals',
          id: currentId,
        });
        if (!animal) {
          console.error('Animal not found');
          throw new Error('Animal not found');
        }
        const currentPrivateInfo = await getFirestoreDocById<PrivateInfoType>({
          currentCollection: 'animalPrivateInfo',
          id: currentId,
        });
        if (!currentPrivateInfo) {
          console.error('Private info not found');
          throw new Error('Private info not found');
        }
        const currentTransactions = await getFirestoreData({
          currentCollection: 'animalTransactions',
          filter: [['id', '==', currentId]],
        });
        if (!currentTransactions) {
          console.error('Transaction info not found for this animal');
          throw new Error('Transaction info not found for this animal');
        }

        const sortedTransactions = currentTransactions.sort((a, b) => b.date - a.date);

        setAllAnimalTransactions(sortedTransactions);
        const latestTransaction = sortedTransactions[0];

        if (!latestTransaction) {
          console.error('No valid animal transaction data found');
          throw new Error('No valid animal transaction data found');
        }

        setAnimal(animal);
        setPrivateInfo(currentPrivateInfo);
      } catch (error) {
        console.error('Error fetching animal data:', error);
        handleToast({
          type: 'error',
          title: 'Error',
          text: 'Error al obtener los datos del animal.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnimalData();
  }, [currentId]);

  const handleDelete = async (currentId: string) => {
    try {
      if (!animal) throw new Error(`Animal with id ${currentId} not found`);

      const updatedAnimal = { ...animal, isDeleted: true, isVisible: false, isAvalible: false };
      const newTransaction: AnimalTransactionType = {
        id: currentId,
        name: animal.name,
        since: Date.now(),
        date: Date.now(),
        modifiedBy: auth.currentUser?.email || '',
        isDeleted: true,
        isVisible: false,
        isAvalible: false,
      };

      const promises = Promise.all([
        postFirestoreData<Animal>({
          data: updatedAnimal,
          currentCollection: 'animals',
          id: currentId,
        }),
        postFirestoreData<AnimalTransactionType>({
          data: newTransaction,
          currentCollection: 'animalTransactions',
        }),
      ]);
      await handlePromiseToast(promises, {
        messages: {
          pending: {
            title: 'Eliminando...',
            text: `'Por favor, espera mientras eliminamos a ${animal.name}.'`,
          },
          success: {
            title: 'Éxito',
            text: `${animal.name} ha sido eliminado correctamente.`,
          },
          error: {
            title: 'Error',
            text: `Hubo un error al eliminar a ${animal.name}.`,
          },
        },
      });

      router.push('/plam-admin/animales');
    } catch (error) {
      console.error("Error changing the animal's status:", error);
    }
  };

  const handleRestore = async (currentId: string) => {
    const start = Date.now();
    setIsLoading(true);
    try {
      const updatedAnimal = { ...animal, isDeleted: false, isVisible: false, isAvalible: false };
      const newTransactionData: AnimalTransactionType = {
        date: Date.now(),
        modifiedBy: auth.currentUser?.email || '',
        isDeleted: false,
        isVisible: false,
        isAvalible: false,
        id: currentId,
        name: animal.name,
        since: Date.now(),
      };

      const promises = Promise.all([
        postFirestoreData<Animal>({
          data: updatedAnimal,
          currentCollection: 'animals',
          id: currentId,
        }),
        postFirestoreData<AnimalTransactionType>({
          data: newTransactionData,
          currentCollection: 'animalTransactions',
        }),
      ]);

      await handlePromiseToast(promises, {
        messages: {
          pending: {
            title: 'Restaurando...',
            text: `'Por favor, espera mientras restauramos a ${animal.name}.'`,
          },
          success: {
            title: 'Éxito',
            text: `${animal.name} ha sido restaurado correctamente.`,
          },
          error: {
            title: 'Error',
            text: `Hubo un error al restaurar a ${animal.name}.`,
          },
        },
      });

      router.push('/plam-admin/animales');
    } catch (error) {
      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => {
          setIsLoading(false);
        }, remaining);
      } else {
        setIsLoading(false);
      }

      console.error("Error changing the animal's status:", error);
    } finally {
      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => {
          setIsLoading(false);
        }, remaining);
      } else {
        setIsLoading(false);
      }
    }
  };

  const handleHardDeleteSingleAnimal = async ({ animal }: { animal: Animal }) => {
    const start = Date.now();
    setIsLoading(true);
    try {
      const images = animal.images;
      for (const image of images) {
        if (image.imgId) {
          await handlePromiseToast(deleteImage(image.imgId), {
            messages: {
              pending: {
                title: 'Eliminando imagen...',
                text: `'Por favor, espera mientras eliminamos la imagen de ${animal.name}.'`,
              },
              success: {
                title: 'Éxito',
                text: `La imagen de ${animal.name} ha sido eliminada correctamente.`,
              },
              error: {
                title: 'Error',
                text: `Hubo un error al eliminar la imagen de ${animal.name}.`,
              },
            },
          });
        }
      }

      const newTransaction: AnimalTransactionType = {
        id: animal.id,
        name: animal.name,
        hardDeleted: true,
        date: Date.now(),
        since: Date.now(),
        modifiedBy: auth.currentUser?.email || '',
      };

      const promises = Promise.all([
        deleteFirestoreData({ collection: 'animals', docId: animal.id }),
        postFirestoreData<AnimalTransactionType>({
          data: newTransaction,
          currentCollection: 'animalTransactions',
        }),
      ]);
      await handlePromiseToast(promises, {
        messages: {
          pending: {
            title: 'Eliminando...',
            text: `'Por favor, espera mientras eliminamos a ${animal.name}.'`,
          },
          success: {
            title: 'Éxito',
            text: `${animal.name} ha sido eliminado correctamente.`,
          },
          error: {
            title: 'Error',
            text: `Hubo un error al eliminar a ${animal.name}.`,
          },
        },
      });

      router.push('/plam-admin/animales');
    } catch (error) {
      console.error('Error to delete animal:', error);
    } finally {
      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => {
          setIsLoading(false);
        }, remaining);
      } else {
        setIsLoading(false);
      }
    }
  };

  if (!animal.id || !privateInfo.id || !allAnimalTransactions.length) {
    return (
      <div className="flex flex-col items-center gap-8 w-full min-h-screen bg-white">
        <Hero title="cargando" />
        <section className="flex flex-col gap-4 px-9 py-4 max-w-7xl">
          <h1>cargando...</h1>
        </section>
      </div>
    );
  }

  const {
    name,
    description,
    isAvalible,
    images,
    gender,
    aproxBirthDate,
    status,
    size,
    species,
    waitingSince,
    compatibility,
    isSterilized,
  } = animal;
  const { date, modifiedBy, notes } = allAnimalTransactions[0];
  const { contactName, contacts, caseManager, vaccinations, medicalConditions } = privateInfo;
  const img =
    images?.length > 0 ? images : [{ imgUrl: '/logo300.webp', imgAlt: 'Imagen no disponible' }];
  if (isLoading) {
    return <Loader />;
  }

  const YesNoUnknownMap = {
    si: 'Sí',
    no: 'No',
    no_se: 'No sabemos',
  };
  return (
    <ProtectedRoute requiredRole="rescatista" redirectPath="/plam-admin">
      <div className="flex flex-col items-center pb-6 gap-8 w-full min-h-screen bg-white">
        <Hero imgURL={img[0].imgUrl} title={name} imgAlt={img[0].imgAlt} />
        <section className="flex flex-col lg:flex-row gap-4 py-4 w-full justify-center items-center">
          <div className="flex flex-col md:flex-row gap-4 px-9 py-4 w-full max-w-7xl">
            <div className="fflex flex-col gap-4 text-start text-black px-2 md:w-3/5">
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
                  <span className="font-normal">{`${isAvalible ? 'Disponible' : 'De momento no se puede adoptar'}`}</span>
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
                  Esperándo desde:{' '}
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
                      {YesNoUnknownMap[compatibility?.dogs]}
                    </li>
                    <li>
                      <span className="font-semibold">Con gatos:</span>{' '}
                      {YesNoUnknownMap[compatibility?.cats]}
                    </li>
                    <li>
                      <span className="font-semibold">Con niños:</span>{' '}
                      {YesNoUnknownMap[compatibility?.kids]}
                    </li>
                  </ul>
                </li>
              </ul>
              {caseManager && (
                <div className="bg-amber-sunset p-3 rounded-lg">
                  <p className="text-xl font-semibold text-green-dark">
                    Responsable del caso: <span className="font-normal">{caseManager}</span>
                  </p>
                </div>
              )}
              {(medicalConditions || (vaccinations && vaccinations.length > 0)) && (
                <div className="bg-cream-light p-3 rounded-lg flex flex-col gap-2">
                  <h3 className="text-xl font-bold text-green-dark">Información Médica:</h3>
                  {medicalConditions && (
                    <p className="text-lg font-semibold text-green-dark">
                      Patologías: <span className="font-normal">{medicalConditions}</span>
                    </p>
                  )}
                  {vaccinations && vaccinations.length > 0 && (
                    <div>
                      <p className="text-lg font-semibold text-green-dark">Vacunas:</p>
                      <ul className="list-disc pl-6 text-green-dark">
                        {vaccinations.map((vaccination, index) => (
                          <li key={`${vaccination.vaccine}-${index}`} className="font-normal">
                            {vaccination.vaccine} -{' '}
                            {new Date(vaccination.date).toLocaleDateString('es-UY', {
                              timeZone: 'UTC',
                            })}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <ul className="list-none p bg-cream-light flex flex-col gap-2 px-2 rounded-lg">
                <li className="text-xl font-semibold">
                  <span>{contactLabelMap[status]}</span>:{' '}
                  <span className="font-normal">{contactName}</span>
                </li>
                {contacts &&
                  contacts.map((contact, index) => (
                    <li
                      key={`${index}-${contact.value}`}
                      className="text-xl font-semibold capitalize"
                    >
                      {contact.type}: <span className="font-normal">{contact.value}</span>
                    </li>
                  ))}
                <li className="text-xl font-semibold">
                  Notas: <span className="font-normal">{notes}</span>
                </li>
                <li className="text-xl font-semibold">
                  Ultima actualización:{' '}
                  <span className="font-normal">{`${formatDateMMYYYY(date)} (hace ${yearsOrMonthsElapsed(date)})`}</span>
                </li>
                <li className="text-xl font-semibold">
                  Actualizado por: <span className="font-normal">{modifiedBy}</span>
                </li>
              </ul>
              <Modal buttonText="Ver historial de estados">
                <section className="flex flex-col items-center justify-around bg-amber-sunset w-full min-h-full p-4 gap-1 text-center ">
                  <h4 className="font-extrabold text-2xl  text-green-dark">Historial de estados</h4>
                  <p className="text-green-dark text-md font-bold ">
                    Este animal ha tenido los siguientes estados a lo largo del tiempo:
                  </p>
                  <ul className="flex flex-col gap-2 list-disc p-2 text-green-dark">
                    {allAnimalTransactions.map((info, index) => {
                      const date = new Date(info.date).toLocaleDateString('uy-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      });

                      return (
                        <ul
                          key={`${index}-${info.date}`}
                          className="text-xl text-start font-semibold flex flex-col gap- p-2 bg-white rounded"
                        >
                          <li className="font-semibold">
                            {' '}
                            Fecha: <span className="font-normal">{date} hs</span>
                          </li>
                          {info.modifiedBy !== undefined && (
                            <li className="font-semibold">
                              {' '}
                              Actualizado por:{' '}
                              <span className="font-normal">{info.modifiedBy}</span>
                            </li>
                          )}
                          {info.name !== undefined && (
                            <li className="font-semibold">
                              Nombre: <span className="font-normal">{info.name}</span>
                            </li>
                          )}
                          {info.description !== undefined && (
                            <li className="font-semibold">
                              Descripción: <span className="font-normal">{info.description}</span>
                            </li>
                          )}
                          {info.gender !== undefined && (
                            <li className="font-semibold">
                              Género: <span className="font-normal">{info.gender}</span>
                            </li>
                          )}
                          {info.aproxBirthDate !== undefined && (
                            <li className="font-semibold">
                              Fecha de nacimiento aproximada:{' '}
                              <span className="font-normal">{info.aproxBirthDate}</span>
                            </li>
                          )}
                          {info.isSterilized !== undefined && (
                            <li className="font-semibold">
                              Esterilizado:{' '}
                              <span className="font-normal">{`${info.isSterilized ? 'Si' : 'No'}`}</span>
                            </li>
                          )}
                          {info.lifeStage !== undefined && (
                            <li className="font-semibold">
                              Etapa de vida: <span className="font-normal">{info.lifeStage}</span>
                            </li>
                          )}
                          {info.isAvalible !== undefined && (
                            <li className="font-semibold">
                              Estado:{' '}
                              <span className="font-normal">{`${info.isAvalible ? 'Disponible' : 'No disponible'}`}</span>
                            </li>
                          )}
                          {info.isVisible !== undefined && (
                            <li className="font-semibold">
                              Mostrar:{' '}
                              <span className="font-normal">{`${info.isVisible ? 'Mostrar' : 'Ocultar'}`}</span>
                            </li>
                          )}
                          {info.isDeleted !== undefined && (
                            <li className="font-semibold">
                              Eliminado:{' '}
                              <span className="font-normal">{`${info.isDeleted ? 'Si' : 'No'}`}</span>
                            </li>
                          )}
                          {info.status !== undefined && (
                            <li className="font-semibold">
                              {' '}
                              Situación actual: <span className="font-normal">{info.status}</span>
                            </li>
                          )}
                          {info.size !== undefined && (
                            <li className="font-semibold">
                              {' '}
                              Tamaño: <span className="font-normal">{info.size}</span>
                            </li>
                          )}
                          {info.species !== undefined && (
                            <li className="font-semibold">
                              {' '}
                              Especie: <span className="font-normal">{info.species}</span>
                            </li>
                          )}
                          {info.contactName !== undefined && (
                            <li className="font-semibold">
                              {' '}
                              Contacto: <span className="font-normal">{info.contactName}</span>
                            </li>
                          )}
                          {info.caseManager !== undefined && (
                            <li className="font-semibold">
                              {' '}
                              Responsable del caso:{' '}
                              <span className="font-normal">{info.caseManager}</span>
                            </li>
                          )}
                          {info.medicalConditions !== undefined && (
                            <li className="font-semibold">
                              {' '}
                              Patologías:{' '}
                              <span className="font-normal">{info.medicalConditions}</span>
                            </li>
                          )}
                          {info.vaccinations && info.vaccinations.length > 0 && (
                            <li className="font-semibold">
                              {' '}
                              Vacunas:
                              <ul className="list-disc pl-4 font-normal">
                                {info.vaccinations.map((vaccination, vIndex) => (
                                  <li key={`${vIndex}-${vaccination.vaccine}`}>
                                    {vaccination.vaccine} -{' '}
                                    {new Date(vaccination.date).toLocaleDateString('es-UY', {
                                      timeZone: 'UTC',
                                    })}
                                  </li>
                                ))}
                              </ul>
                            </li>
                          )}
                          {info.notes !== undefined && (
                            <li className="font-semibold">
                              {' '}
                              Notas: <span className="font-normal">{info.notes}</span>
                            </li>
                          )}
                          {info.contacts &&
                            info.contacts.map((contact, index) => (
                              <li
                                key={`${index}-${contact.value}`}
                                className="text-xl font-semibold capitalize"
                              >
                                {contact.type}: <span className="font-normal">{contact.value}</span>
                              </li>
                            ))}
                        </ul>
                      );
                    })}
                  </ul>
                </section>
              </Modal>
            </div>
            <div className="w-full md:w-2/5 h-auto rounded-lg bg-amber-sunset">
              <PhotoCarrousel images={img} />
            </div>
          </div>
        </section>

        {animal.isDeleted ? (
          <section className="flex flex-col sm:flex-row gap-4 px-9 py-4 w-full max-w-7xl items-center justify-center">
            <Modal
              buttonStyles="bg-caramel-deep text-white text-3xl px-4 py-2 rounded hover:bg-amber-sunset transition duration-300"
              buttonText="Restaurar"
            >
              <section className="flex flex-col items-center justify-around bg-white w-full min-h-full p-4 gap-1 text-center text-black ">
                <h2 className="text-2xl font-bold">¿Estás seguro de que quieres restaurar?</h2>
                <article className="grid grid-rows-[1fr_auto] rounded-xl overflow-hidden shadow-lg bg-cream-light w-3/5 h-auto">
                  <div className="aspect-square">
                    <Image
                      className="w-full h-full object-cover bg-white"
                      src={animal.images[0].imgUrl}
                      alt={animal.images[0].imgAlt}
                      width={300}
                      height={300}
                    />
                  </div>
                  <div className="flex flex-col items-center justify-between gap-1 p-2">
                    <span className="uppercase text-2xl text-center font-extrabold">
                      Nombre: {animal.name}
                    </span>
                    <span className="uppercase text-2xl text-center font-extrabold">
                      Id :{animal.id}
                    </span>
                    <button
                      onClick={() => handleRestore(animal.id)}
                      className="bg-green-600 text-white text-xl px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300"
                    >
                      Sí, Restaurar
                    </button>
                  </div>
                </article>
              </section>
            </Modal>
            <Modal
              buttonStyles="bg-red-600 text-white text-3xl px-4 py-2 hover:bg-red-700 text-white rounded  transition duration-300"
              buttonText="Eliminar definitivamente"
            >
              <section className="flex flex-col items-center justify-around bg-white w-full min-h-full p-4 gap-1 text-center text-black ">
                <h2 className="text-2xl font-bold">
                  ¿Estás seguro de que quieres eliminar definitivamente este animal?
                </h2>
                <article className="grid grid-rows-[1fr_auto] rounded-xl overflow-hidden shadow-lg bg-cream-light w-3/5 h-auto">
                  <div className="aspect-square">
                    <Image
                      className="w-full h-full object-cover bg-white"
                      src={animal.images[0].imgUrl}
                      alt={animal.images[0].imgAlt}
                      width={300}
                      height={300}
                    />
                  </div>
                  <div className="flex flex-col items-center justify-between gap-1 p-2">
                    <span className="uppercase text-2xl text-center font-extrabold">
                      Nombre: {animal.name}
                    </span>
                    <span className="uppercase text-2xl text-center font-extrabold">
                      Id :{animal.id}
                    </span>
                    <button
                      onClick={() => handleHardDeleteSingleAnimal({ animal })}
                      className="bg-red-600 text-white text-xl px-4 py-2 rounded-lg hover:bg-red-700 transition duration-300"
                    >
                      Eliminar definitivamente
                    </button>
                  </div>
                </article>
              </section>
            </Modal>
          </section>
        ) : (
          <section className="flex flex-col sm:flex-row gap-4 px-9 py-4 w-full max-w-7xl items-center justify-center">
            <Link
              href={`/plam-admin/animales/editar/${animal.id}`}
              className="bg-caramel-deep text-white text-3xl px-4 py-2 rounded hover:bg-amber-sunset transition duration-300"
            >
              Editar
            </Link>
            <Modal
              buttonStyles=" bg-red-600 text-white text-3xl px-4 py-2 hover:bg-red-700 text-white rounded  transition duration-300"
              buttonText="Eliminar"
            >
              <section className="flex flex-col items-center justify-around bg-white w-full min-h-full p-4 gap-1 text-center ">
                <h2 className="text-2xl font-bold">
                  ¿Estás seguro de que quieres enviarlo a la papelera de reciclaje?
                </h2>
                <article className="grid grid-rows-[1fr_auto] rounded-xl overflow-hidden shadow-lg bg-cream-light w-3/5 h-auto">
                  <div className="aspect-square">
                    <Image
                      className="w-full h-full object-cover bg-white"
                      src={animal.images[0].imgUrl}
                      alt={animal.images[0].imgAlt}
                      width={300}
                      height={300}
                    />
                  </div>
                  <div className="flex flex-col items-center justify-between gap-1 p-2">
                    <span className="uppercase text-2xl text-center font-extrabold">
                      Nombre: {animal.name}
                    </span>
                    <span className="uppercase text-2xl text-center font-extrabold">
                      Id :{animal.id}
                    </span>
                    <button
                      onClick={() => handleDelete(animal.id)}
                      className="bg-red-600 text-white text-xl px-4 py-2 rounded-lg hover:bg-red-700 transition duration-300"
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              </section>
            </Modal>
          </section>
        )}
      </div>
    </ProtectedRoute>
  );
}
