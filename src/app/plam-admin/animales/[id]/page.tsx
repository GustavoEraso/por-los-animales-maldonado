'use client';
import Hero from '@/components/Hero';
import { Modal } from '@/components/Modal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Animal, AnimalTransactionType } from '@/types';
import { auth } from '@/firebase';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { deleteImage } from '@/lib/deleteIgame';
import { deleteFirestoreData } from '@/lib/firebase/deleteFirestoreData';
import { handlePromiseToast } from '@/lib/handleToast';
import Loader from '@/components/Loader';
import ProtectedRoute from '@/components/ProtectedRoute';
import { EditIcon, TrashIcon, EyeIcon, CheckIcon } from '@/components/Icons';
import { revalidateCache } from '@/lib/revalidateCache';
import { createTimestamp } from '@/lib/dateUtils';

import { useAnimalDetail } from './hooks/useAnimalDetail';
import AnimalInfoSection from './components/AnimalInfoSection';
import AnimalPrivateInfoSection from './components/AnimalPrivateInfoSection';
import EventModal from './components/EventModal';
import TransitChangeModal from './components/TransitChangeModal';
import AdoptionModal from './components/AdoptionModal';
import ReturnModal from './components/ReturnModal';
import AnimalTimelineSection from './components/AnimalTimelineSection';

const MIN_LOADING_TIME = 600;

/**
 * Admin detail page for a single animal.
 * Orchestrates sub-components for info display, private info, action modals, and timeline.
 */
export default function AnimalPage(): React.ReactElement | null {
  const router = useRouter();
  const {
    animal,
    setAnimal,
    privateInfo,
    setPrivateInfo,
    allAnimalTransactions,
    setAllAnimalTransactions,
    isLoading,
    setIsLoading,
  } = useAnimalDetail();

  // --- Handlers that must remain in page (toggle, delete, restore, hard-delete) ---

  const handleVisibleToggle = async (newValue: boolean): Promise<void> => {
    if (!animal) return;
    const start = createTimestamp();
    setIsLoading(true);

    const updatedAnimal = { ...animal, isVisible: newValue };
    const now = createTimestamp();
    const newTransaction: AnimalTransactionType = {
      id: animal.id,
      name: animal.name,
      img: animal.images[0],
      transactionType: 'update',
      date: now,
      modifiedBy: auth.currentUser?.email || 'system',
      since: now,
      isVisible: newValue,
      changes: {
        before: { isVisible: animal.isVisible },
        after: { isVisible: newValue },
      },
    };

    setAnimal(updatedAnimal);
    setAllAnimalTransactions((prev) => [newTransaction, ...prev]);

    try {
      await handlePromiseToast(
        Promise.all([
          postFirestoreData<Animal>({
            data: updatedAnimal,
            currentCollection: 'animals',
            id: animal.id,
          }),
          postFirestoreData<AnimalTransactionType>({
            data: newTransaction,
            currentCollection: 'animalTransactions',
          }),
        ]),
        {
          messages: {
            pending: { title: 'Actualizando visibilidad', text: 'Por favor espera...' },
            success: {
              title: 'Visibilidad actualizada',
              text: `El animal ahora está ${newValue ? 'visible' : 'oculto'}`,
            },
            error: { title: 'Error', text: 'No se pudo actualizar la visibilidad' },
          },
        }
      );
      await revalidateCache('animals');
    } catch (error) {
      console.error('Error updating visibility:', error);
      setAnimal(animal);
      setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransaction.date));
    } finally {
      const elapsed = createTimestamp() - start;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => setIsLoading(false), remaining);
      } else {
        setIsLoading(false);
      }
    }
  };

  const handleAvailableToggle = async (newValue: boolean): Promise<void> => {
    if (!animal) return;
    const start = createTimestamp();
    setIsLoading(true);

    const updatedAnimal = { ...animal, isAvailable: newValue };
    const now = createTimestamp();
    const newTransaction: AnimalTransactionType = {
      id: animal.id,
      name: animal.name,
      img: animal.images[0],
      transactionType: 'update',
      date: now,
      modifiedBy: auth.currentUser?.email || 'system',
      since: now,
      isAvailable: newValue,
      changes: {
        before: { isAvailable: animal.isAvailable },
        after: { isAvailable: newValue },
      },
    };

    setAnimal(updatedAnimal);
    setAllAnimalTransactions((prev) => [newTransaction, ...prev]);

    try {
      await handlePromiseToast(
        Promise.all([
          postFirestoreData<Animal>({
            data: updatedAnimal,
            currentCollection: 'animals',
            id: animal.id,
          }),
          postFirestoreData<AnimalTransactionType>({
            data: newTransaction,
            currentCollection: 'animalTransactions',
          }),
        ]),
        {
          messages: {
            pending: { title: 'Actualizando disponibilidad', text: 'Por favor espera...' },
            success: {
              title: 'Disponibilidad actualizada',
              text: `El animal ahora está ${newValue ? 'disponible' : 'no disponible'}`,
            },
            error: { title: 'Error', text: 'No se pudo actualizar la disponibilidad' },
          },
        }
      );
      await revalidateCache('animals');
    } catch (error) {
      console.error('Error updating availability:', error);
      setAnimal(animal);
      setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransaction.date));
    } finally {
      const elapsed = createTimestamp() - start;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => setIsLoading(false), remaining);
      } else {
        setIsLoading(false);
      }
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!animal) return;
    try {
      const updatedAnimal = { ...animal, isDeleted: true, isVisible: false, isAvailable: false };
      const now = createTimestamp();
      const newTransaction: AnimalTransactionType = {
        id,
        name: animal.name,
        img: animal.images[0],
        transactionType: 'delete',
        since: now,
        date: now,
        modifiedBy: auth.currentUser?.email || '',
        changes: {
          before: {
            isDeleted: animal.isDeleted || false,
            isVisible: animal.isVisible,
            isAvailable: animal.isAvailable,
          },
          after: { isDeleted: true, isVisible: false, isAvailable: false },
        },
      };

      await handlePromiseToast(
        Promise.all([
          postFirestoreData<Animal>({ data: updatedAnimal, currentCollection: 'animals', id }),
          postFirestoreData<AnimalTransactionType>({
            data: newTransaction,
            currentCollection: 'animalTransactions',
          }),
        ]),
        {
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
        }
      );
      await revalidateCache('animals');
      router.push('/plam-admin/animales');
    } catch (error) {
      console.error("Error changing the animal's status:", error);
    }
  };

  const handleRestore = async (id: string): Promise<void> => {
    if (!animal) return;
    const start = createTimestamp();
    setIsLoading(true);
    try {
      const updatedAnimal = { ...animal, isDeleted: false, isVisible: false, isAvailable: false };
      const now = createTimestamp();
      const newTransactionData: AnimalTransactionType = {
        date: now,
        modifiedBy: auth.currentUser?.email || '',
        id,
        name: animal.name,
        img: animal.images[0],
        transactionType: 'update',
        since: now,
        changes: {
          before: {
            isDeleted: animal.isDeleted || false,
            isVisible: animal.isVisible,
            isAvailable: animal.isAvailable,
          },
          after: { isDeleted: false, isVisible: false, isAvailable: false },
        },
      };

      await handlePromiseToast(
        Promise.all([
          postFirestoreData<Animal>({ data: updatedAnimal, currentCollection: 'animals', id }),
          postFirestoreData<AnimalTransactionType>({
            data: newTransactionData,
            currentCollection: 'animalTransactions',
          }),
        ]),
        {
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
        }
      );
      await revalidateCache('animals');
      router.push('/plam-admin/animales');
    } catch (error) {
      console.error("Error changing the animal's status:", error);
    } finally {
      const elapsed = createTimestamp() - start;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => setIsLoading(false), remaining);
      } else {
        setIsLoading(false);
      }
    }
  };

  const handleHardDeleteSingleAnimal = async ({
    animal: animalToDelete,
  }: {
    animal: Animal;
  }): Promise<void> => {
    const start = createTimestamp();
    setIsLoading(true);
    try {
      for (const image of animalToDelete.images) {
        if (image.imgId) {
          await handlePromiseToast(deleteImage(image.imgId), {
            messages: {
              pending: {
                title: 'Eliminando imagen...',
                text: `'Por favor, espera mientras eliminamos la imagen de ${animalToDelete.name}.'`,
              },
              success: {
                title: 'Éxito',
                text: `La imagen de ${animalToDelete.name} ha sido eliminada correctamente.`,
              },
              error: {
                title: 'Error',
                text: `Hubo un error al eliminar la imagen de ${animalToDelete.name}.`,
              },
            },
          });
        }
      }

      const now = createTimestamp();
      const newTransaction: AnimalTransactionType = {
        id: animalToDelete.id,
        name: animalToDelete.name,
        img: animalToDelete.images[0],
        transactionType: 'delete',
        date: now,
        since: now,
        modifiedBy: auth.currentUser?.email || '',
        changes: {
          before: {
            name: animalToDelete.name,
            status: animalToDelete.status,
            isDeleted: animalToDelete.isDeleted || false,
            isVisible: animalToDelete.isVisible,
            isAvailable: animalToDelete.isAvailable,
            images: animalToDelete.images,
          },
          after: { hardDeleted: true },
        },
      };

      await handlePromiseToast(
        Promise.all([
          deleteFirestoreData({ collection: 'animals', docId: animalToDelete.id }),
          postFirestoreData<AnimalTransactionType>({
            data: newTransaction,
            currentCollection: 'animalTransactions',
          }),
        ]),
        {
          messages: {
            pending: {
              title: 'Eliminando...',
              text: `'Por favor, espera mientras eliminamos a ${animalToDelete.name}.'`,
            },
            success: {
              title: 'Éxito',
              text: `${animalToDelete.name} ha sido eliminado correctamente.`,
            },
            error: {
              title: 'Error',
              text: `Hubo un error al eliminar a ${animalToDelete.name}.`,
            },
          },
        }
      );
      await revalidateCache('animals');
      router.push('/plam-admin/animales');
    } catch (error) {
      console.error('Error to delete animal:', error);
    } finally {
      const elapsed = createTimestamp() - start;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => setIsLoading(false), remaining);
      } else {
        setIsLoading(false);
      }
    }
  };

  // --- Early returns ---

  if (!animal?.id || !privateInfo?.id || !allAnimalTransactions.length) {
    return (
      <div className="flex flex-col items-center gap-8 w-full min-h-screen bg-white">
        <Hero title="cargando" />
        <section className="flex flex-col gap-4 px-9 py-4 max-w-7xl">
          <h1>cargando...</h1>
        </section>
      </div>
    );
  }

  if (isLoading) {
    return <Loader />;
  }

  // --- Derived state ---

  const { name, images, status, isDeleted } = animal;
  const img =
    images?.length > 0
      ? images
      : [{ imgId: '', imgUrl: '/logo300.webp', imgAlt: 'Imagen no disponible' }];
  const isCaseClosed = status === 'adoptado' || status === 'fallecido';
  const isAdopted = status === 'adoptado';

  // --- Shared modal props ---

  const actionModalProps = {
    animal,
    privateInfo,
    setAnimal,
    setPrivateInfo,
    setAllAnimalTransactions,
  };

  return (
    <ProtectedRoute requiredRole="rescatista" redirectPath="/plam-admin">
      <div className="flex flex-col items-center pb-6 gap-8 w-full min-h-screen bg-white">
        <Hero imgURL={img[0].imgUrl} title={name} imgAlt={img[0].imgAlt} />

        {/* Animal basic info + photos */}
        <AnimalInfoSection animal={animal} images={img} />

        {/* Private info: case manager, medical, contacts, notes */}
        <AnimalPrivateInfoSection
          animal={animal}
          privateInfo={privateInfo}
          setPrivateInfo={setPrivateInfo}
          allAnimalTransactions={allAnimalTransactions}
          setAllAnimalTransactions={setAllAnimalTransactions}
        />

        {/* Deleted state: restore / hard-delete buttons */}
        {isDeleted && (
          <section className="flex flex-col sm:flex-row gap-4 px-9 py-4 w-full max-w-7xl items-center justify-center">
            <Modal
              buttonStyles="bg-caramel-deep text-white text-3xl px-4 py-2 rounded hover:bg-amber-sunset transition duration-300"
              buttonText="Restaurar"
            >
              <section className="flex flex-col items-center justify-around bg-white w-full min-h-full p-4 gap-1 text-center text-black">
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
              buttonStyles="bg-red-600 text-white text-3xl px-4 py-2 hover:bg-red-700 text-white rounded transition duration-300"
              buttonText="Eliminar definitivamente"
            >
              <section className="flex flex-col items-center justify-around bg-white w-full min-h-full p-4 gap-1 text-center text-black">
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
        )}

        {/* Active state: action modals + toggles + edit/delete bar */}
        {!isDeleted && (
          <>
            <section className="flex flex-col gap-2 px-9 py-4 w-full max-w-7xl items-center justify-center">
              {/* Action modals row */}
              <section className="flex flex-col sm:flex-row gap-4 px-9 py-4 w-full max-w-7xl items-center justify-center">
                <EventModal {...actionModalProps} />
                {!isCaseClosed && <TransitChangeModal {...actionModalProps} />}
                {isAdopted && <ReturnModal {...actionModalProps} />}
                {!isCaseClosed && <AdoptionModal {...actionModalProps} />}
              </section>

              {/* Toggles, Edit, Delete bar */}
              <section className="flex flex-col sm:flex-row gap-4 px-9 py-4 w-full max-w-7xl items-center justify-center">
                {/* Visible Toggle */}
                {!isCaseClosed && (
                  <div className="flex items-center gap-3 bg-cream-light px-4 py-3 rounded-lg shadow-sm">
                    <EyeIcon size={20} className="text-green-dark" />
                    <span className="text-sm font-semibold text-green-dark">Visible:</span>
                    <label className="flex items-center cursor-pointer" title="Cambiar visibilidad">
                      <input
                        type="checkbox"
                        onChange={() => handleVisibleToggle(!animal.isVisible)}
                        className="sr-only peer"
                        checked={animal.isVisible}
                      />
                      <div className="relative w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>
                )}

                {/* Available Toggle */}
                {!isCaseClosed && (
                  <div className="flex items-center gap-3 bg-cream-light px-4 py-3 rounded-lg shadow-sm">
                    <CheckIcon size={20} className="text-green-dark" />
                    <span className="text-sm font-semibold text-green-dark">Disponible:</span>
                    <label
                      className="flex items-center cursor-pointer"
                      title="Cambiar disponibilidad"
                    >
                      <input
                        type="checkbox"
                        onChange={() => handleAvailableToggle(!animal.isAvailable)}
                        className="sr-only peer"
                        checked={animal.isAvailable}
                      />
                      <div className="relative w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>
                )}

                <Link
                  href={`/plam-admin/animales/editar/${animal.id}`}
                  className="bg-caramel-deep text-white text-3xl px-4 py-2 rounded hover:bg-amber-sunset transition duration-300 flex items-center gap-2"
                >
                  <EditIcon size={24} />
                  Editar
                </Link>
                <Modal
                  buttonStyles=" bg-red-600 text-white text-3xl px-4 py-2 hover:bg-red-700 text-white rounded  transition duration-300"
                  buttonText={
                    <div className="flex flex-row gap-2 justify-center items-center">
                      <TrashIcon size={24} />
                      <span>Eliminar</span>
                    </div>
                  }
                >
                  <section className="flex flex-col items-center justify-around bg-white w-full min-h-full p-4 gap-1 text-center">
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
            </section>
          </>
        )}

        {/* Timeline */}
        <AnimalTimelineSection allAnimalTransactions={allAnimalTransactions} />
      </div>
    </ProtectedRoute>
  );
}
