import { useState } from 'react';
import { AnimalTransactionType, PrivateInfoType } from '@/types';
import { auth } from '@/firebase';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { handlePromiseToast } from '@/lib/handleToast';
import { Modal } from '@/components/Modal';
import { SwapIcon } from '@/components/Icons';
import { AnimalActionModalProps, TransitChangeFormData, DEFAULT_TRANSIT_DATA } from '../types';
import { createTimestamp } from '@/lib/dateUtils';

/**
 * Modal component for changing the transit caretaker of an animal.
 * Allows updating contact info and adding a note about the change.
 */
export default function TransitChangeModal({
  animal,
  privateInfo,
  setPrivateInfo,
  setAllAnimalTransactions,
}: AnimalActionModalProps): React.ReactElement {
  const [transitChangeModalOpen, setTransitChangeModalOpen] = useState<boolean>(false);
  const [transitChangeData, setTransitChangeData] =
    useState<TransitChangeFormData>(DEFAULT_TRANSIT_DATA);

  const handleTransitChange = async (): Promise<void> => {
    setTransitChangeModalOpen(false);

    const notePrefix = '[Cambio de tránsito] - ';

    const updatedPrivateInfo = {
      ...privateInfo,
      contactName: transitChangeData.contactName,
      contacts: transitChangeData.contacts.filter((c) => c.value.trim() !== ''),
      notes: [...(privateInfo.notes || []), notePrefix + transitChangeData.note],
    };

    const now = createTimestamp();

    const newTransactionData: AnimalTransactionType = {
      id: privateInfo.id,
      name: privateInfo.name || '',
      img: animal.images[0],
      transactionType: 'transit_change',
      date: now,
      modifiedBy: auth.currentUser?.email || 'system',
      since: now,
      contactName: transitChangeData.contactName,
      contacts: transitChangeData.contacts.filter((c) => c.value.trim() !== ''),
      changes: {
        before: {
          contactName: privateInfo.contactName,
          contacts: privateInfo.contacts,
        },
        after: {
          contactName: transitChangeData.contactName,
          contacts: transitChangeData.contacts.filter((c) => c.value.trim() !== ''),
          notes: [notePrefix + transitChangeData.note],
        },
      },
    };

    // Optimistic UI
    setPrivateInfo(updatedPrivateInfo);
    setAllAnimalTransactions((prev) => [newTransactionData, ...prev]);

    try {
      await handlePromiseToast(
        Promise.all([
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
            pending: { title: 'Registrando cambio', text: 'Por favor espera...' },
            success: {
              title: 'Cambio registrado',
              text: 'El cambio de tránsito se registró exitosamente',
            },
            error: { title: 'Error', text: 'No se pudo registrar el cambio' },
          },
        }
      );

      setTransitChangeData(DEFAULT_TRANSIT_DATA);
    } catch (error) {
      console.error('Error handling transit change:', error);
      setPrivateInfo(privateInfo);
      setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransactionData.date));
    }
  };

  return (
    <Modal
      buttonStyles="bg-purple-600 text-white text-3xl px-4 py-2 rounded hover:bg-purple-700 transition duration-300"
      buttonText={
        <div className="flex flex-row gap-2 justify-center items-center">
          <SwapIcon size={24} />
          <span>Cambiar Tránsito</span>
        </div>
      }
      isOpen={transitChangeModalOpen}
      setIsOpen={setTransitChangeModalOpen}
    >
      <section className="flex flex-col items-center justify-start bg-cream-light w-full h-full p-6 gap-4 text-left overflow-y-auto">
        <h2 className="font-extrabold text-4xl sm:text-5xl text-green-dark text-center">
          Cambiar Tránsito
        </h2>

        <div className="w-full max-w-2xl space-y-4">
          {/* Contact Name */}
          <div>
            <label className="block text-green-dark font-semibold mb-2">
              Nombre del Nuevo Transitorio *
            </label>
            <input
              type="text"
              className="w-full p-2 border-2 border-green-dark bg-white rounded-lg"
              placeholder="Nombre completo"
              value={transitChangeData.contactName}
              onChange={(e) =>
                setTransitChangeData((prev) => ({ ...prev, contactName: e.target.value }))
              }
            />
          </div>

          {/* Contacts */}
          <div>
            <label className="block text-green-dark font-semibold mb-2">Contactos *</label>
            {transitChangeData.contacts.map((contact, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <select
                  className="p-2 border-2 border-green-dark bg-white rounded-lg"
                  value={contact.type}
                  onChange={(e) => {
                    const newContacts = [...transitChangeData.contacts];
                    newContacts[index].type = e.target.value as 'celular' | 'email' | 'other';
                    setTransitChangeData((prev) => ({ ...prev, contacts: newContacts }));
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
                    const newContacts = [...transitChangeData.contacts];
                    newContacts[index].value = e.target.value;
                    setTransitChangeData((prev) => ({ ...prev, contacts: newContacts }));
                  }}
                />
                {transitChangeData.contacts.length > 1 && (
                  <button
                    className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                    onClick={() => {
                      const newContacts = transitChangeData.contacts.filter((_, i) => i !== index);
                      setTransitChangeData((prev) => ({ ...prev, contacts: newContacts }));
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
                setTransitChangeData((prev) => ({
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
            <label className="block text-green-dark font-semibold mb-2">Nota del Cambio *</label>
            <textarea
              className="w-full h-32 p-2 border-2 border-green-dark bg-white rounded-lg field-sizing-content"
              placeholder="Escribe información sobre el cambio de tránsito..."
              value={transitChangeData.note}
              onChange={(e) => setTransitChangeData((prev) => ({ ...prev, note: e.target.value }))}
            />
          </div>

          <button
            className="w-full bg-green-dark text-white text-xl px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              !transitChangeData.contactName.trim() ||
              !transitChangeData.note.trim() ||
              transitChangeData.contacts.every((c) => !c.value.trim())
            }
            onClick={(e) => {
              e.preventDefault();
              handleTransitChange();
            }}
          >
            Registrar Cambio
          </button>
        </div>
      </section>
    </Modal>
  );
}
