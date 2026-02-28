import { useRef, useState } from 'react';
import { Animal, AnimalTransactionType, PrivateInfoType } from '@/types';
import { auth } from '@/firebase';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { handlePromiseToast } from '@/lib/handleToast';
import { postNewAnimalNote } from '@/lib/firebase/postAnimalNote';
import { Modal } from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { EditIcon, TrashIcon, PlusIcon } from '@/components/Icons';
import { contactLabelMap, getRescueReasonLabel } from '@/lib/constants/animalLabels';
import { createTimestamp } from '@/lib/dateUtils';

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
        await handlePromiseToast(
          Promise.all([
            postFirestoreData<PrivateInfoType>({
              data: privateInfo,
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
              pending: { title: 'Guardando', text: 'Guardando cambios...' },
              success: { title: 'Guardado', text: 'Nota actualizada exitosamente' },
              error: { title: 'Error', text: 'No se pudo actualizar la nota' },
            },
          }
        );

        delete originalNoteValues.current[index];
      } catch (error) {
        console.error('Error updating note:', error);
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
      await handlePromiseToast(
        Promise.all([
          postFirestoreData<PrivateInfoType>({
            data: { ...privateInfo, notes: updatedNotes },
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
            pending: { title: 'Eliminando', text: 'Eliminando nota...' },
            success: { title: 'Eliminada', text: 'Nota eliminada exitosamente' },
            error: { title: 'Error', text: 'No se pudo eliminar la nota' },
          },
        }
      );
    } catch (error) {
      console.error('Error deleting note:', error);
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
      console.error('Error adding note:', error);
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
        {caseManager && (
          <div className="bg-amber-sunset p-3 rounded-lg">
            <p className="text-xl font-semibold text-green-dark">
              Responsable del caso: <span className="font-normal">{caseManager}</span>
            </p>
          </div>
        )}
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
          <li className="text-xl font-semibold">
            <span>{contactLabelMap[status]}</span>:{' '}
            <span className="font-normal">{contactName}</span>
          </li>
          {contacts &&
            contacts.map((contact, index) => (
              <li key={`${index}-${contact.value}`} className="text-xl font-semibold capitalize">
                {contact.type}: <span className="font-normal">{contact.value}</span>
              </li>
            ))}
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
