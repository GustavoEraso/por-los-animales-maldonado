import { useEffect, useState } from 'react';
import { AnimalTransactionType, PrivateInfoType } from '@/types';
import { auth } from '@/firebase';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { postTransactionData } from '@/lib/firebase/dashboardAnalytics';
import { handlePromiseToast } from '@/lib/handleToast';
import { revalidateCache } from '@/lib/revalidateCache';
import { createAuditLog } from '@/lib/firebase/createAuditLog';
import { Modal } from '@/components/Modal';
import { EditIcon } from '@/components/Icons';
import { createTimestamp } from '@/lib/dateUtils';
import { logger } from '@/lib/logger';
import type { AnimalActionModalProps } from '../types';

interface EditContactModalProps {
  animal: AnimalActionModalProps['animal'];
  privateInfo: AnimalActionModalProps['privateInfo'];
  setPrivateInfo: AnimalActionModalProps['setPrivateInfo'];
  setAllAnimalTransactions: AnimalActionModalProps['setAllAnimalTransactions'];
}

interface FormContact {
  type: 'celular' | 'email' | 'other';
  value: string;
}

interface EditContactData {
  contactName: string;
  contacts: FormContact[];
  address: string;
  note: string;
}

const DEFAULT_DATA: EditContactData = {
  contactName: '',
  contacts: [],
  address: '',
  note: '',
};

/**
 * Modal to edit contact details (name, contacts, address) of an animal
 * without changing its status or triggering a return/re-adoption.
 */
export default function EditContactModal({
  animal,
  privateInfo,
  setPrivateInfo,
  setAllAnimalTransactions,
}: EditContactModalProps): React.ReactElement {
  const [open, setOpen] = useState<boolean>(false);
  const [data, setData] = useState<EditContactData>(DEFAULT_DATA);

  useEffect(() => {
    if (!open) return;
    setData({
      contactName: privateInfo.contactName || '',
      contacts: (privateInfo.contacts || []).map((c) => ({
        type: c.type,
        value: String(c.value || ''),
      })),
      address: privateInfo.address || '',
      note: '',
    });
  }, [open, privateInfo]);

  const handleSave = async (): Promise<void> => {
    setOpen(false);

    const notePrefix = '[Edición de contacto] - ';
    const now = createTimestamp();
    const validContacts = data.contacts.filter((c) => c.value.trim() !== '');

    const updatedPrivateInfo: PrivateInfoType = {
      ...privateInfo,
      contactName: data.contactName,
      contacts: validContacts.map((c) => ({
        type: c.type,
        value: c.value,
      })),
      address: data.address,
      notes: data.note.trim()
        ? [...(privateInfo.notes || []), notePrefix + data.note]
        : privateInfo.notes,
    };

    const newTransactionData: AnimalTransactionType = {
      id: privateInfo.id,
      name: privateInfo.name || '',
      img: animal.images?.[0],
      transactionType: 'update',
      date: now,
      modifiedBy: auth.currentUser?.email || 'system',
      since: now,
      contactName: data.contactName,
      contacts: validContacts.map((c) => ({ type: c.type, value: c.value })),
      changes: {
        before: {
          contactName: privateInfo.contactName,
          contacts: privateInfo.contacts,
          address: privateInfo.address,
        },
        after: {
          contactName: data.contactName,
          contacts: validContacts.map((c) => ({ type: c.type, value: c.value })),
          address: data.address,
          ...(data.note.trim() ? { notes: [notePrefix + data.note] } : {}),
        },
      },
    };

    setPrivateInfo(updatedPrivateInfo);
    setAllAnimalTransactions((prev) => [newTransactionData, ...prev]);

    try {
      await createAuditLog({
        type: 'animal',
        action: 'update',
        entityId: privateInfo.id,
        entityName: privateInfo.name || animal.name,
        modifiedBy: auth.currentUser?.email || 'system',
        changes: newTransactionData.changes as {
          before?: Record<string, unknown>;
          after?: Record<string, unknown>;
        },
      });
      await handlePromiseToast(
        Promise.all([
          postFirestoreData<PrivateInfoType>({
            data: updatedPrivateInfo,
            currentCollection: 'animalPrivateInfo',
            id: privateInfo.id,
          }),
          postTransactionData({ data: newTransactionData }),
        ]),
        {
          messages: {
            pending: { title: 'Guardando', text: 'Actualizando datos de contacto...' },
            success: {
              title: 'Contacto actualizado',
              text: 'Los datos se actualizaron correctamente',
            },
            error: { title: 'Error', text: 'No se pudieron actualizar los datos' },
          },
        }
      );

      await revalidateCache('animals');
      setData(DEFAULT_DATA);
    } catch (error) {
      logger({
        level: 'error',
        code: 'EDIT_CONTACT',
        message: 'Error updating contact:',
        data: error,
      });
      setPrivateInfo(privateInfo);
      setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransactionData.date));
    }
  };

  return (
    <Modal
      buttonStyles="bg-blue-600 text-white text-xl px-4 py-2 rounded hover:bg-blue-700 transition duration-300"
      buttonText={
        <div className="flex flex-row gap-2 justify-center items-center">
          <EditIcon size={20} />
          <span>Editar Contacto</span>
        </div>
      }
      isOpen={open}
      setIsOpen={setOpen}
    >
      <section className="flex flex-col items-center justify-start bg-cream-light w-full h-full p-6 gap-4 text-left overflow-y-auto">
        <h2 className="font-extrabold text-4xl sm:text-5xl text-green-dark text-center">
          Editar Contacto
        </h2>

        <div className="w-full max-w-2xl space-y-4">
          <div>
            <label className="block text-green-dark font-semibold mb-2">
              Nombre del contacto *
            </label>
            <input
              type="text"
              className="w-full p-2 border-2 border-green-dark bg-white rounded-lg"
              placeholder="Nombre completo"
              value={data.contactName}
              onChange={(e) => setData((prev) => ({ ...prev, contactName: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-green-dark font-semibold mb-2">Contactos</label>
            {data.contacts.map((contact, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <select
                  className="p-2 border-2 border-green-dark bg-white rounded-lg"
                  value={contact.type}
                  onChange={(e) => {
                    const newContacts = [...data.contacts];
                    newContacts[index].type = e.target.value as 'celular' | 'email' | 'other';
                    setData((prev) => ({ ...prev, contacts: newContacts }));
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
                    const newContacts = [...data.contacts];
                    newContacts[index].value = e.target.value;
                    setData((prev) => ({ ...prev, contacts: newContacts }));
                  }}
                />
                <button
                  className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                  onClick={() => {
                    setData((prev) => ({
                      ...prev,
                      contacts: prev.contacts.filter((_, i) => i !== index),
                    }));
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              className="bg-green-dark text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300 mt-2"
              onClick={() => {
                setData((prev) => ({
                  ...prev,
                  contacts: [...prev.contacts, { type: 'celular' as const, value: '' }],
                }));
              }}
            >
              + Agregar Contacto
            </button>
          </div>

          <div>
            <label className="block text-green-dark font-semibold mb-2">Dirección</label>
            <input
              type="text"
              className="w-full p-2 border-2 border-green-dark bg-white rounded-lg"
              placeholder="Dirección"
              value={data.address}
              onChange={(e) => setData((prev) => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-green-dark font-semibold mb-2">Nota (opcional)</label>
            <textarea
              className="w-full h-24 p-2 border-2 border-green-dark bg-white rounded-lg field-sizing-content"
              placeholder="Ej: Cambió el teléfono el 15/08..."
              value={data.note}
              onChange={(e) => setData((prev) => ({ ...prev, note: e.target.value }))}
            />
          </div>

          <button
            className="w-full bg-green-dark text-white text-xl px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!data.contactName.trim()}
            onClick={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            Guardar Cambios
          </button>
        </div>
      </section>
    </Modal>
  );
}
