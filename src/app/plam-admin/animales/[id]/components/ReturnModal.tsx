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
 * Modal component for registering a return of an adopted animal.
 * Supports returning to transit or re-adopting to a new person.
 */
export default function ReturnModal({
  animal,
  privateInfo,
  setAnimal,
  setPrivateInfo,
  setAllAnimalTransactions,
}: AnimalActionModalProps): React.ReactElement {
  const [returnModalOpen, setReturnModalOpen] = useState<boolean>(false);
  const [adoptionData, setAdoptionData] = useState<AdoptionFormData>(DEFAULT_ADOPTION_DATA);

  const handleReturn = async (): Promise<void> => {
    setReturnModalOpen(false);

    const newStatus = adoptionData.newStatus || 'transitorio';
    const isGoingToNewAdopter = newStatus === 'adoptado';
    const notePrefix = isGoingToNewAdopter ? '[Nota de re-adopción] - ' : '[Nota de retorno] - ';

    const updatedPrivateInfo = {
      ...privateInfo,
      contactName: adoptionData.contactName,
      contacts: adoptionData.contacts.filter((c) => c.value.trim() !== ''),
      notes: [...(privateInfo.notes || []), notePrefix + adoptionData.note],
    };

    const updatedAnimal = {
      ...animal,
      status: newStatus,
      isAvailable: !isGoingToNewAdopter,
      isVisible: !isGoingToNewAdopter,
    };

    const now = createTimestamp();

    const newTransactionData: AnimalTransactionType = {
      id: privateInfo.id,
      name: privateInfo.name || '',
      img: animal.images[0],
      transactionType: isGoingToNewAdopter ? 'adoption' : 'return',
      date: now,
      modifiedBy: auth.currentUser?.email || 'system',
      since: now,
      status: newStatus,
      isAvailable: !isGoingToNewAdopter,
      isVisible: !isGoingToNewAdopter,
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
          status: newStatus,
          isAvailable: !isGoingToNewAdopter,
          isVisible: !isGoingToNewAdopter,
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
            pending: { title: 'Registrando retorno', text: 'Por favor espera...' },
            success: {
              title: isGoingToNewAdopter ? 'Re-adopción registrada' : 'Retorno registrado',
              text: isGoingToNewAdopter
                ? 'El animal fue re-adoptado exitosamente'
                : 'El retorno se registró exitosamente',
            },
            error: { title: 'Error', text: 'No se pudo registrar el retorno' },
          },
        }
      );

      await revalidateCache('animals');

      setAdoptionData(DEFAULT_ADOPTION_DATA);
    } catch (error) {
      console.error('Error handling return:', error);
      setAnimal(animal);
      setPrivateInfo(privateInfo);
      setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransactionData.date));
    }
  };

  return (
    <Modal
      buttonStyles="bg-amber-600 text-white text-3xl px-4 py-2 rounded hover:bg-amber-700 transition duration-300"
      buttonText={
        <div className="flex flex-row gap-2 justify-center items-center">
          <HeartIcon size={24} />
          <span>Registrar Retorno</span>
        </div>
      }
      isOpen={returnModalOpen}
      setIsOpen={setReturnModalOpen}
    >
      <section className="flex flex-col items-center justify-start bg-cream-light w-full h-full p-6 gap-4 text-left overflow-y-auto">
        <h2 className="font-extrabold text-4xl sm:text-5xl text-green-dark text-center">
          Registrar Retorno
        </h2>

        <div className="w-full max-w-2xl space-y-4">
          {/* New Status */}
          <div>
            <label className="block text-green-dark font-semibold mb-2">Nueva Situación *</label>
            <select
              className="w-full p-2 border-2 border-green-dark bg-white rounded-lg"
              value={adoptionData.newStatus}
              onChange={(e) =>
                setAdoptionData((prev) => ({
                  ...prev,
                  newStatus: e.target.value as 'transitorio' | 'adoptado',
                }))
              }
            >
              <option value="transitorio">Vuelve a Transitorio</option>
              <option value="adoptado">Va con Nuevo Adoptante</option>
            </select>
          </div>

          {/* Contact Name */}
          <div>
            <label className="block text-green-dark font-semibold mb-2">
              {adoptionData.newStatus === 'adoptado'
                ? 'Nombre del Nuevo Adoptante *'
                : 'Nombre del Transitorio *'}
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
            <label className="block text-green-dark font-semibold mb-2">Nota de Retorno *</label>
            <textarea
              className="w-full h-32 p-2 border-2 border-green-dark bg-white rounded-lg field-sizing-content"
              placeholder="Escribe información sobre el retorno..."
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
              handleReturn();
            }}
          >
            Registrar Retorno
          </button>
        </div>
      </section>
    </Modal>
  );
}
