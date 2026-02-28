import { useState } from 'react';
import { Animal, AnimalTransactionType, PrivateInfoType } from '@/types';
import { auth } from '@/firebase';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { handlePromiseToast } from '@/lib/handleToast';
import { revalidateCache } from '@/lib/revalidateCache';
import { Modal } from '@/components/Modal';
import { HeartIcon } from '@/components/Icons';
import { AnimalActionModalProps, AdoptionFormData, DEFAULT_ADOPTION_DATA } from '../types';
import { createTimestamp } from '@/lib/dateUtils';

/**
 * Modal component for registering an animal adoption.
 * Updates animal status to 'adoptado', sets availability/visibility to false,
 * and records the adopter contact information.
 */
export default function AdoptionModal({
  animal,
  privateInfo,
  setAnimal,
  setPrivateInfo,
  setAllAnimalTransactions,
}: AnimalActionModalProps): React.ReactElement {
  const [adoptionModalOpen, setAdoptionModalOpen] = useState<boolean>(false);
  const [adoptionData, setAdoptionData] = useState<AdoptionFormData>({
    ...DEFAULT_ADOPTION_DATA,
    newStatus: undefined,
  });

  const handleAdoption = async (): Promise<void> => {
    setAdoptionModalOpen(false);

    const notePrefix = '[Nota de adopción] - ';

    const updatedPrivateInfo = {
      ...privateInfo,
      contactName: adoptionData.contactName,
      contacts: adoptionData.contacts.filter((c) => c.value.trim() !== ''),
      notes: [...(privateInfo.notes || []), notePrefix + adoptionData.note],
    };

    const updatedAnimal = {
      ...animal,
      status: 'adoptado' as const,
      isAvailable: false,
      isVisible: false,
    };

    const now = createTimestamp();

    const newTransactionData: AnimalTransactionType = {
      id: privateInfo.id,
      name: privateInfo.name || '',
      img: animal.images[0],
      transactionType: 'adoption',
      date: now,
      modifiedBy: auth.currentUser?.email || 'system',
      since: now,
      status: 'adoptado',
      isAvailable: false,
      isVisible: false,
      contactName: adoptionData.contactName,
      contacts: adoptionData.contacts.filter((c) => c.value.trim() !== ''),
      changes: {
        before: {
          status: animal.status,
          isAvailable: animal.isAvailable,
          isVisible: animal.isVisible,
          contactName: privateInfo.contactName,
          contacts: privateInfo.contacts,
        },
        after: {
          status: 'adoptado',
          isAvailable: false,
          isVisible: false,
          contactName: adoptionData.contactName,
          contacts: adoptionData.contacts.filter((c) => c.value.trim() !== ''),
          notes: [notePrefix + adoptionData.note],
        },
      },
    };

    // Optimistic UI
    setAnimal(updatedAnimal);
    setPrivateInfo(updatedPrivateInfo);
    setAllAnimalTransactions((prev) => [newTransactionData, ...prev]);

    try {
      await handlePromiseToast(
        Promise.all([
          postFirestoreData<Animal>({
            data: updatedAnimal,
            currentCollection: 'animals',
            id: animal.id,
          }),
          postFirestoreData<PrivateInfoType>({
            data: updatedPrivateInfo,
            currentCollection: 'animalPrivateInfo',
            id: privateInfo.id,
          }),
          postFirestoreData<AnimalTransactionType>({
            data: newTransactionData,
            currentCollection: 'animalTransactions',
          }),
        ]),
        {
          messages: {
            pending: { title: 'Registrando adopción', text: 'Por favor espera...' },
            success: { title: 'Adopción registrada', text: 'La adopción se registró exitosamente' },
            error: { title: 'Error', text: 'No se pudo registrar la adopción' },
          },
        }
      );

      await revalidateCache('animals');

      setAdoptionData({ ...DEFAULT_ADOPTION_DATA, newStatus: undefined });
    } catch (error) {
      console.error('Error handling adoption:', error);
      setAnimal(animal);
      setPrivateInfo(privateInfo);
      setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransactionData.date));
    }
  };

  return (
    <Modal
      buttonStyles="bg-green-600 text-white text-3xl px-4 py-2 rounded hover:bg-green-700 transition duration-300"
      buttonText={
        <div className="flex flex-row gap-2 justify-center items-center">
          <HeartIcon size={24} />
          <span>Registrar Adopción</span>
        </div>
      }
      isOpen={adoptionModalOpen}
      setIsOpen={setAdoptionModalOpen}
    >
      <section className="flex flex-col items-center justify-start bg-cream-light w-full h-full p-6 gap-4 text-left overflow-y-auto">
        <h2 className="font-extrabold text-4xl sm:text-5xl text-green-dark text-center">
          Registrar Adopción
        </h2>

        <div className="w-full max-w-2xl space-y-4">
          {/* Contact Name */}
          <div>
            <label className="block text-green-dark font-semibold mb-2">
              Nombre del Adoptante *
            </label>
            <input
              type="text"
              className="w-full p-2 border-2 border-green-dark bg-white rounded-lg"
              placeholder="Nombre completo"
              value={adoptionData.contactName}
              onChange={(e) =>
                setAdoptionData((prev) => ({ ...prev, contactName: e.target.value }))
              }
            />
          </div>

          {/* Contacts */}
          <div>
            <label className="block text-green-dark font-semibold mb-2">Contactos *</label>
            {adoptionData.contacts.map((contact, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <select
                  className="p-2 border-2 border-green-dark bg-white rounded-lg"
                  value={contact.type}
                  onChange={(e) => {
                    const newContacts = [...adoptionData.contacts];
                    newContacts[index].type = e.target.value as 'celular' | 'email' | 'other';
                    setAdoptionData((prev) => ({ ...prev, contacts: newContacts }));
                  }}
                >
                  <option value="celular">Celular</option>
                  <option value="email">Email</option>
                  <option value="other">Otro</option>
                </select>
                <input
                  type="text"
                  className="flex-1 p-2 border-2 border-green-dark bg-white rounded-lg"
                  placeholder="Valor del contacto"
                  value={contact.value}
                  onChange={(e) => {
                    const newContacts = [...adoptionData.contacts];
                    newContacts[index].value = e.target.value;
                    setAdoptionData((prev) => ({ ...prev, contacts: newContacts }));
                  }}
                />
                {adoptionData.contacts.length > 1 && (
                  <button
                    className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                    onClick={() => {
                      const newContacts = adoptionData.contacts.filter((_, i) => i !== index);
                      setAdoptionData((prev) => ({ ...prev, contacts: newContacts }));
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              className="bg-green-dark text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300 mt-2"
              onClick={() => {
                setAdoptionData((prev) => ({
                  ...prev,
                  contacts: [...prev.contacts, { type: 'celular', value: '' }],
                }));
              }}
            >
              + Agregar Contacto
            </button>
          </div>

          {/* Note */}
          <div>
            <label className="block text-green-dark font-semibold mb-2">Nota de Adopción *</label>
            <textarea
              className="w-full h-32 p-2 border-2 border-green-dark bg-white rounded-lg field-sizing-content"
              placeholder="Escribe información sobre la adopción..."
              value={adoptionData.note}
              onChange={(e) => setAdoptionData((prev) => ({ ...prev, note: e.target.value }))}
            />
          </div>

          <button
            className="w-full bg-green-dark text-white text-xl px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              !adoptionData.contactName.trim() ||
              !adoptionData.note.trim() ||
              adoptionData.contacts.every((c) => !c.value.trim())
            }
            onClick={(e) => {
              e.preventDefault();
              handleAdoption();
            }}
          >
            Registrar Adopción
          </button>
        </div>
      </section>
    </Modal>
  );
}
