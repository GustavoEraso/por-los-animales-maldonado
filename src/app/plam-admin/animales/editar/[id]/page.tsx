'use client';
import { useEffect, useState } from 'react';
import { Animal, Img, PrivateInfo, CompatibilityType } from '@/types';
import UploadImages from '@/elements/UploadImage';
import { deleteImage } from '@/lib/deleteIgame';
import { postAnimal } from '@/lib/firebase/postAnimal';
import { postAnimalPrivateInfo } from '@/lib/firebase/postAnimalPrivateInfo';
import { useRouter, useParams } from 'next/navigation';
import { auth } from '@/firebase';
import { getFirestoreAnimalById } from '@/lib/firebase/getFirestoreAnimalById';
import { getFirestorePrivateInfoById } from '@/lib/firebase/getFirestorePrivateInfoById ';

import Loader from '@/components/Loader';


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
  status: 'calle',
  waitingSince: Date.now(),
};

const initialPrivateInfo: PrivateInfo = {
  isAvalible: false,
  isVisible: false,
  status: 'transitorio',
  since: Date.now(),
  contactName: '',
  date: Date.now(),
  modifiedBy: '',
}

export default function EditAnimalForm() {
  const router = useRouter();
  const params = useParams();
  const currentId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const MIN_LOADING_TIME = 600;


  const [animal, setAnimal] = useState<Animal>(initialAnimal);
  const [privateInfo, setPrivateInfo] = useState<PrivateInfo>(initialPrivateInfo);
  const [images, setImages] = useState<Img[]>([]);

  const [contacts, setContacts] = useState<{ type: 'celular' | 'email' | 'other'; value: string | number }[]>([]);
  const [newContact, setNewContact] = useState<{ type: 'celular' | 'email' | 'other'; value: string | number }>({ type: 'celular', value: '' });
  const [showContactForm, setShowContactForm] = useState(false);

  const [isAvalible, setIsAvalible] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  const [compatibility, setCompatibility] = useState<CompatibilityType>(initialAnimal.compatibility || {
    dogs: 'no_se',
    cats: 'no_se',
    kids: 'no_se',
  });


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
        const animal = await getFirestoreAnimalById(currentId);
        if (!animal) {
          console.error('Animal not found');
          return;
        }
        const currentPrivateInfo = await getFirestorePrivateInfoById(currentId);
        if (!currentPrivateInfo) {
          console.error('Private info not found for this animal');
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...onlyData } = currentPrivateInfo;
        const latestEntry = Object.entries(onlyData).reduce((latest, [key, data]) => {
          return data.date > latest[1].date ? [key, data] : latest;
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [dateKey, latestData] = latestEntry;

        if (!latestData) {
          console.error('No valid private info data found');
          return;
        }
        const currentData = latestData as unknown as PrivateInfo

        setAnimal(animal)
        setPrivateInfo(currentData);

        setImages(animal.images || []);
        setContacts(currentData.contacts || []);


      } catch (error) {
        console.error('Error fetching animal data:', error);
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
    }
    fetchAnimalData();

  }, [currentId]);



  useEffect(() => {
    setPrivateInfo((prev) => ({
      ...prev,
      contacts
    }));
  }, [contacts])

  useEffect(() => {
    setAnimal((prev) => ({
      ...prev,
      isAvalible: isAvalible,
    }));
    setPrivateInfo((prev) => ({
      ...prev,
      isAvalible: isAvalible,
    }));
  }, [isAvalible]);

  useEffect(() => {
    setAnimal((prev) => ({
      ...prev,
      isVisible: isVisible,
    }));
    setPrivateInfo((prev) => ({
      ...prev,
      isVisible: isVisible,
    }));
  }, [isVisible]);

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

  const handleCompatibilityChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
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
    contactName: false,
    contacts: false,
  })

  const fieldErrorMessagesRecord = {
    name: "Debes ingresar el nombre del animal.",
    images: "No subiste ninguna imagen.",
    description: "Falta una descripción.",
    contactName: "Falta el nombre de contacto.",
    contacts: "Faltan medios de contacto.",
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newAnimal: Animal = {
        ...animal,
        images: images,
        isAvalible: isAvalible,
        isVisible: isVisible,
      }


      const newPrivateInfo: PrivateInfo =
      {
        ...privateInfo,
        isAvalible: isAvalible,
        isVisible: isVisible,
        status: animal.status,
        date: Date.now(),
        modifiedBy: auth.currentUser?.email || '',
      }
      const errors = {
        name: newAnimal.name === '',
        images: !images.length,
        description: newAnimal.description === '',
        contactName: newPrivateInfo.contactName === '',
        contacts: !privateInfo?.contacts?.length,
      };

      setFormErrors(errors);

      if (Object.values(errors).some(Boolean)) {
        return;
      }

      await postAnimal({ data: newAnimal, id: animal.id })
      await postAnimalPrivateInfo({ data: newPrivateInfo, id: animal.id })

      router.replace('/plam-admin/animales')

    } catch (error) {
      console.error('Error al guardar el animal:', error);
      alert('algo salio mal')

    }
  };

  const handleImageDelete = async (imgId: string) => {
    await deleteImage(imgId)
    const filteredImages = images.filter((img) => img.imgId !== imgId);
    setImages(filteredImages);
  };

  if (isLoading) {
    return (
      <Loader />
    );
  }

  return (
    <section className='flex flex-col gap-6 justify-center items-center p-8 lg:px-32 w-full'>
      <h1 className="text-4xl font-bold">Editar Animal</h1>
      <p>actualiza los datos del animal.</p>
      <form action="#" onSubmit={(e) => { e.preventDefault() }} autoComplete='off' className="flex flex-col gap-4 max-w-xl w-full">

        <label className='flex flex-col font-bold gap-1'>
          Nombre:
          {formErrors.name && <div className='bg-red-500 text-white text-sm rounded px-2'>{fieldErrorMessagesRecord.name}</div>}
          <input className='outline-2 outline-gray-200 rounded p-2' type='text' name="name" value={animal.name} onChange={handleChange} required />
        </label>

        <label className='flex flex-col font-bold gap-1'>
          Descripción:
          {formErrors.description && <div className='bg-red-500 text-white text-sm rounded px-2'>{fieldErrorMessagesRecord.description}</div>}
          <textarea className='outline-2 outline-gray-200 rounded p-2 field-sizing-content' name="description" value={animal.description} onChange={handleChange} />
        </label>

        <label className='flex flex-col font-bold'>
          Género:
          <select className='outline-2 outline-gray-200 rounded p-2' name="gender" value={animal.gender} onChange={handleChange}>
            <option value="macho">Macho</option>
            <option value="hembra">Hembra</option>
          </select>
        </label>

        <label className='flex flex-col font-bold'>
          Especie:
          <select className='outline-2 outline-gray-200 rounded p-2' name="species" value={animal.species} onChange={handleChange}>
            <option value="perro">Perro</option>
            <option value="gato">Gato</option>
            <option value="otros">Otros</option>
          </select>
        </label>

        <label className='flex flex-col font-bold'>
          Etapa de vida:
          <select className='outline-2 outline-gray-200 rounded p-2' name="lifeStage" value={animal.lifeStage} onChange={handleChange}>
            <option value="cachorro">Cachorro</option>
            <option value="adulto">Adulto</option>
            <option value="mayor">Mayor</option>
          </select>
        </label>

        <label className='flex flex-col font-bold'>
          Tamaño:
          <select className='outline-2 outline-gray-200 rounded p-2' name="size" value={animal.size} onChange={handleChange}>
            <option value="pequeño">Pequeño</option>
            <option value="mediano">Mediano</option>
            <option value="grande">Grande</option>
          </select>
        </label>
        <div className='flex flex-col gap-4'>
          <h3 className='text-lg font-bold '>Compatibilidad:</h3>

            <label className='flex gap-2 font-bold items-center ml-6'>
              <span>Perros:</span>
              <select className='outline-2 outline-gray-200 rounded p-2' name="dogs" value={animal.compatibility?.dogs || 'no_se'} onChange={(e) => handleCompatibilityChange(e)}>
                <option value="si">Sí</option>
                <option value="no">No</option>
                <option value="no_se">No sé</option>
              </select>
            </label>
            <label className='flex gap-2 font-bold items-center ml-6'>
              <span>Gatos:</span>
              <select className='outline-2 outline-gray-200 rounded p-2' name="cats" value={animal.compatibility?.cats || 'no_se'} onChange={(e) => handleCompatibilityChange(e)}>
                <option value="si">Sí</option>
                <option value="no">No</option>
                <option value="no_se">No sé</option>
              </select>
            </label>
            <label className='flex gap-2 font-bold items-center ml-6'>
              <span>Niños:</span>
              <select className='outline-2 outline-gray-200 rounded p-2' name="kids" value={animal.compatibility?.kids || 'no_se'} onChange={(e) => handleCompatibilityChange(e)}>
                <option value="si">Sí</option>
                <option value="no">No</option>
                <option value="no_se">No sé</option>
              </select>
            </label>
          </div>
    
        <label className='flex gap-2 font-bold items-center'>
          <span>¿Está esterilizado?</span>
          <select className='outline-2 outline-gray-200 rounded p-2' name="isSterilized" value={animal.isSterilized || 'no_se'} onChange={(e) => handleChange(e)}>
            <option value="si">Sí</option>
            <option value="no">No</option>
            <option value="no_se">No sé</option>
          </select>
        </label>


        <label className='flex flex-col font-bold'>
          Fecha de nacimiento aproximada:
          <input
            className='outline-2 outline-gray-200 rounded p-2'
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

        <label className='flex flex-col font-bold'>
          Esperando desde:
          <input
            className='outline-2 outline-gray-200 rounded p-2'
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




        <label className='flex flex-col font-bold'>
          Situación actual:
          <select className='outline-2 outline-gray-200 rounded p-2' name="status" value={animal.status} onChange={(e) => { handleChange(e); handlePrivateInfoChange(e) }} >
            <option value="adoptado">Adoptado</option>
            <option value="calle">Calle</option>
            <option value="protectora">Protectora</option>
            <option value="transitorio">Transitorio</option>
          </select>
        </label>

        <label className="flex gap-2 cursor-pointer w-fit  font-bold text-balance items-center">
          <span>Disponible para adoptar:</span>
          <input type="checkbox"
            className="sr-only peer"
            defaultChecked={animal.isAvalible}
            name="isAvalible"
            onChange={(e) =>
              setIsAvalible(e.target.checked)
            } />
          <div className="relative min-w-11 w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-cream-light   peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-amber-sunset peer-checked:after:bg-caramel-deep after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-amber-sunset" />
        </label>
        <label className="flex gap-2 cursor-pointer w-fit  font-bold text-balance items-center">
          <span>Mostrar:</span>
          <input type="checkbox"
            className="sr-only peer"
            defaultChecked={animal.isVisible}
            name="isVisible"
            onChange={(e) =>
              setIsVisible(e.target.checked)
            } />
          <div className="relative min-w-11 w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-cream-light   peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-amber-sunset peer-checked:after:bg-caramel-deep after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-amber-sunset" />
        </label>


        {animal.status && (
          <section className='bg-gray-100 p-2 rounded-lg'>
            <h3 className='font-semibold text-center' >Datos privados del Animal</h3>
            <label className='flex flex-col font-bold gap-1'>
              Nombre del contacto:
              {formErrors.contactName && <div className='bg-red-500 text-white text-sm rounded px-2'>{fieldErrorMessagesRecord.contactName}</div>}
              <input
                className='outline-2 outline-gray-200 rounded p-2'
                type="text"
                name="contactName"
                defaultValue={privateInfo.contactName}
                onChange={handlePrivateInfoChange}
              />
            </label>
            <section className='flex flex-col gap-4'>
              <h2 className='text-lg font-bold'>Contactos:</h2>
              {formErrors.contacts && <div className='bg-red-500 text-white text-sm rounded px-2'>{fieldErrorMessagesRecord.contacts}</div>}

              {contacts.length > 0 && contacts.map((contact, index) => (
                <div key={`${contact.value}-${index}`} className='flex gap-2 flex-wrap'>
                  <span className='font-bold'>{contact.type}:</span>
                  <span>{contact.value}</span>
                  <button
                    className='bg-red-500 text-white px-2 rounded'
                    onClick={(e) => {
                      e.preventDefault()
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
              {showContactForm && <section className='flex flex-col gap-1 bg-cream-light w-full h-full px-2'>
                <h3 className='text-lg font-semibold'>Agregar Contacto</h3>
                <label className='flex flex-col font-bold'>
                  Tipo de contacto:
                  <select
                    className='outline-2 outline-gray-200 rounded p-2'
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
                <label className='flex flex-col font-bold'>
                  Valor del contacto:
                  <input
                    className='outline-2 outline-gray-200 rounded p-2'
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
                  className='bg-green-500 text-white px-4 py-2 rounded'
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
              }

            </section>

            <label className='flex flex-col font-bold'>
              <span>Fecha de inicio:</span>
              <p className='font-normal text-xs text-balance'>(Esta es la fecha en la que cambio el estado. Por ejemplo si estaba en transitorio y es adoptado, aca va la fecha de adopción) </p>
              <input
                className='outline-2 outline-gray-200 rounded p-2'
                type="date"
                name="since"
                defaultValue={formatMillisForInputDate(privateInfo.since)}
                onChange={(e) =>
                  setPrivateInfo((prev) => ({
                    ...prev,
                    since: e.target.value ? new Date(e.target.value).getTime() : 0,
                  }))
                }
              />
            </label>
            <label className='flex flex-col font-bold'>
              Notas:
              <textarea className='outline-2 outline-gray-200 rounded p-2 field-sizing-content' name="notes" defaultValue={privateInfo.notes} onChange={handlePrivateInfoChange} />
            </label>

          </section>
        )}

        <section className='flex flex-wrap gap-4 items-center justify-center'>

          {images.length > 0 &&
            images.map((img) => (
              <div key={img.imgId} className="relative flex flex-col items-center">
                <button onClick={(e) => { e.preventDefault(); handleImageDelete(img.imgId) }} className='bg-white rounded-full w-8 h-8 absolute top-1 right-1 shadow'>X</button>
                <img src={img.imgUrl} alt={img.imgAlt} className="w-40 h-40 object-cover rounded mb-2" />
                <span className="text-sm text-gray-500">{img.imgId}</span>
              </div>
            ))
          }
        </section>
        {formErrors.images && <div className='bg-red-500 text-white text-sm rounded px-2'>{fieldErrorMessagesRecord.images}</div>}
        {images.length < 5 &&
          <UploadImages onImagesAdd={(newImages) => {
            setImages(prev => [...prev, ...newImages]);
          }} />
        }

        {Object.values(formErrors).some(Boolean) && (
          <div className="bg-red-500 text-white p-3 rounded">
            <p>Faltan Datos:</p>
            <ul className="list-disc ml-5">
              {formErrors.name && <li>{fieldErrorMessagesRecord.name}</li>}
              {formErrors.description && <li>{fieldErrorMessagesRecord.description}</li>}
              {formErrors.images && <li>{fieldErrorMessagesRecord.images}</li>}
              {formErrors.contactName && <li>{fieldErrorMessagesRecord.contactName}</li>}
              {formErrors.contacts && <li>{fieldErrorMessagesRecord.contacts}</li>}
            </ul>
          </div>
        )}
        <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded">
          Guardar animal
        </button>
      </form>
    </section>
  );
}
