'use client';
import { useEffect, useState } from 'react';
import { Animal, Img, AnimalTransactionType, CompatibilityType, PrivateInfoType } from '@/types';
import UploadImages from '@/elements/UploadImage';
import { deleteImage } from '@/lib/deleteIgame';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { postTransactionData } from '@/lib/firebase/dashboardAnalytics';
import { useRouter, useParams } from 'next/navigation';
import { auth } from '@/firebase';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import Loader from '@/components/Loader';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { getChangedFieldsWithValues } from '@/lib/getChangedFields';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import ProtectedRoute from '@/components/ProtectedRoute';
import ParentSelectionSection from '@/components/ParentSelectionSection';
import generateId from '@/lib/generateId';
import { revalidateCache } from '@/lib/revalidateCache';

const initialAnimal: Animal = {
  id: '',
  name: '',
  gender: 'macho',
  species: 'perro',
  images: [],
  description: '',
  aproxBirthDate: Date.now(),
  lifeStage: 'cachorro',
  size: 'mediano',
  compatibility: {
    dogs: 'no_se',
    cats: 'no_se',
    kids: 'no_se',
  },
  isSterilized: 'no_se',
  isAvailable: false,
  isVisible: false,
  status: 'calle',
  waitingSince: Date.now(),
};

const initialPrivateInfo: PrivateInfoType = {
  id: '',
  name: '',
  caseManager: '',
  contactName: '',
  contacts: [],
  vaccinations: [],
  medicalConditions: '',
  notes: [''],
};

const initialTransactionInfo: AnimalTransactionType = {
  id: '',
  name: '',
  isAvailable: false,
  isVisible: false,
  status: 'transitorio',
  since: Date.now(),
  contactName: '',
  date: Date.now(),
  modifiedBy: '',
};

export default function EditAnimalForm() {
  const router = useRouter();
  const params = useParams();
  const currentId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const MIN_LOADING_TIME = 600;

  const [oldAnimal, setOldAnimal] = useState<Animal>(initialAnimal);
  const [oldPrivateInfo, setOldPrivateInfo] = useState<PrivateInfoType>(initialPrivateInfo);

  const [animal, setAnimal] = useState<Animal>(initialAnimal);
  const [privateInfo, setPrivateInfo] = useState<PrivateInfoType>(initialPrivateInfo);
  const [transactionInfo, setTransactionInfo] =
    useState<AnimalTransactionType>(initialTransactionInfo);
  const [images, setImages] = useState<Img[]>([]);
  const [motherId, setMotherId] = useState('');
  const [fatherId, setFatherId] = useState('');

  const [compatibility, setCompatibility] = useState<CompatibilityType>(
    initialAnimal.compatibility || {
      dogs: 'no_se',
      cats: 'no_se',
      kids: 'no_se',
    }
  );

  function formatMillisForInputDate(millis: number): string {
    const date = new Date(millis);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    const start = Date.now();
    const fetchAnimalData = async () => {
      try {
        if (!currentId) return null;
        const fetchedAnimal = await getFirestoreDocById<Animal>({
          currentCollection: 'animals',
          id: currentId,
        });
        if (!fetchedAnimal) {
          console.error('Animal not found');
          throw new Error('Animal not found');
        }
        const fetchedPrivateInfo = await getFirestoreDocById<PrivateInfoType>({
          currentCollection: 'animalPrivateInfo',
          id: currentId,
        });
        if (!fetchedPrivateInfo) {
          console.error('Private info not found');
          throw new Error('Private info not found');
        }
        const transactionsList = await getFirestoreData({
          currentCollection: 'animalTransactions',
          filter: [['id', '==', currentId]],
        });
        if (!transactionsList) {
          console.error('Transactions list not found');
          throw new Error('Transactions list not found');
        }
        if (!transactionsList.length) {
          console.error('Transaction info not found for this animal');
          throw new Error('Transaction info not found for this animal');
        }
        const sortedTransactions = transactionsList.sort((a, b) => b.date - a.date);
        const currentTransactionInfo = sortedTransactions[0];

        setOldAnimal(structuredClone(fetchedAnimal));
        setOldPrivateInfo(structuredClone(fetchedPrivateInfo));

        setAnimal(fetchedAnimal);
        setPrivateInfo(fetchedPrivateInfo);
        setTransactionInfo(currentTransactionInfo);

        setImages(fetchedAnimal.images || []);
        setMotherId(fetchedAnimal.motherId || '');
        setFatherId(fetchedAnimal.fatherId || '');
      } catch (error) {
        console.error('Error fetching animal data:', error);
        handleToast({
          type: 'error',
          title: 'Error',
          text: 'Hubo un error al obtener los datos del animal',
        });
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
    fetchAnimalData();
  }, [currentId]);

  useEffect(() => {
    setAnimal((prev) => ({
      ...prev,
      compatibility: compatibility,
    }));
  }, [compatibility]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setAnimal((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCompatibilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCompatibility((prev) => ({
      ...prev,
      [name]: value as 'si' | 'no' | 'no_se',
    }));
  };

  const handlePrivateInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPrivateInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [formErrors, setFormErrors] = useState({
    name: false,
    images: false,
    description: false,
  });

  const fieldErrorMessagesRecord = {
    name: 'Debes ingresar el nombre del animal.',
    images: 'No subiste ninguna imagen.',
    description: 'Falta una descripción.',
    contactName: 'Falta el nombre de contacto.',
    contacts: 'Faltan medios de contacto.',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newAnimal: Animal = {
        ...animal,
        images: images,
        ...(motherId ? { motherId } : {}),
        ...(fatherId ? { fatherId } : {}),
      };

      const animalChanges = getChangedFieldsWithValues({ oldObj: oldAnimal, newObj: newAnimal });
      const privateInfoChanges = getChangedFieldsWithValues({
        oldObj: oldPrivateInfo,
        newObj: privateInfo,
      });

      const { before: aBefore, after: aAfter } = animalChanges || {};
      const { before: pBefore, after: pAfter } = privateInfoChanges || {};

      // Merge before/after from both sources (sanitization handled centrally in `postFirestoreData`)
      const mergedChanges = {
        before: { ...(aBefore || {}), ...(pBefore || {}) },
        after: { ...(aAfter || {}), ...(pAfter || {}) },
      };
      const newTransactionInfo: AnimalTransactionType = {
        transactionType: 'update',
        transactionId: generateId(),
        id: animal.id,
        name: animal.name,
        since: transactionInfo.since,
        img: images[0] || undefined,
        date: Date.now(),
        modifiedBy: auth.currentUser?.email || '',
        changes: mergedChanges,
      };
      const errors = {
        name: newAnimal.name === '',
        images: !images.length,
        description: newAnimal.description === '',
      };

      setFormErrors(errors);

      if (errors.name) {
        handleToast({
          type: 'error',
          title: 'Ups!',
          text: fieldErrorMessagesRecord.name,
        });
      }

      if (errors.description) {
        handleToast({
          type: 'error',
          title: 'Ups!',
          text: fieldErrorMessagesRecord.description,
        });
      }

      if (errors.images) {
        handleToast({
          type: 'error',
          title: 'Ups!',
          text: fieldErrorMessagesRecord.images,
        });
      }

      if (Object.values(errors).some(Boolean)) {
        return;
      }

      const promisesList = [];

      if (Object.keys(animalChanges).length === 0 && Object.keys(privateInfoChanges).length === 0) {
        handleToast({
          type: 'info',
          title: 'Sin cambios',
          text: 'No se detectaron cambios para guardar.',
        });
        return;
      } else {
        promisesList.push(
          postTransactionData({
            data: newTransactionInfo,
            id: newTransactionInfo.transactionId!,
          })
        );
      }

      if (Object.keys(animalChanges).length > 0) {
        promisesList.push(
          postFirestoreData<Animal>({
            data: newAnimal,
            currentCollection: 'animals',
            id: animal.id,
          })
        );
      }
      if (Object.keys(privateInfoChanges).length > 0) {
        promisesList.push(
          postFirestoreData<PrivateInfoType>({
            data: privateInfo,
            currentCollection: 'animalPrivateInfo',
            id: privateInfo.id,
          })
        );
      }

      const promises = Promise.all(promisesList);
      await handlePromiseToast(promises, {
        messages: {
          pending: {
            title: `Actualizando ${animal.name}...`,
            text: `Por favor espera mientras actualizamos a ${animal.name}`,
          },
          success: {
            title: `${animal.name} actualizado`,
            text: `${animal.name} fue actualizado exitosamente`,
          },
          error: {
            title: `Hubo un error al actualizar a ${animal.name}`,
            text: `Hubo un error al actualizar a ${animal.name}`,
          },
        },
      });

      // Propagate parent changes to all litter siblings
      if (animal.litterId) {
        const motherChanged = motherId !== (oldAnimal.motherId || '');
        const fatherChanged = fatherId !== (oldAnimal.fatherId || '');

        if (motherChanged || fatherChanged) {
          const siblings = await getFirestoreData({
            currentCollection: 'animals',
            filter: [['litterId', '==', animal.litterId]],
          });

          const siblingUpdates = siblings
            .filter((s: Animal) => s.id !== animal.id)
            .map((sibling: Animal) => {
              const updateData: Partial<Animal> & { id: string } = { id: sibling.id };
              if (motherChanged) updateData.motherId = motherId || '';
              if (fatherChanged) updateData.fatherId = fatherId || '';

              return postFirestoreData<Partial<Animal> & { id: string }>({
                data: updateData,
                currentCollection: 'animals',
                id: sibling.id,
              });
            });

          if (siblingUpdates.length > 0) {
            await Promise.all(siblingUpdates);
          }
        }
      }

      // Invalidate animals cache if animal data was modified
      if (Object.keys(animalChanges).length > 0 || animal.litterId) {
        await revalidateCache('animals');
      }

      router.replace('/plam-admin/animales');
    } catch (error) {
      console.error('Error al guardar el animal:', error);
    }
  };

  const handleImageDelete = async (imgId: string) => {
    await handlePromiseToast(deleteImage(imgId), {
      messages: {
        pending: {
          title: `Eliminando imagen...`,
          text: `Por favor espera mientras eliminamos la imagen`,
        },
        success: {
          title: `Imagen eliminada`,
          text: `La imagen fue eliminada exitosamente`,
        },
        error: {
          title: `Error`,
          text: `Hubo un error al eliminar la imagen`,
        },
      },
    });
    const filteredImages = images.filter((img) => img.imgId !== imgId);
    setImages(filteredImages);
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <ProtectedRoute requiredRole="rescatista" redirectPath="/plam-admin">
      <section className="flex flex-col gap-6 justify-center items-center p-8 lg:px-32 w-full">
        <h1 className="text-4xl font-bold">Editar Animal</h1>
        <p>actualiza los datos del animal.</p>
        <form
          action="#"
          onSubmit={(e) => {
            e.preventDefault();
          }}
          autoComplete="off"
          className="flex flex-col gap-4 max-w-xl w-full"
        >
          <label className="flex flex-col font-bold gap-1">
            Nombre:
            {formErrors.name && (
              <div className="bg-red-500 text-white text-sm rounded px-2">
                {fieldErrorMessagesRecord.name}
              </div>
            )}
            <input
              className="outline-2 bg-white outline-gray-200 rounded p-2"
              type="text"
              name="name"
              value={animal.name}
              onChange={handleChange}
              required
            />
          </label>

          <label className="flex flex-col font-bold gap-1">
            Descripción:
            {formErrors.description && (
              <div className="bg-red-500 text-white text-sm rounded px-2">
                {fieldErrorMessagesRecord.description}
              </div>
            )}
            <textarea
              className="outline-2 bg-white outline-gray-200 rounded p-2 field-sizing-content"
              name="description"
              value={animal.description}
              onChange={handleChange}
            />
          </label>

          <label className="flex flex-col font-bold">
            Género:
            <select
              className="outline-2 bg-white outline-gray-200 rounded p-2"
              name="gender"
              value={animal.gender}
              onChange={handleChange}
            >
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
          </label>

          <label className="flex flex-col font-bold">
            Especie:
            <select
              className="outline-2 bg-white outline-gray-200 rounded p-2"
              name="species"
              value={animal.species}
              onChange={handleChange}
            >
              <option value="perro">Perro</option>
              <option value="gato">Gato</option>
              <option value="otros">Otros</option>
            </select>
          </label>

          <label className="flex flex-col font-bold">
            Etapa de vida:
            <select
              className="outline-2 bg-white outline-gray-200 rounded p-2"
              name="lifeStage"
              value={animal.lifeStage}
              onChange={handleChange}
            >
              <option value="cachorro">Cachorro</option>
              <option value="joven">Joven</option>
              <option value="adulto">Adulto</option>
            </select>
          </label>

          <label className="flex flex-col font-bold">
            Tamaño:
            <select
              className="outline-2 bg-white outline-gray-200 rounded p-2"
              name="size"
              value={animal.size}
              onChange={handleChange}
            >
              <option value="pequeño">Pequeño</option>
              <option value="mediano">Mediano</option>
              <option value="grande">Grande</option>
              <option value="no_se_sabe">No se sabe</option>
            </select>
          </label>
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold ">Compatibilidad:</h3>

            <label className="flex gap-2 font-bold items-center ml-6">
              <span>Perros:</span>
              <select
                className="outline-2 bg-white outline-gray-200 rounded p-2"
                name="dogs"
                value={animal.compatibility?.dogs || 'no_se'}
                onChange={(e) => handleCompatibilityChange(e)}
              >
                <option value="si">Sí</option>
                <option value="no">No</option>
                <option value="no_se">No sé</option>
              </select>
            </label>
            <label className="flex gap-2 font-bold items-center ml-6">
              <span>Gatos:</span>
              <select
                className="outline-2 bg-white outline-gray-200 rounded p-2"
                name="cats"
                value={animal.compatibility?.cats || 'no_se'}
                onChange={(e) => handleCompatibilityChange(e)}
              >
                <option value="si">Sí</option>
                <option value="no">No</option>
                <option value="no_se">No sé</option>
              </select>
            </label>
            <label className="flex gap-2 font-bold items-center ml-6">
              <span>Niños:</span>
              <select
                className="outline-2 bg-white outline-gray-200 rounded p-2"
                name="kids"
                value={animal.compatibility?.kids || 'no_se'}
                onChange={(e) => handleCompatibilityChange(e)}
              >
                <option value="si">Sí</option>
                <option value="no">No</option>
                <option value="no_se">No sé</option>
              </select>
            </label>
          </div>

          <label className="flex gap-2 font-bold items-center">
            <span>¿Está esterilizado?</span>
            <select
              className="outline-2 bg-white outline-gray-200 rounded p-2"
              name="isSterilized"
              value={animal.isSterilized || 'no_se'}
              onChange={(e) => handleChange(e)}
            >
              <option value="si">Sí</option>
              <option value="no">No</option>
              <option value="no_se">No sé</option>
            </select>
          </label>

          <label className="flex flex-col font-bold">
            Fecha de nacimiento aproximada:
            <input
              className="outline-2 bg-white outline-gray-200 rounded p-2"
              type="date"
              name="aproxBirthDate"
              value={formatMillisForInputDate(animal.aproxBirthDate)}
              onChange={(e) =>
                setAnimal((prev) => ({
                  ...prev,
                  aproxBirthDate: e.target.value ? new Date(e.target.value).getTime() : 0,
                }))
              }
            />
          </label>

          <label className="flex flex-col font-bold">
            Esperando desde:
            <input
              className="outline-2 bg-white outline-gray-200 rounded p-2"
              type="date"
              name="waitingSince"
              value={formatMillisForInputDate(animal.waitingSince)}
              onChange={(e) =>
                setAnimal((prev) => ({
                  ...prev,
                  waitingSince: e.target.value ? new Date(e.target.value).getTime() : 0,
                }))
              }
            />
          </label>

          {animal.status && (
            <section className="bg-gray-100 p-2 rounded-lg">
              <h3 className="font-semibold text-center">Datos privados del Animal</h3>
              <label className="flex flex-col font-bold gap-1">
                Responsable:
                <input
                  className="outline-2 bg-white outline-gray-200 rounded p-2"
                  type="text"
                  name="caseManager"
                  value={privateInfo.caseManager}
                  onChange={handlePrivateInfoChange}
                />
              </label>

              <label className="flex flex-col font-bold">
                Patologías:
                <textarea
                  className="outline-2 bg-white outline-gray-200 rounded p-2 field-sizing-content"
                  name="medicalConditions"
                  value={privateInfo.medicalConditions}
                  onChange={handlePrivateInfoChange}
                />
              </label>
            </section>
          )}

          <section className="flex flex-wrap gap-4 items-center justify-center">
            {images.length > 0 &&
              images.map((img) => (
                <div key={img.imgId} className="relative flex flex-col items-center">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleImageDelete(img.imgId);
                    }}
                    className="bg-white rounded-full w-8 h-8 absolute top-1 right-1 shadow"
                  >
                    X
                  </button>
                  <img
                    src={img.imgUrl}
                    alt={img.imgAlt}
                    className="w-40 h-40 object-cover rounded mb-2"
                  />
                  <span className="text-sm text-gray-500">{img.imgId}</span>
                </div>
              ))}
          </section>
          {formErrors.images && (
            <div className="bg-red-500 text-white text-sm rounded px-2">
              {fieldErrorMessagesRecord.images}
            </div>
          )}
          {images.length < 5 && (
            <UploadImages
              onImagesAdd={(newImages) => {
                setImages((prev) => [...prev, ...newImages]);
              }}
            />
          )}

          <ParentSelectionSection
            motherId={motherId}
            fatherId={fatherId}
            onMotherSelect={setMotherId}
            onFatherSelect={setFatherId}
            excludeIds={[currentId]}
          />

          {Object.values(formErrors).some(Boolean) && (
            <div className="bg-red-500 text-white p-3 rounded">
              <p>Faltan Datos:</p>
              <ul className="list-disc ml-5">
                {formErrors.name && <li>{fieldErrorMessagesRecord.name}</li>}
                {formErrors.description && <li>{fieldErrorMessagesRecord.description}</li>}
                {formErrors.images && <li>{fieldErrorMessagesRecord.images}</li>}
              </ul>
            </div>
          )}
          <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded">
            Guardar animal
          </button>
        </form>
      </section>
    </ProtectedRoute>
  );
}
