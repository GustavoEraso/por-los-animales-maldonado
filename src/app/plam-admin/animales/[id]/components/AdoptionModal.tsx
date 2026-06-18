import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Animal, AnimalTransactionType, GoogleFormEntry, PrivateInfoType } from '@/types';
import { auth } from '@/firebase';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { postTransactionData } from '@/lib/firebase/dashboardAnalytics';
import { handlePromiseToast } from '@/lib/handleToast';
import { revalidateCache } from '@/lib/revalidateCache';
import { Modal } from '@/components/Modal';
import { HeartIcon } from '@/components/Icons';
import { AnimalActionModalProps, AdoptionFormData, DEFAULT_ADOPTION_DATA } from '../types';
import { createTimestamp } from '@/lib/dateUtils';
import { logger } from '@/lib/logger';

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

  // Form selector state
  const [formsForAnimal, setFormsForAnimal] = useState<GoogleFormEntry[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [showOtherForms, setShowOtherForms] = useState(false);
  const [otherForms, setOtherForms] = useState<GoogleFormEntry[]>([]);
  const [otherFormsLoading, setOtherFormsLoading] = useState(false);

  // Fetch forms approved for this animal when modal opens
  useEffect(() => {
    if (!adoptionModalOpen) return;

    const fetchForms = async () => {
      setFormsLoading(true);
      try {
        const data = await getFirestoreData({
          currentCollection: 'googleForms',
          filter: [['approvedAnimalId', '==', animal.id]],
        });
        setFormsForAnimal(
          (data as GoogleFormEntry[]).filter((f) => f.status === 'approved')
        );
      } catch (error) {
        logger({ level: 'error', code: 'FETCH_FORMS_ERROR', message: 'Error fetching forms for adoption:', data: error });
      } finally {
        setFormsLoading(false);
      }
    };

    setShowOtherForms(false);
    setOtherForms([]);
    fetchForms();
  }, [adoptionModalOpen, animal.id]);

  // Fetch other approved forms when toggled
  const handleShowOtherForms = async () => {
    if (showOtherForms) {
      setShowOtherForms(false);
      setOtherForms([]);
      return;
    }

    setShowOtherForms(true);
    setOtherFormsLoading(true);
    try {
      const data = await getFirestoreData({
        currentCollection: 'googleForms',
        filter: [['status', '==', 'approved']],
      });
      setOtherForms(
        (data as GoogleFormEntry[]).filter(
          (f) => f.approvedAnimalId !== animal.id
        )
      );
    } catch (error) {
      logger({ level: 'error', code: 'FETCH_OTHER_FORMS_ERROR', message: 'Error fetching other forms:', data: error });
    } finally {
      setOtherFormsLoading(false);
    }
  };

  const selectForm = (form: GoogleFormEntry) => {
    setAdoptionData((prev) => ({
      ...prev,
      contactName: form.fullName || prev.contactName,
      contacts: form.phone
        ? [{ type: 'celular' as const, value: form.phone }]
        : prev.contacts,
      selectedFormId: form.id,
      selectedFormName: form.fullName || form.id,
    }));
  };

  const clearFormSelection = () => {
    setAdoptionData((prev) => ({
      ...prev,
      selectedFormId: undefined,
      selectedFormName: undefined,
    }));
  };

  const handleAdoption = async (): Promise<void> => {
    setAdoptionModalOpen(false);

    const notePrefix = '[Nota de adopción] - ';

    const updatedPrivateInfo: PrivateInfoType = {
      ...privateInfo,
      contactName: adoptionData.contactName,
      contacts: adoptionData.contacts.filter((c) => c.value.trim() !== ''),
      notes: [...(privateInfo.notes || []), notePrefix + adoptionData.note],
      ...(adoptionData.selectedFormId
        ? {
            adoptionFormId: adoptionData.selectedFormId,
            adoptionFormName: adoptionData.selectedFormName,
          }
        : {}),
    };

    const updatedAnimal = {
      ...animal,
      status: 'adoptado' as const,
      isAvailable: false,
      isVisible: false,
    };

    const now = createTimestamp();

    const newTransactionData: AnimalTransactionType & {
      adoptionFormId?: string;
      adoptionFormName?: string;
    } = {
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
      ...(adoptionData.selectedFormId
        ? {
            adoptionFormId: adoptionData.selectedFormId,
            adoptionFormName: adoptionData.selectedFormName,
          }
        : {}),
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
          postTransactionData({
            data: newTransactionData,
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
      logger({ level: 'error', code: 'ADOPTION_ERROR', message: 'Error handling adoption:', data: error });
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
          {/* Form selector */}
          <div className="border-2 border-green-dark rounded-lg p-4 bg-white">
            <label className="block text-green-dark font-semibold mb-2">
              Formulario de adopción
            </label>

            {/* Selected form badge */}
            {adoptionData.selectedFormId && (
              <div className="mb-3 flex items-center gap-2 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <span className="text-green-700 font-medium">✓</span>
                <span className="text-green-800 truncate flex-1">
                  {adoptionData.selectedFormName}
                </span>
                <Link
                  href={`/plam-admin/formularios/${adoptionData.selectedFormId}`}
                  className="text-green-600 hover:text-green-800 underline shrink-0"
                >
                  Ver
                </Link>
                <button
                  onClick={clearFormSelection}
                  className="text-red-600 hover:text-red-800 underline text-xs shrink-0"
                >
                  Quitar
                </button>
              </div>
            )}

            {/* Forms approved for this animal */}
            <p className="text-xs text-gray-500 mb-1">
              Aprobados para {animal.name}:
            </p>
            {formsLoading ? (
              <p className="text-xs text-gray-400 py-1">Cargando...</p>
            ) : formsForAnimal.length === 0 ? (
              <p className="text-xs text-gray-400 py-1">Sin formularios</p>
            ) : (
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto mb-2">
                {formsForAnimal.map((form) => (
                  <button
                    key={form.id}
                    type="button"
                    onClick={() => selectForm(form)}
                    className={`text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      adoptionData.selectedFormId === form.id
                        ? 'bg-green-100 border border-green-300'
                        : 'bg-gray-50 border border-gray-200 hover:bg-green-50 hover:border-green-200'
                    }`}
                  >
                    <p className="font-medium text-gray-900 truncate">
                      {form.fullName ?? '—'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(form.createdAt).toLocaleDateString('es-UY', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* Toggle other forms */}
            {!showOtherForms ? (
              <button
                type="button"
                onClick={handleShowOtherForms}
                className="text-xs text-green-600 hover:text-green-800 underline"
              >
                Ver otros formularios aprobados...
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleShowOtherForms}
                  className="text-xs text-green-600 hover:text-green-800 underline mb-2 block"
                >
                  Ocultar otros formularios
                </button>
                {otherFormsLoading ? (
                  <p className="text-xs text-gray-400 py-1">Cargando...</p>
                ) : otherForms.length === 0 ? (
                  <p className="text-xs text-gray-400 py-1">
                    No hay otros formularios aprobados
                  </p>
                ) : (
                  <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                    {otherForms.map((form) => (
                      <button
                        key={form.id}
                        type="button"
                        onClick={() => selectForm(form)}
                        className={`text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                          adoptionData.selectedFormId === form.id
                            ? 'bg-green-100 border border-green-300'
                            : 'bg-gray-50 border border-gray-200 hover:bg-green-50 hover:border-green-200'
                        }`}
                      >
                        <p className="font-medium text-gray-900 truncate">
                          {form.fullName ?? '—'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {form.approvedAnimalName
                            ? `Aprobado para: ${form.approvedAnimalName}`
                            : 'Solo aprobado'}{' '}
                          ·{' '}
                          {new Date(form.createdAt).toLocaleDateString('es-UY', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

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
