import { AnimalTransactionType, Animal, PrivateInfoType, Img } from '@/types';

interface BaseTransactionParams {
  animalId: string;
  animalName: string;
  animalImage?: Img;
  modifiedBy: string;
}

interface NoteTransactionParams extends BaseTransactionParams {
  note?: string;
  noteDeleted?: string;
}

interface AdoptionTransactionParams extends BaseTransactionParams {
  currentAnimal: Animal;
  currentPrivateInfo: PrivateInfoType;
  contactName: string;
  contacts: Array<{ type: 'celular' | 'email' | 'other'; value: string }>;
  note: string;
}

interface ReturnTransactionParams extends BaseTransactionParams {
  currentAnimal: Animal;
  currentPrivateInfo: PrivateInfoType;
  contactName: string;
  contacts: Array<{ type: 'celular' | 'email' | 'other'; value: string }>;
  note: string;
  newStatus: 'transitorio' | 'adoptado';
}

interface TransitChangeTransactionParams extends BaseTransactionParams {
  currentPrivateInfo: PrivateInfoType;
  contactName: string;
  contacts: Array<{ type: 'celular' | 'email' | 'other'; value: string }>;
  note: string;
}

interface EventTransactionParams extends BaseTransactionParams {
  currentPrivateInfo: PrivateInfoType;
  eventType:
    | 'medical'
    | 'vaccination'
    | 'sterilization'
    | 'emergency'
    | 'supply'
    | 'followup'
    | 'other';
  note: string;
  cost?: number;
  vaccination?: { vaccine: string; date: number };
}

interface UpdateTransactionParams extends BaseTransactionParams {
  before: Partial<Animal> & Partial<PrivateInfoType>;
  after: Partial<Animal> & Partial<PrivateInfoType>;
}

interface DeleteTransactionParams extends BaseTransactionParams {
  animalData: Animal;
  privateInfoData: PrivateInfoType;
  isHardDelete?: boolean;
}

/**
 * Creates a base transaction object with common fields
 */
function createBaseTransaction(params: BaseTransactionParams): Partial<AnimalTransactionType> {
  return {
    id: params.animalId,
    name: params.animalName,
    img: params.animalImage,
    date: Date.now(),
    modifiedBy: params.modifiedBy,
    since: Date.now(),
  };
}

/**
 * Creates a transaction for adding or deleting a note
 */
export function createNoteTransaction(params: NoteTransactionParams): AnimalTransactionType {
  const base = createBaseTransaction(params);

  return {
    ...base,
    transactionType: 'note',
    changes: {
      ...(params.noteDeleted && { before: { notes: [params.noteDeleted] } }),
      ...(params.note && { after: { notes: [params.note] } }),
    },
  } as AnimalTransactionType;
}

/**
 * Creates a transaction for adoption registration
 */
export function createAdoptionTransaction(
  params: AdoptionTransactionParams
): AnimalTransactionType {
  const base = createBaseTransaction(params);
  const notePrefix = '[Nota de adopción] - ';
  const filteredContacts = params.contacts.filter((c) => c.value.trim() !== '');

  return {
    ...base,
    transactionType: 'adoption',
    status: 'adoptado',
    isAvalible: false,
    isVisible: false,
    contactName: params.contactName,
    contacts: filteredContacts,
    changes: {
      before: {
        status: params.currentAnimal.status,
        isAvalible: params.currentAnimal.isAvalible,
        isVisible: params.currentAnimal.isVisible,
        contactName: params.currentPrivateInfo.contactName,
        contacts: params.currentPrivateInfo.contacts,
      },
      after: {
        status: 'adoptado',
        isAvalible: false,
        isVisible: false,
        contactName: params.contactName,
        contacts: filteredContacts,
        notes: [notePrefix + params.note],
      },
    },
  } as AnimalTransactionType;
}

/**
 * Creates a transaction for return from adoption or re-adoption
 */
export function createReturnTransaction(params: ReturnTransactionParams): AnimalTransactionType {
  const base = createBaseTransaction(params);
  const isGoingToNewAdopter = params.newStatus === 'adoptado';
  const notePrefix = isGoingToNewAdopter ? '[Nota de re-adopción] - ' : '[Nota de retorno] - ';
  const filteredContacts = params.contacts.filter((c) => c.value.trim() !== '');

  return {
    ...base,
    transactionType: isGoingToNewAdopter ? 'adoption' : 'return',
    status: params.newStatus,
    isAvalible: !isGoingToNewAdopter,
    isVisible: !isGoingToNewAdopter,
    contactName: params.contactName,
    contacts: filteredContacts,
    changes: {
      before: {
        status: params.currentAnimal.status,
        isAvalible: params.currentAnimal.isAvalible,
        isVisible: params.currentAnimal.isVisible,
        contactName: params.currentPrivateInfo.contactName,
        contacts: params.currentPrivateInfo.contacts,
      },
      after: {
        status: params.newStatus,
        isAvalible: !isGoingToNewAdopter,
        isVisible: !isGoingToNewAdopter,
        contactName: params.contactName,
        contacts: filteredContacts,
        notes: [notePrefix + params.note],
      },
    },
  } as AnimalTransactionType;
}

/**
 * Creates a transaction for transit change
 */
export function createTransitChangeTransaction(
  params: TransitChangeTransactionParams
): AnimalTransactionType {
  const base = createBaseTransaction(params);
  const notePrefix = '[Cambio de tránsito] - ';
  const filteredContacts = params.contacts.filter((c) => c.value.trim() !== '');

  return {
    ...base,
    transactionType: 'transit_change',
    contactName: params.contactName,
    contacts: filteredContacts,
    changes: {
      before: {
        contactName: params.currentPrivateInfo.contactName,
        contacts: params.currentPrivateInfo.contacts,
      },
      after: {
        contactName: params.contactName,
        contacts: filteredContacts,
        notes: [notePrefix + params.note],
      },
    },
  } as AnimalTransactionType;
}

/**
 * Creates a transaction for event registration (medical, vaccination, etc.)
 */
export function createEventTransaction(params: EventTransactionParams): AnimalTransactionType {
  const base = createBaseTransaction(params);
  const eventLabels = {
    medical: 'Médico',
    vaccination: 'Vacunación',
    sterilization: 'Esterilización',
    emergency: 'Emergencia',
    supply: 'Suministro',
    followup: 'Seguimiento',
    other: 'Otro',
  };

  const notePrefix = `[${eventLabels[params.eventType]}] - `;
  const shouldAddNote = params.note.trim() !== '';
  const isVaccination = params.eventType === 'vaccination';
  const currentTotalCost = params.currentPrivateInfo.totalCost || 0;
  const newTotalCost = params.cost ? currentTotalCost + params.cost : currentTotalCost;

  const changes: AnimalTransactionType['changes'] = {
    after: {},
  };

  // Build changes object conditionally
  if (shouldAddNote && changes.after) {
    changes.after.notes = [notePrefix + params.note];
  }

  if (params.vaccination && changes.after) {
    changes.after.vaccinations = [
      ...(params.currentPrivateInfo.vaccinations || []),
      { ...params.vaccination, vaccine: '> ' + params.vaccination.vaccine },
    ];
  }

  if (params.cost && changes.after) {
    changes.after.totalCost = newTotalCost;
  }

  // Build before object
  if (isVaccination && params.vaccination) {
    changes.before = {
      vaccinations: params.currentPrivateInfo.vaccinations || [],
    };
  }

  if (params.cost) {
    changes.before = {
      ...(changes.before || {}),
      totalCost: currentTotalCost,
    };
  }

  return {
    ...base,
    transactionType: params.eventType,
    cost: params.cost,
    ...(params.vaccination && { vaccinations: [params.vaccination] }),
    changes,
  } as AnimalTransactionType;
}

/**
 * Creates a transaction for general updates
 */
export function createUpdateTransaction(params: UpdateTransactionParams): AnimalTransactionType {
  const base = createBaseTransaction(params);

  return {
    ...base,
    transactionType: 'update',
    changes: {
      before: params.before,
      after: params.after,
    },
  } as AnimalTransactionType;
}

/**
 * Creates a transaction for delete or restore operations
 */
export function createDeleteTransaction(params: DeleteTransactionParams): AnimalTransactionType {
  const base = createBaseTransaction(params);

  return {
    ...base,
    transactionType: 'delete',
    changes: {
      before: {
        ...params.animalData,
        ...params.privateInfoData,
        isDeleted: params.animalData.isDeleted,
        hardDeleted: params.animalData.hardDeleted,
      },
      after: {
        isDeleted: params.isHardDelete ? true : !params.animalData.isDeleted,
        hardDeleted: params.isHardDelete,
      },
    },
  } as AnimalTransactionType;
}
