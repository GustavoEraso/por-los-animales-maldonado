import { Animal, AnimalTransactionType, PrivateInfoType } from '@/types';
import { postFirestoreData } from './postFirestoreData';
import { getFirestoreDocById } from './getFirestoreDocById';
import { auth } from '@/firebase';

interface NoteData {
  note: string;
  animalId: string;
}

/**
 * Post a new note for an animal.
 * Returns a promise that resolves when both privateInfo and transaction are written to Firestore.
 * The caller is responsible for handling UI feedback (toasts, loading states, etc.).
 *
 * @returns Promise<[void, void]> - Resolves when both Firestore writes complete
 */
async function postNewAnimalNote({ note, animalId }: NoteData): Promise<[void, void]> {
  const [prePrivateInfo, animal] = await Promise.all([
    getFirestoreDocById<PrivateInfoType>({
      currentCollection: 'animalPrivateInfo',
      id: animalId,
    }),
    getFirestoreDocById<Animal>({
      currentCollection: 'animals',
      id: animalId,
    }),
  ]);

  if (!prePrivateInfo) {
    throw new Error('No se encontró la información privada del animal');
  }

  if (!animal) {
    throw new Error('No se encontró el animal');
  }

  const notes = prePrivateInfo?.notes || [];
  const updatedNotes = [...notes, note];

  const newTransactionData: AnimalTransactionType = {
    id: prePrivateInfo.id,
    name: prePrivateInfo.name || '',
    img: animal.images[0],
    transactionType: 'note',
    date: Date.now(),
    modifiedBy: auth.currentUser?.email || 'system',
    since: Date.now(),
    changes: {
      after: { notes: [note] },
    },
  };

  return Promise.all([
    postFirestoreData<PrivateInfoType>({
      data: { ...prePrivateInfo, notes: updatedNotes },
      currentCollection: 'animalPrivateInfo',
      id: prePrivateInfo.id,
    }),
    postFirestoreData<AnimalTransactionType>({
      data: newTransactionData,
      currentCollection: 'animalTransactions',
    }),
  ]);
}

export { postNewAnimalNote };
