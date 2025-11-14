'use client';
import { useEffect, useState } from 'react';
import { Animal, Img, AnimalTransactionType, CompatibilityType, PrivateInfoType } from '@/types';
import UploadImages from '@/elements/UploadImage';
import Loader from '@/components/Loader';
import { deleteImage } from '@/lib/deleteIgame';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { useRouter } from 'next/navigation';
import { generateAnimalId } from '@/lib/generateAnimalId';
import { auth } from '@/firebase';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import { PlusIcon } from '@/components/Icons';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import ProtectedRoute from '@/components/ProtectedRoute';

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
  isAvalible: false,
  isVisible: false,
  isDeleted: false,
  status: 'transitorio',
  waitingSince: Date.now(),
};

const initialPrivateInfo: PrivateInfoType = {
  caseManager: '',
  id: '',
  name: '',
  contactName: '',
  contacts: [],
};

const initialTransaction: AnimalTransactionType = {
  id: '',
  name: '',
  isAvalible: false,
  isVisible: false,
  isDeleted: false,
  status: 'transitorio',
  date: Date.now(),
  modifiedBy: '',
  since: Date.now(),
};

const dateOptions = [
  { label: '15 días', value: 0.5 },
  { label: '1 mes', value: 1 },
  { label: '1 mes y medio', value: 1.5 },
  { label: '2 meses', value: 2 },
  { label: '3 meses', value: 3 },
  { label: '4 meses', value: 4 },
  { label: '5 meses', value: 5 },
  { label: '6 meses', value: 6 },
  { label: '7 meses', value: 7 },
  { label: '8 meses', value: 8 },
  { label: '9 meses', value: 9 },
  { label: '10 meses', value: 10 },
  { label: '11 meses', value: 11 },
  { label: '1 año', value: 12 },
  { label: '1 año y medio', value: 18 },
  { label: '2 años', value: 24 },
  { label: '3 años', value: 36 },
  { label: '4 años', value: 48 },
  { label: '5 años', value: 60 },
  { label: '6 años', value: 72 },
  { label: '7 años', value: 84 },
  { label: '8 años', value: 96 },
  { label: '9 años', value: 108 },
  { label: '10 años', value: 120 },
  { label: '12 años', value: 144 },
  { label: '14 años', value: 168 },
];

export default function CreateAnimalForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [animal, setAnimal] = useState<Animal>(initialAnimal);
  const [privateInfo, setPrivateInfo] = useState<PrivateInfoType>(initialPrivateInfo);
  const [transaction, setTransaction] = useState<AnimalTransactionType>(initialTransaction);

  const [images, setImages] = useState<Img[]>([]);

  const [contacts, setContacts] = useState<
    { type: 'celular' | 'email' | 'other'; value: string | number }[]
  >([]);
  const [newContact, setNewContact] = useState<{
    type: 'celular' | 'email' | 'other';
    value: string | number;
  }>({ type: 'celular', value: '' });
  const [showContactForm, setShowContactForm] = useState<boolean>(false);

  const [isAvalible, setIsAvalible] = useState<boolean>(true);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  const [compatibility, setCompatibility] = useState<CompatibilityType>({
    dogs: 'no_se',
    cats: 'no_se',
    kids: 'no_se',
  });

  useEffect(() => {
    const getName = async () => {
      const email = auth.currentUser?.email;
      if (!email) return null;
      const data: { name: string } | null = await getFirestoreDocById({
        currentCollection: 'authorizedEmails',
        id: email,
      });

      if (!data) return null;
      const { name } = data;
      setPrivateInfo((prev) => ({
        ...prev,
        caseManager: name || '',
      }));
    };
    getName();
  }, [auth.currentUser?.email]);

  useEffect(() => {
    setAnimal((prev) => ({
      ...prev,
      compatibility: compatibility,
    }));
  }, [compatibility]);

  function formatMillisForInputDate(millis: number): string {
    const date = new Date(millis);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    setPrivateInfo((prev) => ({
      ...prev,
      contacts,
    }));
  }, [contacts]);

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

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const monthsToSubtract = Math.floor(Number(e.target.value));
    const fractionalPart = Number(e.target.value) % 1;
    const currentDate = new Date();

    currentDate.setMonth(currentDate.getMonth() - monthsToSubtract);

    const daysToSubtract = Math.round(fractionalPart * 30.44);
    currentDate.setDate(currentDate.getDate() - daysToSubtract);

    setAnimal((prev) => ({
      ...prev,
      aproxBirthDate: currentDate.getTime(),
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
    // contactName: false,
    // contacts: false,
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

    const MIN_LOADING_TIME = 600;
    const start = Date.now();
    try {
      setLoading(true);
      const id = await generateAnimalId(animal.name);

      const newAnimal: Animal = {
        ...animal,
        id: id,
        images: images,
        isAvalible: isAvalible,
        isVisible: isVisible,
      };
      const newPrivateInfo: PrivateInfoType = {
        ...privateInfo,
        id: id,
        name: animal.name,
      };

      const newTransaction: AnimalTransactionType = {
        ...transaction,
        id: id,
        name: animal.name,
        isAvalible: isAvalible,
        isVisible: isVisible,
        status: animal.status,
        date: Date.now(),
        modifiedBy: auth.currentUser?.email || '',
      };
      const errors = {
        name: newAnimal.name === '',
        images: !images.length,
        description: newAnimal.description === '',
        // contactName: newPrivateInfo.contactName === '',
        // contacts: !privateInfo?.contacts?.length,
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
        const elapsed = Date.now() - start;
        const remaining = MIN_LOADING_TIME - elapsed;
        if (remaining > 0) {
          setTimeout(() => {
            setLoading(false);
          }, remaining);
        } else {
          setLoading(false);
        }
        return;
      }

      const promises = Promise.all([
        postFirestoreData<Animal>({ data: newAnimal, currentCollection: 'animals', id }),
        postFirestoreData<PrivateInfoType>({
          data: newPrivateInfo,
          currentCollection: 'animalPrivateInfo',
          id,
        }),
        postFirestoreData<AnimalTransactionType>({
          data: newTransaction,
          currentCollection: 'animalTransactions',
        }),
      ]);

      await handlePromiseToast(promises, {
        messages: {
          pending: {
            title: `Subiendo a ${animal.name}...`,
            text: `Por favor espera mientras creamos a ${animal.name}`,
          },
          success: {
            title: `${animal.name} creado`,
            text: `${animal.name} fue creado exitosamente`,
          },
          error: {
            title: `Hubo un error al crear a ${animal.name}`,
            text: `Hubo un error al crear a ${animal.name}`,
          },
        },
      });
      router.replace('/plam-admin/animales');
    } catch (error) {
      console.error('Error al guardar el animal:', error);
      setLoading(false);
    } finally {
      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_TIME - elapsed;

      if (remaining > 0) {
        setTimeout(() => {
          setLoading(false);
        }, remaining);
      } else {
        setLoading(false);
      }
    }
  };

  const handleImageDelete = async (imgId: string) => {
    await handlePromiseToast(deleteImage(imgId), {
      messages: {
        pending: { title: 'Eliminando imagen...', text: 'Por favor espera...' },
        success: { title: 'Imagen eliminada', text: 'La imagen fue eliminada exitosamente' },
        error: { title: 'Error', text: 'Hubo un error al eliminar la imagen' },
      },
    });
    const filteredImages = images.filter((img) => img.imgId !== imgId);
    setImages(filteredImages);
  };

  return (
    <ProtectedRoute requiredRole="rescatista" redirectPath="/plam-admin">
      <section className="flex flex-col gap-6 justify-center items-center p-8 lg:px-32 w-full">
        <h1 className="text-4xl font-bold">Crear Animal</h1>
        <p>Aquí puedes crear un nuevo animal para la base de datos.</p>
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
              className="outline-2  bg-white outline-gray-200 rounded p-2 field-sizing-content"
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
              className="outline-2  bg-white outline-gray-200 rounded p-2"
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
            Etapa de vida (edad):
            <select
              className="outline-2  bg-white outline-gray-200 rounded p-2"
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
              <option value="no_se_sabe">No sé sabe</option>
            </select>
          </label>
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold">Compatibilidad (sociable)</h3>
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

          <label className="flex gap-2 font-bold items-center ml-6">
            <span>¿Está Castrado?</span>
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
            Edad:
            <select
              className="outline-2 bg-white outline-gray-200 rounded p-2 max-h-48 overflow-y-auto"
              name="aproxBirthDate"
              defaultValue={dateOptions[0].value}
              size={1}
              onChange={(e) => handleBirthDateChange(e)}
            >
              {dateOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {/* <label className="flex flex-col font-bold">
          Fecha de nacimiento aproximada:
          <input
            className="outline-2 outline-gray-200 rounded p-2"
            type="date"
            name="aproxBirthDate"
            disabled={true}
            value={animal.aproxBirthDate ? formatMillisForInputDate(animal.aproxBirthDate) : ''}
            onChange={(e) =>
              setAnimal((prev) => ({
                ...prev,
                aproxBirthDate: e.target.value ? new Date(e.target.value).getTime() : 0,
              }))
            }
          />
        </label> */}

          <label className="flex flex-col font-bold">
            Esperando desde:
            <input
              className="outline-2 bg-white outline-gray-200 rounded p-2"
              type="date"
              name="waitingSince"
              value={animal.waitingSince ? formatMillisForInputDate(animal.waitingSince) : ''}
              onChange={(e) =>
                setAnimal((prev) => ({
                  ...prev,
                  waitingSince: e.target.value ? new Date(e.target.value).getTime() : 0,
                }))
              }
            />
          </label>

          <label className="flex flex-col font-bold">
            Situación actual:
            <select
              className="outline-2 bg-white outline-gray-200 rounded p-2"
              name="status"
              value={animal.status}
              onChange={(e) => {
                handleChange(e);
              }}
            >
              <option value="adoptado">Adoptado</option>
              <option value="calle">Calle</option>
              <option value="protectora">Protectora</option>
              <option value="transitorio">Transitorio</option>
            </select>
          </label>

          <label className="flex gap-2 cursor-pointer w-fit  font-bold text-balance items-center">
            <span>Disponible para adoptar:</span>
            <input
              type="checkbox"
              className="sr-only peer"
              defaultChecked={animal.isAvalible}
              name="isAvalible"
              onChange={(e) => setIsAvalible(e.target.checked)}
            />
            <div className="relative min-w-11 w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-cream-light   peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-amber-sunset peer-checked:after:bg-caramel-deep after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-amber-sunset" />
          </label>
          <label className="flex gap-2 cursor-pointer w-fit  font-bold text-balance items-center">
            <span>Mostar:</span>
            <input
              type="checkbox"
              className="sr-only peer"
              defaultChecked={animal.isAvalible}
              name="isVisible"
              onChange={(e) => setIsVisible(e.target.checked)}
            />
            <div className="relative min-w-11 w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-cream-light   peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-amber-sunset peer-checked:after:bg-caramel-deep after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-amber-sunset" />
          </label>

          {animal.status && (
            <section className="flex flex-col gap-4 bg-gray-100 p-2 rounded-lg">
              <h3 className="font-semibold text-center">Datos privados del Animal</h3>
              <label className="flex flex-col font-bold gap-1">
                Responsable:
                <input
                  className="outline-2  bg-white outline-gray-200 rounded p-2"
                  type="text"
                  name="caseManager"
                  value={privateInfo.caseManager}
                  onChange={handlePrivateInfoChange}
                  required
                />
              </label>

              <label className="flex flex-col font-bold gap-1">
                Nombre del contacto (transitorio/adoptante):
                {/* {formErrors.contactName && <div className='bg-red-500 text-white text-sm rounded px-2'>{fieldErrorMessagesRecord.contactName}</div>} */}
                <input
                  className="outline-2  bg-white outline-gray-200 rounded p-2"
                  type="text"
                  name="contactName"
                  onChange={handlePrivateInfoChange}
                />
              </label>
              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-bold">Contactos:</h2>
                {/* {formErrors.contacts && <div className='bg-red-500 text-white text-sm rounded px-2'>{fieldErrorMessagesRecord.contacts}</div>} */}

                {contacts.length > 0 &&
                  contacts.map((contact, index) => (
                    <div key={`${contact.value}-${index}`} className="flex gap-2 flex-wrap">
                      <span className="font-bold">{contact.type}:</span>
                      <span>{contact.value}</span>
                      <button
                        className="bg-red-500 text-white px-2 rounded"
                        onClick={(e) => {
                          e.preventDefault();
                          setContacts((prev) => prev.filter((_, i) => i !== index));
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}

                <button
                  className={`${!showContactForm ? 'bg-green-400' : 'bg-red-400'} text-white px-4 py-2 rounded`}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowContactForm((prev) => !prev);
                  }}
                >
                  {`${!showContactForm ? 'Agregar contacto' : 'Cerrar'} `}
                </button>
                {showContactForm && (
                  <section className="flex flex-col gap-1 bg-cream-light w-full h-full px-2">
                    <h3 className="text-lg font-semibold">Agregar Contacto</h3>
                    <label className="flex flex-col font-bold">
                      Tipo de contacto:
                      <select
                        className="outline-2  bg-white outline-gray-200 rounded p-2"
                        name="contactType"
                        onChange={(e) =>
                          setNewContact((prev) => ({
                            ...prev,
                            type: e.target.value as 'celular' | 'email' | 'other',
                          }))
                        }
                      >
                        <option value="celular">Celular</option>
                        <option value="email">Email</option>
                        <option value="other">Otro</option>
                      </select>
                    </label>
                    <label className="flex flex-col font-bold">
                      Valor del contacto:
                      <input
                        className="outline-2  bg-white outline-gray-200 rounded p-2"
                        type="text"
                        name="contactValue"
                        onChange={(e) =>
                          setNewContact((prev) => ({
                            ...prev,
                            value: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <button
                      className="bg-green-500 text-white px-4 py-2 rounded"
                      onClick={(e) => {
                        e.preventDefault();
                        if (newContact.value) {
                          setContacts((prev) => [...prev, newContact]);
                          setNewContact({ type: 'email', value: '' });
                          setShowContactForm((prev) => !prev);
                        }
                      }}
                    >
                      Agregar contacto
                    </button>
                  </section>
                )}
              </section>

              <label className="flex flex-col font-bold">
                <span>Fecha de inicio:</span>
                <p className="font-normal text-xs text-balance">
                  (Esta es la fecha en la que se tomo el caso){' '}
                </p>
                <input
                  className="outline-2  bg-white outline-gray-200 rounded p-2"
                  type="date"
                  name="since"
                  defaultValue={formatMillisForInputDate(Date.now())}
                  onChange={(e) =>
                    setTransaction((prev) => ({
                      ...prev,
                      since: e.target.value ? new Date(e.target.value).getTime() : 0,
                    }))
                  }
                />
              </label>
              <label>
                <span className="font-bold">Vacunas del animal:</span>
                {privateInfo.vaccinations && privateInfo.vaccinations.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {privateInfo.vaccinations.map((vaccine, index) => (
                      <li
                        key={index}
                        className="flex gap-1 p-1 rounded justify-between items-center bg-amber-50"
                      >
                        <span>
                          {new Date(vaccine.date).toLocaleDateString('es-UY', { timeZone: 'UTC' })}{' '}
                          - {vaccine.vaccine}
                        </span>
                        <button
                          className="bg-red-500 text-white px-2 rounded"
                          onClick={(e) => {
                            e.preventDefault();
                            const updatedVaccinations =
                              privateInfo.vaccinations?.filter((_, i) => i !== index) || [];
                            setPrivateInfo((prev) => ({
                              ...prev,
                              vaccinations: updatedVaccinations,
                            }));
                          }}
                        >
                          Eliminar
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No se han registrado vacunas.</p>
                )}
              </label>
              <label>
                <span className="font-bold">Agregar Vacuna:</span>
                <div className="flex flex-col gap-2">
                  <input
                    className="outline-2  bg-white outline-gray-200 rounded p-2 w-full"
                    type="text"
                    name="vaccineName"
                    placeholder="Ej: Antirrabica"
                    id="vaccineName"
                  />
                  <div className="flex gap-2 sm:flex-row flex-col">
                    <input
                      className="outline-2  bg-white outline-gray-200 rounded p-2"
                      type="date"
                      name="vaccineDate"
                      id="vaccineDate"
                      defaultValue={formatMillisForInputDate(Date.now())}
                    />
                    <button
                      className="bg-green-500 w-full text-white px-4 py-2 rounded"
                      onClick={(e) => {
                        e.preventDefault();
                        const vaccineInput = document.getElementById(
                          'vaccineName'
                        ) as HTMLInputElement;
                        const dateInput = document.getElementById(
                          'vaccineDate'
                        ) as HTMLInputElement;
                        if (vaccineInput?.value && dateInput?.value) {
                          const newVaccine = {
                            vaccine: vaccineInput.value,
                            date: new Date(dateInput.value).getTime(),
                          };
                          setPrivateInfo((prev) => ({
                            ...prev,
                            vaccinations: prev.vaccinations
                              ? [...prev.vaccinations, newVaccine]
                              : [newVaccine],
                          }));
                          vaccineInput.value = '';
                          dateInput.value = '';
                        }
                      }}
                    >
                      Agregar registro
                    </button>
                  </div>
                </div>
              </label>
              <label className="flex flex-col font-bold">
                <span className="font-bold">Patologias del animal:</span>

                <textarea
                  className="outline-2  bg-white outline-gray-200 rounded p-2 field-sizing-content"
                  name="medicalConditions"
                  onChange={handlePrivateInfoChange}
                  placeholder='Ejemplo: "Diabetes, Epilepsia, si toma medicacion etc"'
                  value={privateInfo.medicalConditions || ''}
                />
              </label>

              <label className="flex flex-col font-bold">
                <span>Información adicional:</span>
                <textarea
                  className="outline-2  bg-white outline-gray-200 rounded p-2 field-sizing-content"
                  name="notes"
                  onChange={handlePrivateInfoChange}
                  placeholder='Ejemplo: "tiene coordinada una visita al veterinario el 15/08"'
                  value={privateInfo.notes || ''}
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

          {Object.values(formErrors).some(Boolean) && (
            <div className="bg-red-500 text-white p-3 rounded">
              <p>Faltan Datos:</p>
              <ul className="list-disc ml-5">
                {formErrors.name && <li>{fieldErrorMessagesRecord.name}</li>}
                {formErrors.description && <li>{fieldErrorMessagesRecord.description}</li>}
                {formErrors.images && <li>{fieldErrorMessagesRecord.images}</li>}
                {/* {formErrors.contactName && <li>{fieldErrorMessagesRecord.contactName}</li>} */}
                {/* {formErrors.contacts && <li>{fieldErrorMessagesRecord.contacts}</li>} */}
              </ul>
            </div>
          )}
          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <PlusIcon size={20} title="Crear animal" color="white" />
            Guardar animal
          </button>
        </form>
        {loading && <Loader />}
      </section>
    </ProtectedRoute>
  );
}
