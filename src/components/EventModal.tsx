import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import {
  AnimalTransactionType,
  PrivateInfoType,
  AnimalActionModalProps,
  EventFormData,
  Img,
  UserType,
} from '@/types';
import { auth } from '@/firebase';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { postTransactionData } from '@/lib/firebase/dashboardAnalytics';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import { revalidateCache } from '@/lib/revalidateCache';
import { createAuditLog } from '@/lib/firebase/createAuditLog';
import { Modal } from '@/components/Modal';
import { CalendarIcon, LockClosedIcon, EditIcon } from '@/components/Icons';
import { eventLabels } from '@/lib/constants/animalLabels';
import { createTimestamp } from '@/lib/dateUtils';
import UploadImages from '@/elements/UploadImage';
import { logger } from '@/lib/logger';
import { normalizeManager } from '@/lib/data/seguimientos';

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
  /** Pre-selects an event type when the modal opens (e.g. from quick-action buttons) */
  defaultEventType?: EventFormData['eventType'];
  /** Authorized users list for the follow-up manager dropdown */
  users?: UserType[];
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
  defaultEventType,
  users,
}: EventModalProps): React.ReactElement {
  const [eventModalOpen, setEventModalOpen] = useState<boolean>(false);
  const [eventData, setEventData] = useState<EventFormData>(DEFAULT_EVENT_DATA);

  // --- Rename state ---
  const [renameName, setRenameName] = useState<string>('');

  // --- Next follow-up date state (only when adopted + followup) ---
  const [nextFollowUpDateStr, setNextFollowUpDateStr] = useState<string>('');
  const [quickDayValue, setQuickDayValue] = useState<string>('');
  const [closeCase, setCloseCase] = useState<boolean>(false);
  const [eventImage, setEventImage] = useState<Img | null>(null);

  // --- Follow-up manager view state ---
  const [showManagerView, setShowManagerView] = useState<boolean>(false);
  const [selectedFollowUpManagers, setSelectedFollowUpManagers] = useState<string[]>([]);

  const filteredUsers = (users || []).filter((u) => u.role !== 'user');
  const currentManagers = normalizeManager(privateInfo.followUpManager);
  const hasCustomManager = currentManagers.some((e) => !e.includes('@'));

  /** Resolve user email to display name */
  const getUserName = (email: string): string =>
    (users || []).find((u) => u.id === email)?.name ?? email;

  /** Toggle a manager email in the selection */
  const toggleManager = (email: string): void => {
    setSelectedFollowUpManagers((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : eventModalOpen;
  const setIsOpen = controlledSetIsOpen || setEventModalOpen;

  const isDeceased = animal.status === 'fallecido';
  const isAdopted = animal.status === 'adoptado';
  const isFollowUp = eventData.eventType === 'followup';
  const showFollowUpDate = isFollowUp && isAdopted;

  /**
   * Sync the closeCase checkbox with the actual follow-up status
   * whenever the modal opens or the status changes externally.
   */
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCloseCase(privateInfo.followUpStatus === 'closed');
    }
  }, [isOpen, privateInfo.followUpStatus]);

  /**
   * Pre-select the event type when the modal is opened via a quick-action button
   * (e.g. "Esterilización" or "Vacunación" buttons from the seguimientos table).
   */
  useEffect(() => {
    if (isOpen && defaultEventType) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEventData((prev) => ({ ...prev, eventType: defaultEventType }));
    }
  }, [isOpen, defaultEventType]);

  /**
   * Sync rename input when the rename event type is selected.
   * Pre-fills with the current newName if it exists.
   */
  useEffect(() => {
    if (eventData.eventType === 'rename') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRenameName(privateInfo.newName || '');
    }
  }, [eventData.eventType, privateInfo.newName]);

  const handleEvent = async (): Promise<void> => {
    // --- Rename flow (early return — simpler than other events) ---
    if (eventData.eventType === 'rename') {
      const oldName = privateInfo.newName || '';
      const newName = renameName.trim();

      if (newName === oldName) {
        handleToast({
          type: 'warning',
          title: 'Sin cambios',
          text: 'El nombre no ha cambiado',
        });
        return;
      }

      setIsOpen(false);

      const now = createTimestamp();
      const renameNote =
        newName && oldName
          ? `[${eventLabels.rename}] - Renombró de "${oldName}" a "${newName}"`
          : newName
            ? `[${eventLabels.rename}] - Asignó nuevo nombre: "${newName}"`
            : `[${eventLabels.rename}] - Eliminó el nombre "${oldName}"`;

      const userNote = eventData.note.trim();
      const renameNotes = userNote ? [renameNote, userNote] : [renameNote];

      const updatedPrivateInfo: PrivateInfoType = {
        ...privateInfo,
        newName: newName || '',
        notes: [...(privateInfo.notes || []), ...renameNotes],
      };

      const newTransactionData: AnimalTransactionType = {
        id: privateInfo.id,
        name: privateInfo.name || '',
        img: animal.images?.[0],
        transactionType: 'rename',
        date: now,
        modifiedBy: auth.currentUser?.email || 'system',
        since: now,
        changes: {
          before: { newName: oldName || '' },
          after: { newName: newName || '' },
        },
      };

      // Optimistic UI
      setPrivateInfo(updatedPrivateInfo);
      setAllAnimalTransactions((prev) => [newTransactionData, ...prev]);

      try {
        await createAuditLog({
          type: 'animal',
          action: 'update',
          entityId: privateInfo.id,
          entityName: privateInfo.name || animal.name,
          modifiedBy: auth.currentUser?.email || 'system',
          changes: {
            before: { newName: oldName || '(vacío)' },
            after: { newName: newName || '(vacío)' },
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
              pending: { title: 'Renombrando', text: 'Actualizando nombre...' },
              success: {
                title: 'Nombre actualizado',
                text: newName
                  ? `El animal ahora se llama "${newName}"`
                  : 'Nombre eliminado correctamente',
              },
              error: { title: 'Error', text: 'No se pudo actualizar el nombre' },
            },
          }
        );

        setEventData(DEFAULT_EVENT_DATA);
        setRenameName('');
        onEventSaved?.();
      } catch (error) {
        logger({
          level: 'error',
          code: 'RENAME_ERROR',
          message: 'Error renaming animal:',
          data: error,
        });
        setPrivateInfo(privateInfo);
        setAllAnimalTransactions((prev) => prev.filter((t) => t.date !== newTransactionData.date));
      }

      return;
    }

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
        nextFollowUpDate: 0,
      }),
      ...(eventImage && {
        eventImages: [...(privateInfo.eventImages || []), eventImage],
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
      img: animal.images?.[0],
      eventImg: eventImage || undefined,
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
      // Audit log BEFORE main operation
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

  /**
   * Reopens a closed follow-up case and switches the event type to follow-up
   * so the user can immediately schedule the next follow-up date.
   */
  const handleReopenCase = async (): Promise<void> => {
    const docRef = doc(db, 'animalPrivateInfo', privateInfo.id);

    // Optimistic UI — reopen case and switch to follow-up event type
    setPrivateInfo((prev) => {
      if (!prev) return prev;
      return { ...prev, followUpStatus: 'active' as const, nextFollowUpDate: 0 };
    });
    setCloseCase(false);
    setEventData((prev) => ({ ...prev, eventType: 'followup' }));

    try {
      await createAuditLog({
        type: 'animal',
        action: 'update',
        entityId: privateInfo.id,
        entityName: privateInfo.name || animal.name,
        modifiedBy: auth.currentUser?.email || 'system',
        changes: {
          before: { followUpStatus: 'closed' },
          after: { followUpStatus: 'active' },
        },
      });

      await handlePromiseToast(
        updateDoc(docRef, { followUpStatus: 'active', nextFollowUpDate: 0 }),
        {
          messages: {
            pending: { title: 'Reabriendo caso', text: 'Por favor espera...' },
            success: {
              title: 'Caso reabierto',
              text: 'Programá el próximo seguimiento',
            },
            error: { title: 'Error', text: 'No se pudo reabrir el caso' },
          },
        }
      );

      onEventSaved?.();
    } catch (error) {
      // Revert optimistic UI on failure
      setPrivateInfo((prev) => {
        if (!prev) return prev;
        return { ...prev, followUpStatus: 'closed' as const };
      });
      setCloseCase(true);
      logger({
        level: 'error',
        code: 'REOPEN_CASE_ERROR',
        message: 'Error reopening follow-up case:',
        data: error,
      });
    }
  };

  /**
   * Saves the updated follow-up manager list to Firestore.
   * Uses optimistic UI and creates an audit log.
   */
  const handleSaveFollowUpManager = async (): Promise<void> => {
    const updated = [...new Set(selectedFollowUpManagers)].filter(Boolean);
    if (updated.join(',') === currentManagers.join(',')) {
      setShowManagerView(false);
      return;
    }

    const newPI: PrivateInfoType = { ...privateInfo, followUpManager: updated };
    setPrivateInfo(newPI);

    try {
      await createAuditLog({
        type: 'animal',
        action: 'update',
        entityId: privateInfo.id,
        entityName: privateInfo.name || animal.name,
        modifiedBy: auth.currentUser?.email || 'system',
        changes: {
          before: { followUpManager: currentManagers },
          after: { followUpManager: updated },
        },
      });

      await handlePromiseToast(
        postFirestoreData<PrivateInfoType>({
          data: newPI,
          currentCollection: 'animalPrivateInfo',
          id: privateInfo.id,
        }),
        {
          messages: {
            pending: { title: 'Guardando', text: 'Actualizando responsable...' },
            success: { title: 'Actualizado', text: 'Responsable actualizado correctamente' },
            error: { title: 'Error', text: 'No se pudo actualizar' },
          },
        }
      );

      onEventSaved?.();
      setShowManagerView(false);
    } catch (error) {
      setPrivateInfo(privateInfo);
      setShowManagerView(false);
      logger({
        level: 'error',
        code: 'UPDATE_FOLLOWUP_MANAGER',
        message: 'Error updating follow-up manager:',
        data: error,
      });
    }
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
        {showManagerView ? (
          <>
            <h2 className="font-extrabold text-4xl sm:text-5xl text-green-dark text-center">
              Responsable del seguimiento
            </h2>
            <div className="w-full max-w-2xl space-y-4">
              <p className="text-sm text-gray-500 text-center">
                {animal.name} —{' '}
                {currentManagers.length === 0
                  ? 'Sin responsable asignado'
                  : `Actualmente: ${currentManagers.map((e) => getUserName(e)).join(', ')}`}
              </p>
              <div className="border-2 border-green-dark bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No hay usuarios disponibles
                  </p>
                ) : (
                  filteredUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-green-50 cursor-pointer border-b border-gray-100"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFollowUpManagers.includes(user.id)}
                        onChange={() => toggleManager(user.id)}
                        className="accent-green-700"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="block text-base font-medium text-gray-900 truncate">
                          {user.name}
                        </span>
                        <span className="block text-sm text-gray-500 truncate">{user.id}</span>
                      </div>
                    </label>
                  ))
                )}
              </div>
              {selectedFollowUpManagers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedFollowUpManagers.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-sm px-3 py-1.5 rounded-lg"
                    >
                      {getUserName(email)}
                      <button
                        type="button"
                        onClick={() => toggleManager(email)}
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
                  type="button"
                  onClick={handleSaveFollowUpManager}
                  className="flex-1 bg-green-dark text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setShowManagerView(false)}
                  className="px-4 py-2 border-2 border-green-dark text-green-dark rounded-lg hover:bg-green-50 transition-colors"
                >
                  Volver
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-extrabold text-4xl sm:text-5xl text-green-dark text-center">
              Registrar Evento
            </h2>
            <div className="w-full max-w-2xl space-y-4">
              {/* Closed case banner — shown when follow-up case is closed */}
              {isAdopted && privateInfo.followUpStatus === 'closed' && (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <LockClosedIcon size={20} className="flex-shrink-0 mt-0.5 text-amber-600" />
                    <div className="flex-1">
                      <h3 className="text-amber-800 font-semibold text-sm">
                        Este caso de seguimiento está cerrado
                      </h3>
                      <p className="text-amber-700 text-xs mt-1">
                        No se realizarán más seguimientos para este animal.
                      </p>
                      <button
                        type="button"
                        onClick={handleReopenCase}
                        className="mt-3 bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-1.5 rounded-lg transition-colors"
                      >
                        Reabrir caso
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
                  {isAdopted && <option value="rename">Renombrar</option>}
                  {!isDeceased && <option value="deceased">Fallecimiento</option>}
                  <option value="other">Otro</option>
                </select>
              </div>

              {/* Rename UI — replaces the full form when rename event is selected */}
              {eventData.eventType === 'rename' && isAdopted && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-green-dark font-semibold mb-2">Nuevo nombre</label>
                    <p className="text-xs text-gray-500 mb-2">
                      {privateInfo.newName
                        ? `Nombre actual del adoptante: "${privateInfo.newName}". Dejalo vacío para eliminar el nombre.`
                        : `El animal se llama "${animal.name}". Asignale un nuevo nombre dado por el adoptante.`}
                    </p>
                    <input
                      type="text"
                      className="w-full p-2 border-2 border-green-dark bg-white rounded-lg"
                      placeholder={animal.name}
                      value={renameName}
                      onChange={(e) => setRenameName(e.target.value)}
                    />
                  </div>

                  {/* Optional note */}
                  <div>
                    <label className="block text-green-dark font-semibold mb-2">
                      Nota adicional (opcional)
                    </label>
                    <textarea
                      className="w-full h-20 p-2 border-2 border-green-dark bg-white rounded-lg field-sizing-content"
                      placeholder="Comentario sobre el cambio de nombre..."
                      value={eventData.note}
                      onChange={(e) => setEventData((prev) => ({ ...prev, note: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Vaccination specific fields */}
              {eventData.eventType !== 'rename' && eventData.eventType === 'vaccination' && (
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

              {/* Note, image, cost, follow-up — hidden when rename is selected */}
              {eventData.eventType !== 'rename' && (
                <>
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
                      onChange={(e) => setEventData((prev) => ({ ...prev, note: e.target.value }))}
                    />
                  </div>

                  {/* Event image upload */}
                  <div>
                    <label className="block text-green-dark font-semibold mb-2">
                      Imagen (opcional)
                    </label>
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

                      {/* Close case checkbox — only shown when case is currently open */}
                      {privateInfo.followUpStatus !== 'closed' && (
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
                      )}

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
                              {new Date(nextFollowUpDateStr + 'T00:00:00').toLocaleDateString(
                                'es-UY',
                                {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                }
                              )}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}

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

                  {/* Follow-up manager — only for adopted animals */}
                  {isAdopted && (
                    <div className="border-2 border-green-dark rounded-lg p-4 bg-white">
                      <label className="block text-green-dark font-semibold mb-2">
                        Responsable del seguimiento
                      </label>
                      {currentManagers.length === 0 ? (
                        <p className="text-sm text-gray-500 mb-2">
                          Sin asignar — asigná un responsable
                        </p>
                      ) : (
                        <>
                          <p className="text-sm text-gray-700 mb-1">
                            {currentManagers.map((e) => getUserName(e)).join(', ')}
                          </p>
                          {hasCustomManager && (
                            <p className="text-xs text-amber-700 mb-2">
                              Conviene seleccionar de la lista de usuarios
                            </p>
                          )}
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFollowUpManagers([...currentManagers]);
                          setShowManagerView(true);
                        }}
                        className="flex items-center gap-1 text-xs bg-green-dark text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
                      >
                        <EditIcon size={14} />
                        <span>{currentManagers.length === 0 ? 'Asignar' : 'Cambiar'}</span>
                      </button>
                    </div>
                  )}

                  {/* End of hidden sections for rename */}
                </>
              )}

              <button
                className="w-full bg-green-dark text-white text-xl px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  eventData.eventType === 'rename'
                    ? renameName.trim() === (privateInfo.newName || '')
                    : eventData.eventType === 'vaccination'
                      ? !eventData.vaccineName?.trim()
                      : !eventData.note.trim()
                }
                onClick={(e) => {
                  e.preventDefault();
                  handleEvent();
                }}
              >
                {eventData.eventType === 'rename' ? 'Renombrar' : 'Registrar Evento'}
              </button>
            </div>
          </>
        )}
      </section>
    </Modal>
  );
}
