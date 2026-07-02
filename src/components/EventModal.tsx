import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import {
  AnimalTransactionType,
  PrivateInfoType,
  AnimalActionModalProps,
  EventFormData,
  Img,
} from '@/types';
import { auth } from '@/firebase';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { postTransactionData } from '@/lib/firebase/dashboardAnalytics';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import { revalidateCache } from '@/lib/revalidateCache';
import { Modal } from '@/components/Modal';
import { CalendarIcon } from '@/components/Icons';
import { eventLabels } from '@/lib/constants/animalLabels';
import { createTimestamp } from '@/lib/dateUtils';
import UploadImages from '@/elements/UploadImage';
import { logger } from '@/lib/logger';

/** Default values for event form */
const DEFAULT_EVENT_DATA: EventFormData = {
  eventType: 'followup',
  note: '',
  cost: '',
  vaccineName: '',
  vaccineDate: new Date().toISOString().split('T')[0],
};

/**
 * Extracts a numeric string from user input for follow-up interval.
 * Supports formats like "30", "30d", "30 días", etc.
 */
function extractDays(value: string): number | null {
  const match = value.match(/^(\d+)/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

/** Generates date strings for quick-select buttons */
function quickDateOptions(): { label: string; days: number }[] {
  return [
    { label: '+15 días', days: 15 },
    { label: '+30 días', days: 30 },
    { label: '+60 días', days: 60 },
    { label: '+90 días', days: 90 },
    { label: '+6 meses', days: 180 },
    { label: '+1 año', days: 365 },
  ];
}

interface EventModalProps extends AnimalActionModalProps {
  /** When true, hides the trigger button (useful when controlling from outside) */
  hideTriggerButton?: boolean;
  /**
   * Controls whether the modal is open (for external control).
   * When provided together with setIsOpen, the component operates in controlled mode.
   */
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  /** Called after a successful event save */
  onEventSaved?: () => void;
}

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
  hideTriggerButton = false,
  isOpen: controlledIsOpen,
  setIsOpen: controlledSetIsOpen,
  onEventSaved,
}: EventModalProps): React.ReactElement {
  const [eventModalOpen, setEventModalOpen] = useState<boolean>(false);
  const [eventData, setEventData] = useState<EventFormData>(DEFAULT_EVENT_DATA);

  // --- Next follow-up date state (only when adopted + followup) ---
  const [nextFollowUpDateStr, setNextFollowUpDateStr] = useState<string>('');
  const [quickDayValue, setQuickDayValue] = useState<string>('');
  const [closeCase, setCloseCase] = useState<boolean>(false);
  const [eventImage, setEventImage] = useState<Img | null>(null);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : eventModalOpen;
  const setIsOpen = controlledSetIsOpen || setEventModalOpen;

  const isDeceased = animal.status === 'fallecido';
  const isAdopted = animal.status === 'adoptado';
  const isFollowUp = eventData.eventType === 'followup';
  const showFollowUpDate = isFollowUp && isAdopted;

  const handleEvent = async (): Promise<void> => {
    setIsOpen(false);

    const notePrefix = `[${eventLabels[eventData.eventType]}] - `;
    const costValue = eventData.cost.trim() ? parseFloat(eventData.cost) : undefined;
    const isDeceasedEvent = eventData.eventType === 'deceased';
    const isVaccination = eventData.eventType === 'vaccination';
    const isSterilization = eventData.eventType === 'sterilization';

    // Parse next follow-up date
    let parsedNextDate: number | undefined;
    if (showFollowUpDate) {
      const days = extractDays(quickDayValue);
      if (days !== null && days > 0) {
        parsedNextDate = createTimestamp() + days * 24 * 60 * 60 * 1000;
      } else if (nextFollowUpDateStr) {
        const parsed = new Date(nextFollowUpDateStr + 'T00:00:00');
        if (!isNaN(parsed.getTime())) {
          parsedNextDate = parsed.getTime();
        }
      }
    }

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
    const now = createTimestamp();

    const updatedPrivateInfo: PrivateInfoType = {
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
      ...(parsedNextDate !== undefined && {
        nextFollowUpDate: parsedNextDate,
      }),
      // ─── Seguimiento denormalized fields ───
      ...(isSterilization && {
        isSterilized: 'si' as const,
        sterilizationDate: now,
      }),
      ...(isFollowUp &&
        isAdopted && {
          lastFollowUpDate: now,
          lastFollowUpNote: eventData.note,
          ...(closeCase && { followUpStatus: 'closed' as const, nextFollowUpDate: 0 }),
        }),
      ...(isDeceasedEvent && {
        followUpStatus: 'closed' as const,
      }),
    };

    const updatedAnimal = {
      ...animal,
      ...(isDeceasedEvent && {
        status: 'fallecido' as const,
        isAvailable: false,
        isVisible: false,
      }),
      ...(isSterilization && { isSterilized: 'si' as const }),
    };

    const newTransactionData: AnimalTransactionType = {
      id: privateInfo.id,
      name: privateInfo.name || '',
      img: eventImage || animal.images[0],
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
        ...(isSterilization && {
          before: { isSterilized: animal.isSterilized },
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
          ...(isSterilization && { isSterilized: 'si' }),
        },
      },
    };

    // Optimistic UI
    setPrivateInfo(updatedPrivateInfo);
    setAllAnimalTransactions((prev) => [newTransactionData, ...prev]);
    if (isDeceasedEvent || isSterilization) {
      setAnimal(updatedAnimal);
    }

    try {
      const promises: Promise<unknown>[] = [
        postFirestoreData<PrivateInfoType>({
          data: updatedPrivateInfo,
          currentCollection: 'animalPrivateInfo',
          id: privateInfo.id,
        }),
        postTransactionData({
          data: newTransactionData,
        }),
        ...(isDeceasedEvent || isSterilization
          ? [
              postFirestoreData({
                data: updatedAnimal,
                currentCollection: 'animals',
                id: animal.id,
              }),
            ]
          : []),
      ];

      // If nextFollowUpDate was set, also update it directly via updateDoc
      // to ensure it's set even if the postFirestoreData merge doesn't include it
      if (parsedNextDate !== undefined) {
        const piRef = doc(db, 'animalPrivateInfo', privateInfo.id);
        promises.push(updateDoc(piRef, { nextFollowUpDate: parsedNextDate }));
      }

      // When closing a case via followup, ensure nextFollowUpDate is reset
      if (isFollowUp && isAdopted && closeCase) {
        const piRef = doc(db, 'animalPrivateInfo', privateInfo.id);
        promises.push(updateDoc(piRef, { nextFollowUpDate: 0 }));
      }

      await handlePromiseToast(Promise.all(promises), {
        messages: {
          pending: { title: 'Registrando evento', text: 'Por favor espera...' },
          success: { title: 'Evento registrado', text: 'El evento se registró exitosamente' },
          error: { title: 'Error', text: 'No se pudo registrar el evento' },
        },
      });

      if (isDeceasedEvent || isSterilization) {
        await revalidateCache('animals');
      }

      setEventData(DEFAULT_EVENT_DATA);
      setNextFollowUpDateStr('');
      setQuickDayValue('');
      setCloseCase(false);
      setEventImage(null);
      onEventSaved?.();
    } catch (error) {
      logger({
        level: 'error',
        code: 'EVENT_ERROR',
        message: 'Error handling event registration:',
        data: error,
      });
      setPrivateInfo(privateInfo);
      setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransactionData.date));
      if (isDeceasedEvent || isSterilization) {
        setAnimal(animal);
      }
    }
  };

  const handleQuickDateForFollowUp = (days: number): void => {
    const targetDate = createTimestamp() + days * 24 * 60 * 60 * 1000;
    setNextFollowUpDateStr(new Date(targetDate).toISOString().split('T')[0]);
  };

  const handleQuickDaysForFollowUp = (): void => {
    const days = extractDays(quickDayValue);
    if (days === null || days <= 0) {
      handleToast({
        type: 'warning',
        title: 'Valor inválido',
        text: 'Ingresa un número válido de días',
      });
      return;
    }
    const targetDate = createTimestamp() + days * 24 * 60 * 60 * 1000;
    setNextFollowUpDateStr(new Date(targetDate).toISOString().split('T')[0]);
    setQuickDayValue('');
  };

  return (
    <Modal
      buttonStyles={
        hideTriggerButton
          ? 'hidden'
          : 'bg-blue-600 text-white text-3xl px-4 py-2 rounded hover:bg-blue-700 transition duration-300'
      }
      buttonText={
        <div className="flex flex-row gap-2 justify-center items-center">
          <CalendarIcon size={24} />
          <span>Registrar Evento</span>
        </div>
      }
      isOpen={isOpen}
      setIsOpen={setIsOpen}
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
              {!isDeceased && <option value="followup">Seguimiento</option>}
              {!isDeceased && <option value="vaccination">Vacunación</option>}
              {!isDeceased && <option value="sterilization">Esterilización</option>}
              {!isDeceased && <option value="medical">Médico</option>}
              {!isDeceased && <option value="emergency">Emergencia</option>}
              {!isDeceased && <option value="supply">Suministro alimento insumos etc</option>}
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

          {/* Event image upload */}
          <div>
            <label className="block text-green-dark font-semibold mb-2">Imagen (opcional)</label>
            {eventImage ? (
              <div className="flex items-center gap-3">
                <img
                  src={eventImage.imgUrl}
                  alt={eventImage.imgAlt}
                  className="w-20 h-20 object-cover rounded-lg border-2 border-green-dark"
                />
                <button
                  type="button"
                  onClick={() => setEventImage(null)}
                  className="text-red-600 hover:text-red-800 text-sm underline"
                >
                  Quitar imagen
                </button>
              </div>
            ) : (
              <UploadImages
                maxFiles={1}
                currentFolder="follow_up"
                onImagesAdd={(imgs) => {
                  if (imgs[0]) {
                    setEventImage({
                      ...imgs[0],
                      imgAlt: `Evento ${eventLabels[eventData.eventType]} - ${animal.name}`,
                    });
                  }
                }}
              />
            )}
          </div>

          {/* Next follow-up date (only for adopted animals + followup events) */}
          {showFollowUpDate && (
            <div className="border-2 border-green-dark rounded-lg p-4 bg-white">
              <label className="block text-green-dark font-semibold mb-2">
                Próxima fecha de seguimiento (opcional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Programa la próxima fecha en la que se debe contactar al adoptante
              </p>

              {/* Close case checkbox */}
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={closeCase}
                  onChange={(e) => {
                    setCloseCase(e.target.checked);
                    if (e.target.checked) {
                      setNextFollowUpDateStr('');
                      setQuickDayValue('');
                    }
                  }}
                  className="w-4 h-4 accent-red-600"
                />
                <span className="text-sm text-red-700 font-medium">
                  Cerrar caso — no se hará más seguimiento
                </span>
              </label>

              {!closeCase && (
                <>
                  {/* Quick action buttons */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {quickDateOptions().map((opt) => (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => handleQuickDateForFollowUp(opt.days)}
                        className="text-xs bg-green-dark text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {/* Custom date picker */}
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="date"
                      className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                      value={nextFollowUpDateStr}
                      onChange={(e) => setNextFollowUpDateStr(e.target.value)}
                    />
                  </div>
                  {/* Quick N days input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="w-20 p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="N días"
                      value={quickDayValue}
                      onChange={(e) => setQuickDayValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickDaysForFollowUp();
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleQuickDaysForFollowUp}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                    >
                      + días
                    </button>
                  </div>
                  {nextFollowUpDateStr && (
                    <p className="text-xs text-green-700 mt-2 font-medium">
                      Fecha seleccionada:{' '}
                      {new Date(nextFollowUpDateStr + 'T00:00:00').toLocaleDateString('es-UY', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

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
