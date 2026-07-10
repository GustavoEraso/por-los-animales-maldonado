import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Animal, AnimalTransactionType, PrivateInfoType, UserType } from '@/types';
import { auth } from '@/firebase';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { postTransactionData } from '@/lib/firebase/dashboardAnalytics';
import { handlePromiseToast } from '@/lib/handleToast';
import { postNewAnimalNote } from '@/lib/firebase/postAnimalNote';
import { createAuditLog } from '@/lib/firebase/createAuditLog';
import { Modal } from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import EditContactModal from './EditContactModal';
import { EditIcon, TrashIcon, PlusIcon } from '@/components/Icons';
import { contactLabelMap, getRescueReasonLabel } from '@/lib/constants/animalLabels';
import { createTimestamp } from '@/lib/dateUtils';
import { logger } from '@/lib/logger';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { normalizeManager } from '@/lib/data/seguimientos';

interface AnimalPrivateInfoSectionProps {
  animal: Animal;
  privateInfo: PrivateInfoType;
  setPrivateInfo: React.Dispatch<React.SetStateAction<PrivateInfoType | null>>;
  allAnimalTransactions: AnimalTransactionType[];
  setAllAnimalTransactions: React.Dispatch<React.SetStateAction<AnimalTransactionType[]>>;
}

/**
 * Displays the private information section of an animal detail page.
 * Includes case manager, rescue reason, medical info, vaccinations,
 * contacts, and notes with inline edit/delete capabilities.
 */
export default function AnimalPrivateInfoSection({
  animal,
  privateInfo,
  setPrivateInfo,
  setAllAnimalTransactions,
}: AnimalPrivateInfoSectionProps): React.ReactElement {
  const [newNote, setNewNote] = useState<string>('');
  const [addNoteModalOpen, setAddNoteModalOpen] = useState<boolean>(false);
  const [editingNotes, setEditingNotes] = useState<Set<number>>(new Set());
  const noteRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});
  const originalNoteValues = useRef<Record<number, string>>({});
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);

  // Mini-modal states for editing managers
  const [editCaseManagerOpen, setEditCaseManagerOpen] = useState(false);
  const [editFollowUpManagerOpen, setEditFollowUpManagerOpen] = useState(false);
  const [selectedCaseManagers, setSelectedCaseManagers] = useState<string[]>([]);
  const [selectedFollowUpManagers, setSelectedFollowUpManagers] = useState<string[]>([]);
  const [otherManagerInput, setOtherManagerInput] = useState('');
  const [caseManagerOpen, setCaseManagerOpen] = useState(false);
  const [followUpManagerOpen, setFollowUpManagerOpen] = useState(false);

  const caseManagerRef = useRef<HTMLDivElement>(null);
  const followUpManagerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (caseManagerRef.current && !caseManagerRef.current.contains(e.target as Node)) {
        setCaseManagerOpen(false);
      }
      if (followUpManagerRef.current && !followUpManagerRef.current.contains(e.target as Node)) {
        setFollowUpManagerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch authorized users to resolve names from emails
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getFirestoreData({
          currentCollection: 'authorizedEmails',
        });
        setUsers(data as UserType[]);
      } catch (error) {
        logger({
          level: 'error',
          code: 'FETCH_USERS_INFO',
          message: 'Error fetching users for display:',
          data: error,
        });
      }
    };
    fetchUsers();
  }, []);

  /** Resolve a user email to their display name, falling back to the email itself */
  const getUserName = (email: string): string => {
    return users.find((u) => u.id === email)?.name ?? email;
  };

  /** Check if any manager in the list is a custom name (not an email from the user list) */
  const hasCustomManager = (emails: string[] | undefined): boolean => {
    if (!emails || emails.length === 0) return false;
    return emails.some((e) => !e.includes('@'));
  };

  /** Resolve manager emails to display names, joined by comma */
  const getManagerNames = (emails: string[] | undefined): string => {
    if (!emails || emails.length === 0) return 'Sin asignar';
    return emails.map((e) => getUserName(e)).join(', ');
  };

  const toggleManager = (
    email: string,
    selected: string[],
    setter: (v: string[]) => void
  ): void => {
    if (selected.includes(email)) {
      setter(selected.filter((e) => e !== email));
    } else {
      setter([...selected, email]);
    }
  };

  const handleSaveCaseManager = async (): Promise<void> => {
    setEditCaseManagerOpen(false);
    const current = normalizeManager(privateInfo.caseManager);
    const updated = [...new Set(selectedCaseManagers)].filter(Boolean);
    if (updated.join(',') === current.join(',')) return;

    const now = createTimestamp();
    const newPI: PrivateInfoType = { ...privateInfo, caseManager: updated };
    const tx: AnimalTransactionType = {
      id: privateInfo.id,
      name: privateInfo.name || '',
      img: animal.images[0],
      transactionType: 'update',
      date: now,
      modifiedBy: auth.currentUser?.email || 'system',
      since: now,
      changes: { before: { caseManager: current }, after: { caseManager: updated } },
    };

    setPrivateInfo(newPI);
    setAllAnimalTransactions((prev) => [tx, ...prev]);

    try {
      await createAuditLog({
        type: 'animal',
        action: 'update',
        entityId: privateInfo.id,
        entityName: privateInfo.name || animal.name,
        modifiedBy: auth.currentUser?.email || 'system',
        changes: tx.changes as {
          before?: Record<string, unknown>;
          after?: Record<string, unknown>;
        },
      });
      await handlePromiseToast(
        Promise.all([
          postFirestoreData<PrivateInfoType>({
            data: newPI,
            currentCollection: 'animalPrivateInfo',
            id: privateInfo.id,
          }),
          postTransactionData({ data: tx }),
        ]),
        {
          messages: {
            pending: { title: 'Guardando', text: 'Actualizando responsable...' },
            success: { title: 'Actualizado', text: 'Responsable actualizado correctamente' },
            error: { title: 'Error', text: 'No se pudo actualizar' },
          },
        }
      );
    } catch (error) {
      logger({
        level: 'error',
        code: 'UPDATE_CASE_MANAGER',
        message: 'Error updating case manager:',
        data: error,
      });
      setPrivateInfo(privateInfo);
      setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== tx.date));
    }
  };

  const handleSaveFollowUpManager = async (): Promise<void> => {
    setEditFollowUpManagerOpen(false);
    const current = normalizeManager(privateInfo.followUpManager);
    const updated = [...new Set(selectedFollowUpManagers)].filter(Boolean);
    if (updated.join(',') === current.join(',')) return;

    const now = createTimestamp();
    const newPI: PrivateInfoType = { ...privateInfo, followUpManager: updated };
    const tx: AnimalTransactionType = {
      id: privateInfo.id,
      name: privateInfo.name || '',
      img: animal.images[0],
      transactionType: 'update',
      date: now,
      modifiedBy: auth.currentUser?.email || 'system',
      since: now,
      changes: { before: { followUpManager: current }, after: { followUpManager: updated } },
    };

    setPrivateInfo(newPI);
    setAllAnimalTransactions((prev) => [tx, ...prev]);

    try {
      await createAuditLog({
        type: 'animal',
        action: 'update',
        entityId: privateInfo.id,
        entityName: privateInfo.name || animal.name,
        modifiedBy: auth.currentUser?.email || 'system',
        changes: tx.changes as {
          before?: Record<string, unknown>;
          after?: Record<string, unknown>;
        },
      });
      await handlePromiseToast(
        Promise.all([
          postFirestoreData<PrivateInfoType>({
            data: newPI,
            currentCollection: 'animalPrivateInfo',
            id: privateInfo.id,
          }),
          postTransactionData({ data: tx }),
        ]),
        {
          messages: {
            pending: { title: 'Guardando', text: 'Actualizando responsable...' },
            success: { title: 'Actualizado', text: 'Responsable actualizado correctamente' },
            error: { title: 'Error', text: 'No se pudo actualizar' },
          },
        }
      );
    } catch (error) {
      logger({
        level: 'error',
        code: 'UPDATE_FOLLOWUP_MANAGER',
        message: 'Error updating follow-up manager:',
        data: error,
      });
      setPrivateInfo(privateInfo);
      setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== tx.date));
    }
  };

  const filteredUsers = users.filter((u) => u.role !== 'user');

  const {
    contactName,
    contacts,
    caseManager,
    vaccinations,
    medicalConditions,
    notes,
    rescueReason,
  } = privateInfo;

  const { status } = animal;

  /** Toggle note editing and save changes on toggle off */
  const handleNoteEditToggle = async (index: number, isEditing: boolean): Promise<void> => {
    if (isEditing) {
      const originalNote = originalNoteValues.current[index];
      const editedNote = privateInfo.notes?.[index];
      const now = createTimestamp();

      const newTransactionData: AnimalTransactionType = {
        id: privateInfo.id,
        name: privateInfo.name || '',
        transactionType: 'note',
        img: animal.images[0],
        date: now,
        modifiedBy: auth.currentUser?.email || 'system',
        since: now,
        changes: {
          before: { notes: [originalNote || ''] },
          after: { notes: [editedNote || ''] },
        },
      };

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
              data: privateInfo,
              currentCollection: 'animalPrivateInfo',
              id: privateInfo.id,
            }),
            postTransactionData({
              data: newTransactionData,
            }),
          ]),
          {
            messages: {
              pending: { title: 'Guardando', text: 'Guardando cambios...' },
              success: { title: 'Guardado', text: 'Nota actualizada exitosamente' },
              error: { title: 'Error', text: 'No se pudo actualizar la nota' },
            },
          }
        );

        delete originalNoteValues.current[index];
      } catch (error) {
        logger({
          level: 'error',
          code: 'UPDATE_NOTE',
          message: 'Error updating note:',
          data: error,
        });
        setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransactionData.date));
      }
    }

    setEditingNotes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        originalNoteValues.current[index] = privateInfo.notes?.[index] || '';
        next.add(index);
        setTimeout(() => noteRefs.current[index]?.focus(), 0);
      }
      return next;
    });
  };

  /** Handle note text content change */
  const handleNoteChange = (index: number, value: string): void => {
    setPrivateInfo((prev) => {
      if (!prev) return prev;
      const updatedNotes = [...(prev.notes || [])];
      updatedNotes[index] = value;
      return { ...prev, notes: updatedNotes };
    });
  };

  /** Handle note deletion with optimistic UI */
  const handleNoteDelete = async (index: number): Promise<void> => {
    const deletedNote = privateInfo.notes?.[index];
    const updatedNotes = privateInfo.notes?.filter((_, i) => i !== index);
    setPrivateInfo((prev) => (prev ? { ...prev, notes: updatedNotes } : prev));
    const now = createTimestamp();

    const newTransactionData: AnimalTransactionType = {
      id: privateInfo.id,
      name: privateInfo.name || '',
      img: animal.images[0],
      transactionType: 'note',
      date: now,
      modifiedBy: auth.currentUser?.email || 'system',
      since: now,
      changes: {
        before: { notes: [deletedNote || ''] },
      },
    };

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
            data: { ...privateInfo, notes: updatedNotes },
            currentCollection: 'animalPrivateInfo',
            id: privateInfo.id,
          }),
          postTransactionData({
            data: newTransactionData,
          }),
        ]),
        {
          messages: {
            pending: { title: 'Eliminando', text: 'Eliminando nota...' },
            success: { title: 'Eliminada', text: 'Nota eliminada exitosamente' },
            error: { title: 'Error', text: 'No se pudo eliminar la nota' },
          },
        }
      );
    } catch (error) {
      logger({ level: 'error', code: 'DELETE_NOTE', message: 'Error deleting note:', data: error });
      setPrivateInfo((prev) =>
        prev ? { ...prev, notes: [...(prev.notes || []), deletedNote || ''] } : prev
      );
      setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransactionData.date));
    }

    setConfirmDeleteIndex(null);
  };

  /** Handle adding a new note with optimistic UI */
  const handleAddNote = async (): Promise<void> => {
    const noteToAdd = newNote;
    setAddNoteModalOpen(false);
    const now = createTimestamp();

    const newTransactionData: AnimalTransactionType = {
      id: privateInfo.id,
      name: privateInfo.name || '',
      img: animal.images[0],
      transactionType: 'note',
      date: now,
      modifiedBy: auth.currentUser?.email || 'system',
      since: now,
      changes: {
        after: { notes: [noteToAdd] },
      },
    };

    setPrivateInfo((prev) =>
      prev ? { ...prev, notes: [...(prev.notes || []), noteToAdd] } : prev
    );
    setAllAnimalTransactions((prev) => [newTransactionData, ...prev]);
    setNewNote('');

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
        postNewAnimalNote({
          animalId: animal.id,
          note: noteToAdd,
        }),
        {
          messages: {
            pending: { title: 'Agregando nota', text: 'Por favor espera...' },
            success: { title: 'Nota agregada', text: 'La nota se agregó exitosamente' },
            error: { title: 'Error', text: 'No se pudo agregar la nota' },
          },
        }
      );
    } catch (error) {
      logger({ level: 'error', code: 'ADD_NOTE', message: 'Error adding note:', data: error });
      setPrivateInfo((prev) =>
        prev ? { ...prev, notes: (prev.notes || []).filter((n) => n !== noteToAdd) } : prev
      );
      setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransactionData.date));
      setNewNote(noteToAdd);
    }
  };

  return (
    <>
      <section className="w-full flex flex-col gap-1 max-w-7xl shrink-0 p-4">
        {caseManager && caseManager.length > 0 && (
          <div className="bg-amber-sunset p-3 rounded-lg flex items-center justify-between">
            <p className="text-xl font-semibold text-green-dark">
              Responsable del caso:{' '}
              <span className="font-normal">{getManagerNames(normalizeManager(caseManager))}</span>
              {hasCustomManager(normalizeManager(caseManager)) && (
                <span className="text-xs text-amber-700 ml-2">
                  Conviene seleccionar de la lista
                </span>
              )}
            </p>
            <button
              className="bg-green-dark text-white px-2 py-1 rounded text-sm hover:bg-green-700 transition flex items-center gap-1"
              title="Cambiar responsable del caso"
              onClick={() => {
                setSelectedCaseManagers([...normalizeManager(caseManager)]);
                setOtherManagerInput('');
                setEditCaseManagerOpen(true);
              }}
            >
              <EditIcon size={16} />
              <span className="hidden sm:inline">Cambiar</span>
            </button>
          </div>
        )}
        <div className="bg-amber-sunset p-3 rounded-lg flex items-center justify-between">
          <p className="text-xl font-semibold text-green-dark">
            Responsable del seguimiento:{' '}
            <span className="font-normal">
              {getManagerNames(normalizeManager(privateInfo.followUpManager))}
            </span>
            {hasCustomManager(normalizeManager(privateInfo.followUpManager)) && (
              <span className="text-xs text-amber-700 ml-2">Conviene seleccionar de la lista</span>
            )}
          </p>
          <button
            className="bg-green-dark text-white px-2 py-1 rounded text-sm hover:bg-green-700 transition flex items-center gap-1"
            title="Cambiar responsable del seguimiento"
            onClick={() => {
              setSelectedFollowUpManagers([...normalizeManager(privateInfo.followUpManager)]);
              setEditFollowUpManagerOpen(true);
            }}
          >
            <EditIcon size={16} />
            <span className="hidden sm:inline">Cambiar</span>
          </button>
        </div>
        {rescueReason && (
          <div className="bg-cream-light p-3 rounded-lg">
            <p className="text-xl font-semibold text-green-dark">
              Motivo del caso:{' '}
              <span className="font-normal">{getRescueReasonLabel(rescueReason)}</span>
            </p>
          </div>
        )}
        {privateInfo.totalCost !== undefined && privateInfo.totalCost > 0 && (
          <p className="text-2xl font-semibold text-green-dark">
            Costo total acumulado:{' '}
            <span className="font-semibold text-red-500">${privateInfo.totalCost}</span>
          </p>
        )}
        {(medicalConditions ||
          (vaccinations && vaccinations.length > 0) ||
          privateInfo.totalCost) && (
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
          {privateInfo.adoptionFormId && (
            <li key="adoption-form" className="text-xl font-semibold">
              Formulario de adopción:{' '}
              <Link
                href={`/plam-admin/formularios/${privateInfo.adoptionFormId}`}
                className="text-green-600 hover:text-green-800 underline font-normal"
              >
                {privateInfo.adoptionFormName ?? 'Ver formulario'} →
              </Link>
            </li>
          )}
          <li className="text-xl font-semibold">
            <span>{contactLabelMap[status]}</span>:{' '}
            <span className="font-normal">{contactName}</span>
          </li>
          {contacts &&
            contacts.map((contact, index) => (
              <li key={`${index}-${contact.value}`} className="text-xl font-semibold capitalize">
                {contact.label ? (
                  <>
                    {contact.label}{' '}
                    <span className="text-sm text-gray-500 font-normal lowercase">
                      ({contact.type})
                    </span>
                  </>
                ) : (
                  contact.type
                )}
                : <span className="font-normal">{contact.value}</span>
              </li>
            ))}
          {privateInfo.address && (
            <li className="text-xl font-semibold">
              Dirección: <span className="font-normal">{privateInfo.address}</span>
            </li>
          )}
          <li className="flex justify-center items-center pt-2">
            <EditContactModal
              animal={animal}
              privateInfo={privateInfo}
              setPrivateInfo={setPrivateInfo}
              setAllAnimalTransactions={setAllAnimalTransactions}
            />
          </li>
          <li className="text-xl font-semibold">
            {!notes ||
              (notes.length === 0 && <p className="font-normal">No hay notas disponibles.</p>)}

            {notes && notes.length > 0 && (
              <div className="flex flex-col gap-2">
                <h4>notas:</h4>
                {Array.isArray(notes) &&
                  notes.map((note, index) => {
                    const isEditing = editingNotes.has(index);
                    return (
                      <div className="relative" key={`note-${index}`}>
                        <textarea
                          ref={(el) => {
                            noteRefs.current[index] = el;
                          }}
                          className="font-normal field-sizing-content resize-none w-full bg-white p-2 rounded mb-2 pr-20"
                          value={note}
                          disabled={!isEditing}
                          onChange={(e) => handleNoteChange(index, e.target.value)}
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            className="bg-green-dark text-white px-2 py-1 rounded text-sm"
                            onClick={(e) => {
                              e.preventDefault();
                              handleNoteEditToggle(index, isEditing);
                            }}
                            aria-pressed={isEditing}
                            title={isEditing ? 'Guardar nota' : 'Editar nota'}
                          >
                            {isEditing ? 'Guardar' : <EditIcon />}
                          </button>
                          <button
                            className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                            onClick={(e) => {
                              e.preventDefault();
                              setConfirmDeleteIndex(index);
                            }}
                            title="Eliminar nota"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </li>
          <li className="flex justify-center items-center p-4">
            <Modal
              buttonStyles="bg-green-dark text-white text-xl px-4 py-2 rounded hover:bg-green-700 transition duration-300"
              buttonText={
                <div className="flex flex-row gap-2 justify-center items-center">
                  <PlusIcon size={20} />
                  <span>agregar nota</span>
                </div>
              }
              isOpen={addNoteModalOpen}
              setIsOpen={setAddNoteModalOpen}
            >
              <section className="flex flex-col items-center justify-center bg-cream-light w-full h-full p-4 gap-4 text-center ">
                <h2 className="font-extrabold text-4xl sm:text-5xl  text-green-dark">
                  Agregar nota
                </h2>

                <textarea
                  className="w-4/5 h-40 p-2 border-2 border-green-dark bg-white rounded-lg  field-sizing-content"
                  placeholder="Escribe la nota aquí..."
                  value={newNote}
                  onChange={(e) => {
                    setNewNote(e.target.value);
                  }}
                />
                <button
                  className="bg-green-dark text-white text-xl px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!newNote.trim()}
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddNote();
                  }}
                >
                  Agregar
                </button>
              </section>
            </Modal>
          </li>
        </ul>
      </section>

      {/* Edit Case Manager Modal — multi-select with checkboxes */}
      <Modal
        buttonStyles="hidden"
        buttonText=""
        isOpen={editCaseManagerOpen}
        setIsOpen={setEditCaseManagerOpen}
      >
        <section className="flex flex-col items-center justify-center bg-cream-light w-full h-full p-6 gap-4 text-left">
          <h2 className="font-extrabold text-3xl text-green-dark text-center">
            Cambiar responsable del caso
          </h2>
          <div className="w-full max-w-md space-y-4">
            <div className="relative" ref={caseManagerRef}>
              <button
                type="button"
                onClick={() => setCaseManagerOpen(!caseManagerOpen)}
                className="w-full p-2 border-2 border-green-dark bg-white rounded-lg text-left flex items-center justify-between"
              >
                <span className="text-sm">
                  {selectedCaseManagers.length > 0
                    ? `${selectedCaseManagers.length} seleccionado${selectedCaseManagers.length > 1 ? 's' : ''}`
                    : 'Seleccionar responsables'}
                </span>
                <span className="text-xs text-gray-400">{caseManagerOpen ? '▲' : '▼'}</span>
              </button>
              {caseManagerOpen && (
                <div className="absolute z-10 w-full mt-1 border-2 border-green-dark bg-white rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  {filteredUsers.map((user) => {
                    const isSelected = selectedCaseManagers.includes(user.id);
                    return (
                      <label
                        key={user.id}
                        className="flex items-center gap-3 px-4 py-3.5 hover:bg-green-50 cursor-pointer border-b border-gray-100"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            toggleManager(user.id, selectedCaseManagers, setSelectedCaseManagers)
                          }
                          className="accent-green-700 w-4 h-4"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="block text-base font-medium text-gray-900 truncate">
                            {user.name}
                          </span>
                          <span className="block text-sm text-gray-500 truncate">{user.id}</span>
                        </div>
                      </label>
                    );
                  })}
                  <div className="border-t border-gray-200 px-3 py-2">
                    <div className="flex gap-1">
                      <input
                        type="text"
                        className="flex-1 p-1 border border-gray-300 rounded text-xs"
                        placeholder="Agregar otro..."
                        value={otherManagerInput}
                        onChange={(e) => setOtherManagerInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && otherManagerInput.trim()) {
                            e.preventDefault();
                            setSelectedCaseManagers((prev) => [...prev, otherManagerInput.trim()]);
                            setOtherManagerInput('');
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="bg-green-dark text-white text-xs px-2 py-1 rounded hover:bg-green-700"
                        onClick={() => {
                          if (otherManagerInput.trim()) {
                            setSelectedCaseManagers((prev) => [...prev, otherManagerInput.trim()]);
                            setOtherManagerInput('');
                          }
                        }}
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-amber-700 mt-1">Conviene seleccionar de la lista.</p>
                  </div>
                </div>
              )}
            </div>
            {selectedCaseManagers.length > 0 && (
              <div className="flex flex-col gap-1">
                {selectedCaseManagers.map((email) => (
                  <span
                    key={email}
                    className={`inline-flex items-center justify-between gap-1 text-sm px-3 py-1.5 rounded-lg ${
                      email.includes('@')
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <span>
                      {getUserName(email)}
                      {!email.includes('@') && (
                        <span className="text-xs ml-1">(conviene elegir de la lista)</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCaseManagers((prev) => prev.filter((e) => e !== email))
                      }
                      className="text-green-600 hover:text-red-600 font-bold text-lg leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                onClick={() => setEditCaseManagerOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="flex-1 bg-green-dark text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                onClick={handleSaveCaseManager}
              >
                Guardar
              </button>
            </div>
          </div>
        </section>
      </Modal>

      {/* Edit Follow-up Manager Modal — multi-select with checkboxes */}
      <Modal
        buttonStyles="hidden"
        buttonText=""
        isOpen={editFollowUpManagerOpen}
        setIsOpen={setEditFollowUpManagerOpen}
      >
        <section className="flex flex-col items-center justify-center bg-cream-light w-full h-full p-6 gap-4 text-left">
          <h2 className="font-extrabold text-3xl text-green-dark text-center">
            Cambiar responsable del seguimiento
          </h2>
          <div className="w-full max-w-md space-y-4">
            <div className="relative" ref={followUpManagerRef}>
              <button
                type="button"
                onClick={() => setFollowUpManagerOpen(!followUpManagerOpen)}
                className="w-full p-2 border-2 border-green-dark bg-white rounded-lg text-left flex items-center justify-between"
              >
                <span className="text-sm">
                  {selectedFollowUpManagers.length > 0
                    ? `${selectedFollowUpManagers.length} seleccionado${selectedFollowUpManagers.length > 1 ? 's' : ''}`
                    : 'Sin asignar'}
                </span>
                <span className="text-xs text-gray-400">{followUpManagerOpen ? '▲' : '▼'}</span>
              </button>
              {followUpManagerOpen && (
                <div className="absolute z-10 w-full mt-1 border-2 border-green-dark bg-white rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  {filteredUsers.map((user) => {
                    const isSelected = selectedFollowUpManagers.includes(user.id);
                    return (
                      <label
                        key={user.id}
                        className="flex items-center gap-3 px-4 py-3.5 hover:bg-green-50 cursor-pointer border-b border-gray-100"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            toggleManager(
                              user.id,
                              selectedFollowUpManagers,
                              setSelectedFollowUpManagers
                            )
                          }
                          className="accent-green-700"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="block text-base font-medium text-gray-900 truncate">
                            {user.name}
                          </span>
                          <span className="block text-sm text-gray-500 truncate">{user.id}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            {selectedFollowUpManagers.length > 0 && (
              <div className="flex flex-col gap-1">
                {selectedFollowUpManagers.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center justify-between gap-1 bg-green-100 text-green-800 text-sm px-3 py-1.5 rounded-lg"
                  >
                    {getUserName(email)}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedFollowUpManagers((prev) => prev.filter((e) => e !== email))
                      }
                      className="text-green-600 hover:text-red-600 font-bold text-lg leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                onClick={() => setEditFollowUpManagerOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="flex-1 bg-green-dark text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                onClick={handleSaveFollowUpManager}
              >
                Guardar
              </button>
            </div>
          </div>
        </section>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDeleteIndex !== null}
        title="Eliminar nota"
        message="¿Estás seguro de que quieres eliminar esta nota? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={async () => {
          if (confirmDeleteIndex !== null) {
            await handleNoteDelete(confirmDeleteIndex);
          }
        }}
        onCancel={() => setConfirmDeleteIndex(null)}
      />
    </>
  );
}
