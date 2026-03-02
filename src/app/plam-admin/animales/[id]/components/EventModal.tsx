import { useState } from 'react';
import { AnimalTransactionType, PrivateInfoType } from '@/types';
import { auth } from '@/firebase';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { postTransactionData } from '@/lib/firebase/dashboardAnalytics';
import { handlePromiseToast } from '@/lib/handleToast';
import { revalidateCache } from '@/lib/revalidateCache';
import { Modal } from '@/components/Modal';
import { CalendarIcon } from '@/components/Icons';
import { eventLabels } from '@/lib/constants/animalLabels';
import { AnimalActionModalProps, EventFormData, DEFAULT_EVENT_DATA } from '../types';
import { createTimestamp } from '@/lib/dateUtils';

/**
 * Modal component for registering animal events (medical, vaccination,
 * sterilization, emergency, supply, followup, deceased, other).
 * Handles optimistic UI updates and Firestore persistence.
 */
export default function EventModal({
  animal,
  privateInfo,
  setAnimal,
  setPrivateInfo,
  setAllAnimalTransactions,
}: AnimalActionModalProps): React.ReactElement {
  const [eventModalOpen, setEventModalOpen] = useState<boolean>(false);
  const [eventData, setEventData] = useState<EventFormData>(DEFAULT_EVENT_DATA);

  const isDeceased = animal.status === 'fallecido';

  const handleEvent = async (): Promise<void> => {
    setEventModalOpen(false);

    const notePrefix = `[${eventLabels[eventData.eventType]}] - `;
    const costValue = eventData.cost.trim() ? parseFloat(eventData.cost) : undefined;
    const isDeceasedEvent = eventData.eventType === 'deceased';
    const isVaccination = eventData.eventType === 'vaccination';

    const newVaccination =
      isVaccination && eventData.vaccineName?.trim()
        ? {
            vaccine: eventData.vaccineName.trim(),
            date: eventData.vaccineDate
              ? new Date(eventData.vaccineDate).getTime()
              : createTimestamp(),
          }
        : null;

    const shouldAddNote = eventData.note.trim() !== '';
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

    const updatedAnimal = isDeceasedEvent
      ? { ...animal, status: 'fallecido' as const, isAvailable: false, isVisible: false }
      : animal;

    const now = createTimestamp();

    const newTransactionData: AnimalTransactionType = {
      id: privateInfo.id,
      name: privateInfo.name || '',
      img: animal.images[0],
      transactionType: eventData.eventType,
      date: now,
      modifiedBy: auth.currentUser?.email || 'system',
      since: now,
      cost: costValue,
      ...(newVaccination && { vaccinations: [newVaccination] }),
      changes: {
        ...(isVaccination &&
          newVaccination && {
            before: { vaccinations: privateInfo.vaccinations || [] },
          }),
        ...(costValue && {
          before: {
            ...(isVaccination &&
              newVaccination && { vaccinations: privateInfo.vaccinations || [] }),
            totalCost: currentTotalCost,
          },
        }),
        ...(isDeceasedEvent && {
          before: {
            status: animal.status,
            isVisible: animal.isVisible,
            isAvailable: animal.isAvailable,
          },
        }),
        after: {
          ...(shouldAddNote && { notes: [notePrefix + eventData.note] }),
          ...(newVaccination && {
            vaccinations: [
              ...(privateInfo.vaccinations || []),
              { ...newVaccination, vaccine: '> ' + newVaccination.vaccine },
            ],
          }),
          ...(costValue && { totalCost: newTotalCost }),
          ...(isDeceasedEvent && { status: 'fallecido', isVisible: false, isAvailable: false }),
        },
      },
    };

    // Optimistic UI
    setPrivateInfo(updatedPrivateInfo);
    setAllAnimalTransactions((prev) => [newTransactionData, ...prev]);
    if (isDeceasedEvent) {
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
          postTransactionData({
            data: newTransactionData,
          }),
          ...(isDeceasedEvent
            ? [
                postFirestoreData({
                  data: updatedAnimal,
                  currentCollection: 'animals',
                  id: animal.id,
                }),
              ]
            : []),
        ]),
        {
          messages: {
            pending: { title: 'Registrando evento', text: 'Por favor espera...' },
            success: { title: 'Evento registrado', text: 'El evento se registró exitosamente' },
            error: { title: 'Error', text: 'No se pudo registrar el evento' },
          },
        }
      );

      if (isDeceasedEvent) {
        await revalidateCache('animals');
      }

      setEventData(DEFAULT_EVENT_DATA);
    } catch (error) {
      console.error('Error handling event registration:', error);
      setPrivateInfo(privateInfo);
      setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransactionData.date));
      if (isDeceasedEvent) {
        setAnimal(animal);
      }
    }
  };

  return (
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
            <label className="block text-green-dark font-semibold mb-2">Tipo de Evento *</label>
            <select
              className="w-full p-2 border-2 border-green-dark bg-white rounded-lg"
              value={eventData.eventType}
              onChange={(e) =>
                setEventData((prev) => ({
                  ...prev,
                  eventType: e.target.value as EventFormData['eventType'],
                }))
              }
            >
              {!isDeceased && <option value="medical">Médico</option>}
              {!isDeceased && <option value="vaccination">Vacunación</option>}
              {!isDeceased && <option value="sterilization">Esterilización</option>}
              {!isDeceased && <option value="emergency">Emergencia</option>}
              {!isDeceased && <option value="supply">Suministro alimento insumos etc</option>}
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
              Descripción del Evento {eventData.eventType === 'vaccination' ? '(opcional)' : '*'}
            </label>
            <textarea
              className="w-full h-32 p-2 border-2 border-green-dark bg-white rounded-lg field-sizing-content"
              placeholder="Escribe información sobre el evento..."
              value={eventData.note}
              onChange={(e) => setEventData((prev) => ({ ...prev, note: e.target.value }))}
            />
          </div>

          {/* Cost */}
          <div>
            <label className="block text-green-dark font-semibold mb-2">Costo (opcional)</label>
            <div className="flex items-center gap-2">
              <span className="text-green-dark text-xl">$</span>
              <input
                type="number"
                step="1"
                min="0"
                className="flex-1 p-2 border-2 border-green-dark bg-white rounded-lg"
                placeholder="0"
                value={eventData.cost}
                onChange={(e) => setEventData((prev) => ({ ...prev, cost: e.target.value }))}
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
  );
}
