'use client';
import Hero from '@/components/Hero';
import PhotoCarrousel from '@/components/PhotoCarrousel';
import { Modal } from '@/components/Modal';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { Animal, AnimalTransactionType, PrivateInfoType } from '@/types';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import { auth } from '@/firebase';

import { formatDateMMYYYY, yearsOrMonthsElapsed } from '@/lib/dateUtils';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import Loader from '@/components/Loader';
import { deleteImage } from '@/lib/deleteIgame';
import { deleteFirestoreData } from '@/lib/firebase/deleteFirestoreData';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import ProtectedRoute from '@/components/ProtectedRoute';
import TransactionCard from '@/components/TransactionCard';
import { postNewAnimalNote } from '@/lib/firebase/postAnimalNote';
import {
  EditIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  CalendarIcon,
  HeartIcon,
  SwapIcon,
  PlusIcon,
} from '@/components/Icons';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  contactLabelMap,
  YesNoUnknownMap,
  getRescueReasonLabel,
  eventLabels,
} from '@/lib/constants/animalLabels';

export default function AnimalPage() {
  const router = useRouter();
  const params = useParams();
  const currentId = params.id as string;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const MIN_LOADING_TIME = 600;

  const [animal, setAnimal] = useState<Animal>({} as Animal);
  const [privateInfo, setPrivateInfo] = useState<PrivateInfoType>({} as PrivateInfoType);
  // const [animalTransaction, setAnimalTransaction] = useState<AnimalTransactionType>({} as AnimalTransactionType);
  const [allAnimalTransactions, setAllAnimalTransactions] = useState<AnimalTransactionType[]>(
    [] as AnimalTransactionType[]
  );
  const [newNote, setNewNote] = useState<string>('');
  const [addNoteModalOpen, setAddNoteModalOpen] = useState<boolean>(false);
  const [adoptionModalOpen, setAdoptionModalOpen] = useState<boolean>(false);
  const [returnModalOpen, setReturnModalOpen] = useState<boolean>(false);
  const [eventModalOpen, setEventModalOpen] = useState<boolean>(false);
  const [adoptionData, setAdoptionData] = useState<{
    contactName: string;
    contacts: Array<{ type: 'celular' | 'email' | 'other'; value: string }>;
    note: string;
    newStatus?: 'transitorio' | 'adoptado';
  }>({
    contactName: '',
    contacts: [{ type: 'celular', value: '' }],
    note: '',
    newStatus: 'transitorio',
  });
  const [eventData, setEventData] = useState<{
    eventType:
      | 'medical'
      | 'vaccination'
      | 'sterilization'
      | 'emergency'
      | 'supply'
      | 'followup'
      | 'deceased'
      | 'other';
    note: string;
    cost: string;
    vaccineName?: string;
    vaccineDate?: string;
  }>({
    eventType: 'medical',
    note: '',
    cost: '',
    vaccineName: '',
    vaccineDate: new Date().toISOString().split('T')[0],
  });
  const [transitChangeModalOpen, setTransitChangeModalOpen] = useState<boolean>(false);
  const [transitChangeData, setTransitChangeData] = useState<{
    contactName: string;
    contacts: Array<{ type: 'celular' | 'email' | 'other'; value: string }>;
    note: string;
  }>({
    contactName: '',
    contacts: [{ type: 'celular', value: '' }],
    note: '',
  });

  // Track which note indexes are currently editable
  const [editingNotes, setEditingNotes] = useState<Set<number>>(new Set());
  // Refs to note textareas so we can focus when toggling edit
  const noteRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});
  // Store original note values when starting edit (for before/after comparison)
  const originalNoteValues = useRef<Record<number, string>>({});
  // Index of note pending deletion via ConfirmDialog (null = none)
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);

  // Handle note editing toggle and save
  const handleNoteEditToggle = async (index: number, isEditing: boolean) => {
    if (isEditing) {
      // Saving: we have both original and edited values
      const originalNote = originalNoteValues.current[index];
      const editedNote = privateInfo.notes?.[index];

      const newTransactionData: AnimalTransactionType = {
        id: privateInfo.id,
        name: privateInfo.name || '',
        transactionType: 'note',
        img: animal.images[0],
        date: Date.now(),
        modifiedBy: auth.currentUser?.email || 'system',
        since: Date.now(),
        changes: {
          before: { notes: [originalNote || ''] },
          after: { notes: [editedNote || ''] },
        },
      };

      // Optimistic UI: add transaction immediately
      setAllAnimalTransactions((prev) => [newTransactionData, ...prev]);

      try {
        // Save the changes to Firestore and create transaction
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
              pending: {
                title: 'Guardando',
                text: 'Guardando cambios...',
              },
              success: {
                title: 'Guardado',
                text: 'Nota actualizada exitosamente',
              },
              error: {
                title: 'Error',
                text: 'No se pudo actualizar la nota',
              },
            },
          }
        );

        // Clear the original value after successful save
        delete originalNoteValues.current[index];
      } catch (error) {
        console.error('Error updating note:', error);
        // Revert optimistic update on error
        setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransactionData.date));
      }
    }

    setEditingNotes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        // Starting edit: save original value
        originalNoteValues.current[index] = privateInfo.notes?.[index] || '';
        next.add(index);
        setTimeout(() => noteRefs.current[index]?.focus(), 0);
      }
      return next;
    });
  };

  // Handle note change
  const handleNoteChange = (index: number, value: string) => {
    setPrivateInfo((prev) => {
      const updatedNotes = [...(prev.notes || [])];
      updatedNotes[index] = value;
      return { ...prev, notes: updatedNotes };
    });
  };

  // Handle note deletion
  const handleNoteDelete = async (index: number) => {
    const deletedNote = privateInfo.notes?.[index];
    const updatedNotes = privateInfo.notes?.filter((_, i) => i !== index);
    setPrivateInfo((prev) => ({ ...prev, notes: updatedNotes }));

    const newTransactionData: AnimalTransactionType = {
      id: privateInfo.id,
      name: privateInfo.name || '',
      img: animal.images[0],
      transactionType: 'note',
      date: Date.now(),
      modifiedBy: auth.currentUser?.email || 'system',
      since: Date.now(),
      changes: {
        before: { notes: [deletedNote || ''] },
      },
    };

    // Optimistic UI: add transaction immediately
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
            pending: {
              title: 'Eliminando',
              text: 'Eliminando nota...',
            },
            success: {
              title: 'Eliminada',
              text: 'Nota eliminada exitosamente',
            },
            error: {
              title: 'Error',
              text: 'No se pudo eliminar la nota',
            },
          },
        }
      );
    } catch (error) {
      console.error('Error deleting note:', error);
      // Revert optimistic updates on error
      setPrivateInfo((prev) => ({
        ...prev,
        notes: [...(prev.notes || []), deletedNote || ''],
      }));
      setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransactionData.date));
    }

    setConfirmDeleteIndex(null);
  };

  // Handle return from adoption
  const handleReturn = async () => {
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
      isAvalible: !isGoingToNewAdopter,
      isVisible: !isGoingToNewAdopter,
    };

    const newTransactionData: AnimalTransactionType = {
      id: privateInfo.id,
      name: privateInfo.name || '',
      img: animal.images[0],
      transactionType: isGoingToNewAdopter ? 'adoption' : 'return',
      date: Date.now(),
      modifiedBy: auth.currentUser?.email || 'system',
      since: Date.now(),
      status: newStatus,
      isAvalible: !isGoingToNewAdopter,
      isVisible: !isGoingToNewAdopter,
      contactName: adoptionData.contactName,
      contacts: adoptionData.contacts.filter((c) => c.value.trim() !== ''),
      changes: {
        before: {
          status: animal.status,
          isAvalible: animal.isAvalible,
          isVisible: animal.isVisible,
          contactName: privateInfo.contactName,
          contacts: privateInfo.contacts,
        },
        after: {
          status: newStatus,
          isAvalible: !isGoingToNewAdopter,
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
            pending: {
              title: 'Registrando retorno',
              text: 'Por favor espera...',
            },
            success: {
              title: isGoingToNewAdopter ? 'Re-adopción registrada' : 'Retorno registrado',
              text: isGoingToNewAdopter
                ? 'El animal fue re-adoptado exitosamente'
                : 'El retorno se registró exitosamente',
            },
            error: {
              title: 'Error',
              text: 'No se pudo registrar el retorno',
            },
          },
        }
      );

      // Reset form
      setAdoptionData({
        contactName: '',
        contacts: [{ type: 'celular', value: '' }],
        note: '',
        newStatus: 'transitorio',
      });
    } catch (error) {
      console.error('Error handling return:', error);
      // Revert optimistic updates
      setAnimal(animal);
      setPrivateInfo(privateInfo);
      setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransactionData.date));
    }
  };

  // Handle transit change
  const handleTransitChange = async () => {
    setTransitChangeModalOpen(false);

    const notePrefix = '[Cambio de tránsito] - ';

    const updatedPrivateInfo = {
      ...privateInfo,
      contactName: transitChangeData.contactName,
      contacts: transitChangeData.contacts.filter((c) => c.value.trim() !== ''),
      notes: [...(privateInfo.notes || []), notePrefix + transitChangeData.note],
    };

    const newTransactionData: AnimalTransactionType = {
      id: privateInfo.id,
      name: privateInfo.name || '',
      img: animal.images[0],
      transactionType: 'transit_change',
      date: Date.now(),
      modifiedBy: auth.currentUser?.email || 'system',
      since: Date.now(),
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
            pending: {
              title: 'Registrando cambio',
              text: 'Por favor espera...',
            },
            success: {
              title: 'Cambio registrado',
              text: 'El cambio de tránsito se registró exitosamente',
            },
            error: {
              title: 'Error',
              text: 'No se pudo registrar el cambio',
            },
          },
        }
      );

      // Reset form
      setTransitChangeData({
        contactName: '',
        contacts: [{ type: 'celular', value: '' }],
        note: '',
      });
    } catch (error) {
      console.error('Error handling transit change:', error);
      // Revert optimistic updates
      setPrivateInfo(privateInfo);
      setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransactionData.date));
    }
  };

  // Handle event registration
  const handleEvent = async () => {
    setEventModalOpen(false);

    const notePrefix = `[${eventLabels[eventData.eventType]}] - `;
    const costValue = eventData.cost.trim() ? parseFloat(eventData.cost) : undefined;

    // Check if this is a deceased event
    const isDeceased = eventData.eventType === 'deceased';

    // If vaccination, add to vaccinations array
    const isVaccination = eventData.eventType === 'vaccination';
    const newVaccination =
      isVaccination && eventData.vaccineName?.trim()
        ? {
            vaccine: eventData.vaccineName.trim(),
            date: eventData.vaccineDate ? new Date(eventData.vaccineDate).getTime() : Date.now(),
          }
        : null;

    // Only add note if there's text (vaccination can skip note)
    const shouldAddNote = eventData.note.trim() !== '';

    // Update totalCost if there's a cost
    const currentTotalCost = privateInfo.totalCost || 0;
    const newTotalCost = costValue ? currentTotalCost + costValue : currentTotalCost;

    const updatedPrivateInfo = {
      ...privateInfo,
      ...(shouldAddNote && {
        notes: [...(privateInfo.notes || []), notePrefix + eventData.note],
      }),
      ...(newVaccination && {
        vaccinations: [...(privateInfo.vaccinations || []), newVaccination],
      }),
      ...(costValue && {
        totalCost: newTotalCost,
      }),
    };

    // Update animal status if deceased
    const updatedAnimal: Animal = isDeceased
      ? {
          ...animal,
          status: 'fallecido',
          isAvalible: false,
          isVisible: false,
        }
      : animal;

    const newTransactionData: AnimalTransactionType = {
      id: privateInfo.id,
      name: privateInfo.name || '',
      img: animal.images[0],
      transactionType: eventData.eventType,
      date: Date.now(),
      modifiedBy: auth.currentUser?.email || 'system',
      since: Date.now(),
      cost: costValue,
      ...(newVaccination && { vaccinations: [newVaccination] }),
      changes: {
        ...(isVaccination &&
          newVaccination && {
            before: {
              vaccinations: privateInfo.vaccinations || [],
            },
          }),
        ...(costValue && {
          before: {
            ...(isVaccination &&
              newVaccination && { vaccinations: privateInfo.vaccinations || [] }),
            totalCost: currentTotalCost,
          },
        }),
        ...(isDeceased && {
          before: {
            status: animal.status,
            isVisible: animal.isVisible,
            isAvalible: animal.isAvalible,
          },
        }),
        after: {
          ...(shouldAddNote && {
            notes: [notePrefix + eventData.note],
          }),
          ...(newVaccination && {
            vaccinations: [
              ...(privateInfo.vaccinations || []),
              { ...newVaccination, vaccine: '> ' + newVaccination.vaccine },
            ],
          }),
          ...(costValue && {
            totalCost: newTotalCost,
          }),
          ...(isDeceased && {
            status: 'fallecido',
            isVisible: false,
            isAvalible: false,
          }),
        },
      },
    };

    // Optimistic UI
    setPrivateInfo(updatedPrivateInfo);
    setAllAnimalTransactions((prev) => [newTransactionData, ...prev]);
    if (isDeceased) {
      setAnimal(updatedAnimal);
    }

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
          ...(isDeceased
            ? [
                postFirestoreData<Animal>({
                  data: updatedAnimal,
                  currentCollection: 'animals',
                  id: animal.id,
                }),
              ]
            : []),
        ]),
        {
          messages: {
            pending: {
              title: 'Registrando evento',
              text: 'Por favor espera...',
            },
            success: {
              title: 'Evento registrado',
              text: 'El evento se registró exitosamente',
            },
            error: {
              title: 'Error',
              text: 'No se pudo registrar el evento',
            },
          },
        }
      );

      // Reset form
      setEventData({
        eventType: 'medical',
        note: '',
        cost: '',
        vaccineName: '',
        vaccineDate: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Error handling event registration:', error);
      // Revert optimistic updates
      setPrivateInfo(privateInfo);
      setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransactionData.date));
      if (isDeceased) {
        setAnimal(animal);
      }
    }
  };

  // Handle adoption registration
  const handleAdoption = async () => {
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
      isAvalible: false,
      isVisible: false,
    };

    const newTransactionData: AnimalTransactionType = {
      id: privateInfo.id,
      name: privateInfo.name || '',
      img: animal.images[0],
      transactionType: 'adoption',
      date: Date.now(),
      modifiedBy: auth.currentUser?.email || 'system',
      since: Date.now(),
      status: 'adoptado',
      isAvalible: false,
      isVisible: false,
      contactName: adoptionData.contactName,
      contacts: adoptionData.contacts.filter((c) => c.value.trim() !== ''),
      changes: {
        before: {
          status: animal.status,
          isAvalible: animal.isAvalible,
          isVisible: animal.isVisible,
          contactName: privateInfo.contactName,
          contacts: privateInfo.contacts,
        },
        after: {
          status: 'adoptado',
          isAvalible: false,
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
            pending: {
              title: 'Registrando adopción',
              text: 'Por favor espera...',
            },
            success: {
              title: 'Adopción registrada',
              text: 'La adopción se registró exitosamente',
            },
            error: {
              title: 'Error',
              text: 'No se pudo registrar la adopción',
            },
          },
        }
      );

      // Reset form
      setAdoptionData({
        contactName: '',
        contacts: [{ type: 'celular', value: '' }],
        note: '',
      });
    } catch (error) {
      console.error('Error handling adoption:', error);
      // Revert optimistic updates
      setAnimal(animal);
      setPrivateInfo(privateInfo);
      setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransactionData.date));
    }
  };

  // Handle adding a new note
  const handleAddNote = async () => {
    const noteToAdd = newNote;
    // Close modal on success
    setAddNoteModalOpen(false);

    // Create transaction data for optimistic UI
    const newTransactionData: AnimalTransactionType = {
      id: privateInfo.id,
      name: privateInfo.name || '',
      img: animal.images[0],
      transactionType: 'note',
      date: Date.now(),
      modifiedBy: auth.currentUser?.email || 'system',
      since: Date.now(),
      changes: {
        after: { notes: [noteToAdd] },
      },
    };

    // Optimistic UI: agregar la nota y la transacción al estado local inmediatamente
    setPrivateInfo((prev) => ({
      ...prev,
      notes: [...(prev.notes || []), noteToAdd],
    }));
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
            pending: {
              title: 'Agregando nota',
              text: 'Por favor espera...',
            },
            success: {
              title: 'Nota agregada',
              text: 'La nota se agregó exitosamente',
            },
            error: {
              title: 'Error',
              text: 'No se pudo agregar la nota',
            },
          },
        }
      );
    } catch (error) {
      console.error('Error adding note:', error);
      // Si falla, revertir ambos cambios optimistas
      setPrivateInfo((prev) => ({
        ...prev,
        notes: (prev.notes || []).filter((n) => n !== noteToAdd),
      }));
      setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransactionData.date));
      setNewNote(noteToAdd);
    }
  };
  useEffect(() => {
    const fetchAnimalData = async () => {
      try {
        if (!currentId) return null;
        const animal = await getFirestoreDocById<Animal>({
          currentCollection: 'animals',
          id: currentId,
        });
        if (!animal) {
          console.error('Animal not found');
          throw new Error('Animal not found');
        }
        const currentPrivateInfo = await getFirestoreDocById<PrivateInfoType>({
          currentCollection: 'animalPrivateInfo',
          id: currentId,
        });
        if (!currentPrivateInfo) {
          console.error('Private info not found');
          throw new Error('Private info not found');
        }
        const currentTransactions = await getFirestoreData({
          currentCollection: 'animalTransactions',
          filter: [['id', '==', currentId]],
        });
        if (!currentTransactions) {
          console.error('Transaction info not found for this animal');
          throw new Error('Transaction info not found for this animal');
        }

        const sortedTransactions = currentTransactions.sort((a, b) => b.date - a.date);

        setAllAnimalTransactions(sortedTransactions);
        const latestTransaction = sortedTransactions[0];

        if (!latestTransaction) {
          console.error('No valid animal transaction data found');
          throw new Error('No valid animal transaction data found');
        }

        setAnimal(animal);
        setPrivateInfo(currentPrivateInfo);
      } catch (error) {
        console.error('Error fetching animal data:', error);
        handleToast({
          type: 'error',
          title: 'Error',
          text: 'Error al obtener los datos del animal.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnimalData();
  }, [currentId]);

  const handleVisibleToggle = async (newValue: boolean) => {
    const start = Date.now();
    setIsLoading(true);

    const updatedAnimal = { ...animal, isVisible: newValue };
    const newTransaction: AnimalTransactionType = {
      id: animal.id,
      name: animal.name,
      img: animal.images[0],
      transactionType: 'update',
      date: Date.now(),
      modifiedBy: auth.currentUser?.email || 'system',
      since: Date.now(),
      isVisible: newValue,
      changes: {
        before: {
          isVisible: animal.isVisible,
        },
        after: {
          isVisible: newValue,
        },
      },
    };

    // Optimistic UI
    setAnimal(updatedAnimal);
    setAllAnimalTransactions((prev) => [newTransaction, ...prev]);

    try {
      await handlePromiseToast(
        Promise.all([
          postFirestoreData<Animal>({
            data: updatedAnimal,
            currentCollection: 'animals',
            id: animal.id,
          }),
          postFirestoreData<AnimalTransactionType>({
            data: newTransaction,
            currentCollection: 'animalTransactions',
          }),
        ]),
        {
          messages: {
            pending: {
              title: 'Actualizando visibilidad',
              text: 'Por favor espera...',
            },
            success: {
              title: 'Visibilidad actualizada',
              text: `El animal ahora está ${newValue ? 'visible' : 'oculto'}`,
            },
            error: {
              title: 'Error',
              text: 'No se pudo actualizar la visibilidad',
            },
          },
        }
      );
    } catch (error) {
      console.error('Error updating visibility:', error);
      // Revert optimistic updates
      setAnimal(animal);
      setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransaction.date));
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

  const handleAvalibleToggle = async (newValue: boolean) => {
    const start = Date.now();
    setIsLoading(true);

    const updatedAnimal = { ...animal, isAvalible: newValue };
    const newTransaction: AnimalTransactionType = {
      id: animal.id,
      name: animal.name,
      img: animal.images[0],
      transactionType: 'update',
      date: Date.now(),
      modifiedBy: auth.currentUser?.email || 'system',
      since: Date.now(),
      isAvalible: newValue,
      changes: {
        before: {
          isAvalible: animal.isAvalible,
        },
        after: {
          isAvalible: newValue,
        },
      },
    };

    // Optimistic UI
    setAnimal(updatedAnimal);
    setAllAnimalTransactions((prev) => [newTransaction, ...prev]);

    try {
      await handlePromiseToast(
        Promise.all([
          postFirestoreData<Animal>({
            data: updatedAnimal,
            currentCollection: 'animals',
            id: animal.id,
          }),
          postFirestoreData<AnimalTransactionType>({
            data: newTransaction,
            currentCollection: 'animalTransactions',
          }),
        ]),
        {
          messages: {
            pending: {
              title: 'Actualizando disponibilidad',
              text: 'Por favor espera...',
            },
            success: {
              title: 'Disponibilidad actualizada',
              text: `El animal ahora está ${newValue ? 'disponible' : 'no disponible'}`,
            },
            error: {
              title: 'Error',
              text: 'No se pudo actualizar la disponibilidad',
            },
          },
        }
      );
    } catch (error) {
      console.error('Error updating availability:', error);
      // Revert optimistic updates
      setAnimal(animal);
      setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransaction.date));
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

  const handleDelete = async (currentId: string) => {
    try {
      if (!animal) throw new Error(`Animal with id ${currentId} not found`);

      const updatedAnimal = { ...animal, isDeleted: true, isVisible: false, isAvalible: false };
      const newTransaction: AnimalTransactionType = {
        id: currentId,
        name: animal.name,
        img: animal.images[0],
        transactionType: 'delete',
        since: Date.now(),
        date: Date.now(),
        modifiedBy: auth.currentUser?.email || '',
        changes: {
          before: {
            isDeleted: animal.isDeleted || false,
            isVisible: animal.isVisible,
            isAvalible: animal.isAvalible,
          },
          after: {
            isDeleted: true,
            isVisible: false,
            isAvalible: false,
          },
        },
      };

      const promises = Promise.all([
        postFirestoreData<Animal>({
          data: updatedAnimal,
          currentCollection: 'animals',
          id: currentId,
        }),
        postFirestoreData<AnimalTransactionType>({
          data: newTransaction,
          currentCollection: 'animalTransactions',
        }),
      ]);
      await handlePromiseToast(promises, {
        messages: {
          pending: {
            title: 'Eliminando...',
            text: `'Por favor, espera mientras eliminamos a ${animal.name}.'`,
          },
          success: {
            title: 'Éxito',
            text: `${animal.name} ha sido eliminado correctamente.`,
          },
          error: {
            title: 'Error',
            text: `Hubo un error al eliminar a ${animal.name}.`,
          },
        },
      });

      router.push('/plam-admin/animales');
    } catch (error) {
      console.error("Error changing the animal's status:", error);
    }
  };

  const handleRestore = async (currentId: string) => {
    const start = Date.now();
    setIsLoading(true);
    try {
      const updatedAnimal = { ...animal, isDeleted: false, isVisible: false, isAvalible: false };
      const newTransactionData: AnimalTransactionType = {
        date: Date.now(),
        modifiedBy: auth.currentUser?.email || '',
        id: currentId,
        name: animal.name,
        img: animal.images[0],
        transactionType: 'update',
        since: Date.now(),
        changes: {
          before: {
            isDeleted: animal.isDeleted || false,
            isVisible: animal.isVisible,
            isAvalible: animal.isAvalible,
          },
          after: {
            isDeleted: false,
            isVisible: false,
            isAvalible: false,
          },
        },
      };

      const promises = Promise.all([
        postFirestoreData<Animal>({
          data: updatedAnimal,
          currentCollection: 'animals',
          id: currentId,
        }),
        postFirestoreData<AnimalTransactionType>({
          data: newTransactionData,
          currentCollection: 'animalTransactions',
        }),
      ]);

      await handlePromiseToast(promises, {
        messages: {
          pending: {
            title: 'Restaurando...',
            text: `'Por favor, espera mientras restauramos a ${animal.name}.'`,
          },
          success: {
            title: 'Éxito',
            text: `${animal.name} ha sido restaurado correctamente.`,
          },
          error: {
            title: 'Error',
            text: `Hubo un error al restaurar a ${animal.name}.`,
          },
        },
      });

      router.push('/plam-admin/animales');
    } catch (error) {
      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => {
          setIsLoading(false);
        }, remaining);
      } else {
        setIsLoading(false);
      }

      console.error("Error changing the animal's status:", error);
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

  const handleHardDeleteSingleAnimal = async ({ animal }: { animal: Animal }) => {
    const start = Date.now();
    setIsLoading(true);
    try {
      const images = animal.images;
      for (const image of images) {
        if (image.imgId) {
          await handlePromiseToast(deleteImage(image.imgId), {
            messages: {
              pending: {
                title: 'Eliminando imagen...',
                text: `'Por favor, espera mientras eliminamos la imagen de ${animal.name}.'`,
              },
              success: {
                title: 'Éxito',
                text: `La imagen de ${animal.name} ha sido eliminada correctamente.`,
              },
              error: {
                title: 'Error',
                text: `Hubo un error al eliminar la imagen de ${animal.name}.`,
              },
            },
          });
        }
      }

      const newTransaction: AnimalTransactionType = {
        id: animal.id,
        name: animal.name,
        img: animal.images[0],
        transactionType: 'delete',
        date: Date.now(),
        since: Date.now(),
        modifiedBy: auth.currentUser?.email || '',
        changes: {
          before: {
            name: animal.name,
            status: animal.status,
            isDeleted: animal.isDeleted || false,
            isVisible: animal.isVisible,
            isAvalible: animal.isAvalible,
            images: animal.images,
          },
          after: {
            hardDeleted: true,
          },
        },
      };

      const promises = Promise.all([
        deleteFirestoreData({ collection: 'animals', docId: animal.id }),
        postFirestoreData<AnimalTransactionType>({
          data: newTransaction,
          currentCollection: 'animalTransactions',
        }),
      ]);
      await handlePromiseToast(promises, {
        messages: {
          pending: {
            title: 'Eliminando...',
            text: `'Por favor, espera mientras eliminamos a ${animal.name}.'`,
          },
          success: {
            title: 'Éxito',
            text: `${animal.name} ha sido eliminado correctamente.`,
          },
          error: {
            title: 'Error',
            text: `Hubo un error al eliminar a ${animal.name}.`,
          },
        },
      });

      router.push('/plam-admin/animales');
    } catch (error) {
      console.error('Error to delete animal:', error);
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

  if (!animal.id || !privateInfo.id || !allAnimalTransactions.length) {
    return (
      <div className="flex flex-col items-center gap-8 w-full min-h-screen bg-white">
        <Hero title="cargando" />
        <section className="flex flex-col gap-4 px-9 py-4 max-w-7xl">
          <h1>cargando...</h1>
        </section>
      </div>
    );
  }

  const {
    name,
    description,
    isAvalible,
    isVisible,
    images,
    gender,
    aproxBirthDate,
    status,
    size,
    species,
    waitingSince,
    compatibility,
    isSterilized,
    isDeleted,
  } = animal;
  const {
    contactName,
    contacts,
    caseManager,
    vaccinations,
    medicalConditions,
    notes,
    rescueReason,
  } = privateInfo;
  const img =
    images?.length > 0 ? images : [{ imgUrl: '/logo300.webp', imgAlt: 'Imagen no disponible' }];

  // Derived state: check if case is closed (adopted or deceased)
  const isCaseClosed = status === 'adoptado' || status === 'fallecido';
  const isDeceased = status === 'fallecido';
  const isAdopted = status === 'adoptado';

  if (isLoading) {
    return <Loader />;
  }

  return (
    <ProtectedRoute requiredRole="rescatista" redirectPath="/plam-admin">
      <div className="flex flex-col items-center pb-6 gap-8 w-full min-h-screen bg-white">
        <Hero imgURL={img[0].imgUrl} title={name} imgAlt={img[0].imgAlt} />
        <section className="flex flex-col md:flex-row gap-4 py-4 w-full justify-center items-center">
          <div className="flex flex-col md:flex-row gap-4 px-9 py-4 w-full max-w-7xl">
            <div className="flex flex-col gap-4 text-start text-black px-2 md:w-1/2 shrink-0">
              <textarea
                className="text-green-dark text-lg font-bold field-sizing-content resize-none"
                value={description}
                readOnly
                aria-label="Descripción del animal"
                disabled
              />
              <ul className="list-disc pl-4 text-green-dark">
                <li className="text-xl font-semibold">
                  Estado: <span className="font-normal">{status}</span>
                </li>
                <li className="text-xl font-semibold">
                  Disponible: <span className="font-normal">{isAvalible ? 'Sí' : 'No'}</span>
                </li>
                <li className="text-xl font-semibold">
                  Se muestra: <span className="font-normal">{isVisible ? 'Sí' : 'No'}</span>
                </li>
                <li className="text-xl font-semibold">
                  Género: <span className="font-normal">{gender}</span>
                </li>
                <li className="text-xl font-semibold">
                  Especie: <span className="font-normal">{species}</span>
                </li>
                <li className="text-xl font-semibold">
                  Tamaño: <span className="font-normal">{size}</span>
                </li>
                <li className="text-xl font-semibold">
                  Situación actual: <span className="font-normal">{status}</span>
                </li>
                <li className="text-xl font-semibold">
                  Edad: <span className="font-normal">{yearsOrMonthsElapsed(aproxBirthDate)}</span>
                </li>
                <li className="text-xl font-semibold">
                  Esperándo desde:{' '}
                  <span className="font-normal">{`${formatDateMMYYYY(waitingSince)} (hace ${yearsOrMonthsElapsed(waitingSince)})`}</span>
                </li>
                <li className="text-xl font-semibold">
                  Está esterilizado:{' '}
                  <span className="font-normal">{YesNoUnknownMap[isSterilized]}</span>
                </li>
                <li>
                  <span className="text-xl font-semibold">Compatibilidad:</span>
                  <ul className="list-disc pl-4 ">
                    <li>
                      {' '}
                      <span className="font-semibold">Con perros:</span>{' '}
                      {YesNoUnknownMap[compatibility?.dogs]}
                    </li>
                    <li>
                      <span className="font-semibold">Con gatos:</span>{' '}
                      {YesNoUnknownMap[compatibility?.cats]}
                    </li>
                    <li>
                      <span className="font-semibold">Con niños:</span>{' '}
                      {YesNoUnknownMap[compatibility?.kids]}
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
            <div className="w-full md:w-1/2 h-auto max-h-[650px] rounded-lg bg-amber-sunset shrink-0">
              <PhotoCarrousel images={img} />
            </div>
          </div>
        </section>
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

        {isDeleted && (
          <section className="flex flex-col sm:flex-row gap-4 px-9 py-4 w-full max-w-7xl items-center justify-center">
            <Modal
              buttonStyles="bg-caramel-deep text-white text-3xl px-4 py-2 rounded hover:bg-amber-sunset transition duration-300"
              buttonText="Restaurar"
            >
              <section className="flex flex-col items-center justify-around bg-white w-full min-h-full p-4 gap-1 text-center text-black ">
                <h2 className="text-2xl font-bold">¿Estás seguro de que quieres restaurar?</h2>
                <article className="grid grid-rows-[1fr_auto] rounded-xl overflow-hidden shadow-lg bg-cream-light w-3/5 h-auto">
                  <div className="aspect-square">
                    <Image
                      className="w-full h-full object-cover bg-white"
                      src={animal.images[0].imgUrl}
                      alt={animal.images[0].imgAlt}
                      width={300}
                      height={300}
                    />
                  </div>
                  <div className="flex flex-col items-center justify-between gap-1 p-2">
                    <span className="uppercase text-2xl text-center font-extrabold">
                      Nombre: {animal.name}
                    </span>
                    <span className="uppercase text-2xl text-center font-extrabold">
                      Id :{animal.id}
                    </span>
                    <button
                      onClick={() => handleRestore(animal.id)}
                      className="bg-green-600 text-white text-xl px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300"
                    >
                      Sí, Restaurar
                    </button>
                  </div>
                </article>
              </section>
            </Modal>
            <Modal
              buttonStyles="bg-red-600 text-white text-3xl px-4 py-2 hover:bg-red-700 text-white rounded  transition duration-300"
              buttonText="Eliminar definitivamente"
            >
              <section className="flex flex-col items-center justify-around bg-white w-full min-h-full p-4 gap-1 text-center text-black ">
                <h2 className="text-2xl font-bold">
                  ¿Estás seguro de que quieres eliminar definitivamente este animal?
                </h2>
                <article className="grid grid-rows-[1fr_auto] rounded-xl overflow-hidden shadow-lg bg-cream-light w-3/5 h-auto">
                  <div className="aspect-square">
                    <Image
                      className="w-full h-full object-cover bg-white"
                      src={animal.images[0].imgUrl}
                      alt={animal.images[0].imgAlt}
                      width={300}
                      height={300}
                    />
                  </div>
                  <div className="flex flex-col items-center justify-between gap-1 p-2">
                    <span className="uppercase text-2xl text-center font-extrabold">
                      Nombre: {animal.name}
                    </span>
                    <span className="uppercase text-2xl text-center font-extrabold">
                      Id :{animal.id}
                    </span>
                    <button
                      onClick={() => handleHardDeleteSingleAnimal({ animal })}
                      className="bg-red-600 text-white text-xl px-4 py-2 rounded-lg hover:bg-red-700 transition duration-300"
                    >
                      Eliminar definitivamente
                    </button>
                  </div>
                </article>
              </section>
            </Modal>
          </section>
        )}

        {!isDeleted && (
          <>
            <section className="flex flex-col  gap-2 px-9 py-4 w-full max-w-7xl items-center justify-center">
              <section className="flex flex-col sm:flex-row gap-4 px-9 py-4 w-full max-w-7xl items-center justify-center">
                <Modal
                  buttonStyles="bg-blue-600 text-white text-3xl px-4 py-2 rounded hover:bg-blue-700 transition duration-300"
                  buttonText={
                    <div className="flex flex-row gap-2 justify-center items-center">
                      <CalendarIcon size={24} />
                      <span>Registrar Evento</span>
                    </div>
                  }
                  isOpen={eventModalOpen}
                  setIsOpen={setEventModalOpen}
                >
                  <section className="flex flex-col items-center justify-start bg-cream-light w-full h-full p-6 gap-4 text-left overflow-y-auto">
                    <h2 className="font-extrabold text-4xl sm:text-5xl text-green-dark text-center">
                      Registrar Evento
                    </h2>

                    <div className="w-full max-w-2xl space-y-4">
                      {/* Event Type */}
                      <div>
                        <label className="block text-green-dark font-semibold mb-2">
                          Tipo de Evento *
                        </label>
                        <select
                          className="w-full p-2 border-2 border-green-dark bg-white rounded-lg"
                          value={eventData.eventType}
                          onChange={(e) =>
                            setEventData((prev) => ({
                              ...prev,
                              eventType: e.target.value as
                                | 'medical'
                                | 'vaccination'
                                | 'sterilization'
                                | 'emergency'
                                | 'supply'
                                | 'followup'
                                | 'deceased'
                                | 'other',
                            }))
                          }
                        >
                          {!isDeceased && <option value="medical">Médico</option>}
                          {!isDeceased && <option value="vaccination">Vacunación</option>}
                          {!isDeceased && <option value="sterilization">Esterilización</option>}
                          {!isDeceased && <option value="emergency">Emergencia</option>}
                          {!isDeceased && (
                            <option value="supply">Suministro alimento insumos etc</option>
                          )}
                          {!isDeceased && <option value="followup">Seguimiento</option>}
                          {!isDeceased && <option value="deceased">Fallecimiento</option>}
                          <option value="other">Otro</option>
                        </select>
                      </div>

                      {/* Vaccination specific fields */}
                      {eventData.eventType === 'vaccination' && (
                        <>
                          <div>
                            <label className="block text-green-dark font-semibold mb-2">
                              Nombre de la Vacuna *
                            </label>
                            <input
                              type="text"
                              className="w-full p-2 border-2 border-green-dark bg-white rounded-lg"
                              placeholder="Ej: Rabia, Séxtuple, etc."
                              value={eventData.vaccineName || ''}
                              onChange={(e) =>
                                setEventData((prev) => ({ ...prev, vaccineName: e.target.value }))
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-green-dark font-semibold mb-2">
                              Fecha de Vacunación *
                            </label>
                            <input
                              type="date"
                              className="w-full p-2 border-2 border-green-dark bg-white rounded-lg"
                              value={eventData.vaccineDate || ''}
                              onChange={(e) =>
                                setEventData((prev) => ({ ...prev, vaccineDate: e.target.value }))
                              }
                            />
                          </div>
                        </>
                      )}

                      {/* Note */}
                      <div>
                        <label className="block text-green-dark font-semibold mb-2">
                          Descripción del Evento{' '}
                          {eventData.eventType === 'vaccination' ? '(opcional)' : '*'}
                        </label>
                        <textarea
                          className="w-full h-32 p-2 border-2 border-green-dark bg-white rounded-lg field-sizing-content"
                          placeholder="Escribe información sobre el evento..."
                          value={eventData.note}
                          onChange={(e) =>
                            setEventData((prev) => ({ ...prev, note: e.target.value }))
                          }
                        />
                      </div>

                      {/* Cost */}
                      <div>
                        <label className="block text-green-dark font-semibold mb-2">
                          Costo (opcional)
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-green-dark text-xl">$</span>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            className="flex-1 p-2 border-2 border-green-dark bg-white rounded-lg"
                            placeholder="0"
                            value={eventData.cost}
                            onChange={(e) =>
                              setEventData((prev) => ({ ...prev, cost: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <button
                        className="w-full bg-green-dark text-white text-xl px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={
                          eventData.eventType === 'vaccination'
                            ? !eventData.vaccineName?.trim()
                            : !eventData.note.trim()
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          handleEvent();
                        }}
                      >
                        Registrar Evento
                      </button>
                    </div>
                  </section>
                </Modal>
                {!isCaseClosed && (
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
                              setTransitChangeData((prev) => ({
                                ...prev,
                                contactName: e.target.value,
                              }))
                            }
                          />
                        </div>

                        {/* Contacts */}
                        <div>
                          <label className="block text-green-dark font-semibold mb-2">
                            Contactos *
                          </label>
                          {transitChangeData.contacts.map((contact, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                              <select
                                className="p-2 border-2 border-green-dark bg-white rounded-lg"
                                value={contact.type}
                                onChange={(e) => {
                                  const newContacts = [...transitChangeData.contacts];
                                  newContacts[index].type = e.target.value as
                                    | 'celular'
                                    | 'email'
                                    | 'other';
                                  setTransitChangeData((prev) => ({
                                    ...prev,
                                    contacts: newContacts,
                                  }));
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
                                  setTransitChangeData((prev) => ({
                                    ...prev,
                                    contacts: newContacts,
                                  }));
                                }}
                              />
                              {transitChangeData.contacts.length > 1 && (
                                <button
                                  className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                                  onClick={() => {
                                    const newContacts = transitChangeData.contacts.filter(
                                      (_, i) => i !== index
                                    );
                                    setTransitChangeData((prev) => ({
                                      ...prev,
                                      contacts: newContacts,
                                    }));
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
                          <label className="block text-green-dark font-semibold mb-2">
                            Nota del Cambio *
                          </label>
                          <textarea
                            className="w-full h-32 p-2 border-2 border-green-dark bg-white rounded-lg field-sizing-content"
                            placeholder="Escribe información sobre el cambio de tránsito..."
                            value={transitChangeData.note}
                            onChange={(e) =>
                              setTransitChangeData((prev) => ({ ...prev, note: e.target.value }))
                            }
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
                )}
                {isAdopted && (
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
                          <label className="block text-green-dark font-semibold mb-2">
                            Nueva Situación *
                          </label>
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
                          <label className="block text-green-dark font-semibold mb-2">
                            Contactos *
                          </label>
                          {adoptionData.contacts.map((contact, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                              <select
                                className="p-2 border-2 border-green-dark bg-white rounded-lg"
                                value={contact.type}
                                onChange={(e) => {
                                  const newContacts = [...adoptionData.contacts];
                                  newContacts[index].type = e.target.value as
                                    | 'celular'
                                    | 'email'
                                    | 'other';
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
                                    const newContacts = adoptionData.contacts.filter(
                                      (_, i) => i !== index
                                    );
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
                          <label className="block text-green-dark font-semibold mb-2">
                            Nota de Retorno *
                          </label>
                          <textarea
                            className="w-full h-32 p-2 border-2 border-green-dark bg-white rounded-lg field-sizing-content"
                            placeholder="Escribe información sobre el retorno..."
                            value={adoptionData.note}
                            onChange={(e) =>
                              setAdoptionData((prev) => ({ ...prev, note: e.target.value }))
                            }
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
                )}
                {!isCaseClosed && (
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
                          <label className="block text-green-dark font-semibold mb-2">
                            Contactos *
                          </label>
                          {adoptionData.contacts.map((contact, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                              <select
                                className="p-2 border-2 border-green-dark bg-white rounded-lg"
                                value={contact.type}
                                onChange={(e) => {
                                  const newContacts = [...adoptionData.contacts];
                                  newContacts[index].type = e.target.value as
                                    | 'celular'
                                    | 'email'
                                    | 'other';
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
                                    const newContacts = adoptionData.contacts.filter(
                                      (_, i) => i !== index
                                    );
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
                          <label className="block text-green-dark font-semibold mb-2">
                            Nota de Adopción *
                          </label>
                          <textarea
                            className="w-full h-32 p-2 border-2 border-green-dark bg-white rounded-lg field-sizing-content"
                            placeholder="Escribe información sobre la adopción..."
                            value={adoptionData.note}
                            onChange={(e) =>
                              setAdoptionData((prev) => ({ ...prev, note: e.target.value }))
                            }
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
                )}
              </section>
              <section className="flex flex-col sm:flex-row gap-4 px-9 py-4 w-full max-w-7xl items-center justify-center">
                {/* Visible Toggle */}
                {!isCaseClosed && (
                  <div className="flex items-center gap-3 bg-cream-light px-4 py-3 rounded-lg shadow-sm">
                    <EyeIcon size={20} className="text-green-dark" />
                    <span className="text-sm font-semibold text-green-dark">Visible:</span>
                    <label className="flex items-center cursor-pointer" title="Cambiar visibilidad">
                      <input
                        type="checkbox"
                        onChange={() => handleVisibleToggle(!animal.isVisible)}
                        className="sr-only peer"
                        checked={animal.isVisible}
                      />
                      <div className="relative w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>
                )}

                {/* Avalible Toggle */}
                {!isCaseClosed && (
                  <div className="flex items-center gap-3 bg-cream-light px-4 py-3 rounded-lg shadow-sm">
                    <CheckIcon size={20} className="text-green-dark" />
                    <span className="text-sm font-semibold text-green-dark">Disponible:</span>
                    <label
                      className="flex items-center cursor-pointer"
                      title="Cambiar disponibilidad"
                    >
                      <input
                        type="checkbox"
                        onChange={() => handleAvalibleToggle(!animal.isAvalible)}
                        className="sr-only peer"
                        checked={animal.isAvalible}
                      />
                      <div className="relative w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>
                )}

                <Link
                  href={`/plam-admin/animales/editar/${animal.id}`}
                  className="bg-caramel-deep text-white text-3xl px-4 py-2 rounded hover:bg-amber-sunset transition duration-300 flex items-center gap-2"
                >
                  <EditIcon size={24} />
                  Editar
                </Link>
                <Modal
                  buttonStyles=" bg-red-600 text-white text-3xl px-4 py-2 hover:bg-red-700 text-white rounded  transition duration-300"
                  buttonText={
                    <div className="flex flex-row gap-2 justify-center items-center">
                      <TrashIcon size={24} />
                      <span>Eliminar</span>
                    </div>
                  }
                >
                  <section className="flex flex-col items-center justify-around bg-white w-full min-h-full p-4 gap-1 text-center ">
                    <h2 className="text-2xl font-bold">
                      ¿Estás seguro de que quieres enviarlo a la papelera de reciclaje?
                    </h2>
                    <article className="grid grid-rows-[1fr_auto] rounded-xl overflow-hidden shadow-lg bg-cream-light w-3/5 h-auto">
                      <div className="aspect-square">
                        <Image
                          className="w-full h-full object-cover bg-white"
                          src={animal.images[0].imgUrl}
                          alt={animal.images[0].imgAlt}
                          width={300}
                          height={300}
                        />
                      </div>
                      <div className="flex flex-col items-center justify-between gap-1 p-2">
                        <span className="uppercase text-2xl text-center font-extrabold">
                          Nombre: {animal.name}
                        </span>
                        <span className="uppercase text-2xl text-center font-extrabold">
                          Id :{animal.id}
                        </span>
                        <button
                          onClick={() => handleDelete(animal.id)}
                          className="bg-red-600 text-white text-xl px-4 py-2 rounded-lg hover:bg-red-700 transition duration-300"
                        >
                          Eliminar
                        </button>
                      </div>
                    </article>
                  </section>
                </Modal>
              </section>
            </section>
          </>
        )}
        <section className="flex flex-col items-center  bg-cream-light w-full  p-4 gap-1 text-center ">
          <h4 className="font-extrabold text-4xl sm:text-7xl  text-green-dark">Linea del tiempo</h4>
          <p className="text-green-dark text-md font-bold ">
            Este animal ha tenido los siguientes estados a lo largo del tiempo:
          </p>
          <ul className="flex flex-col gap-5 list-disc p-2 text-green-dark max-w-2xl">
            {allAnimalTransactions.map((transaction, index) => {
              return (
                <TransactionCard key={`${index}-${transaction.date}`} transaction={transaction} />
              );
            })}
          </ul>
        </section>
      </div>

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
    </ProtectedRoute>
  );
}
