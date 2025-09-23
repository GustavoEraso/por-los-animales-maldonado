import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CollectionsType } from '@/types';

interface Props {
  currentCollection: CollectionsType['currentColection'];
  id: string;
}

/**
 * Gets a document by ID from any Firestore collection.
 *
 * This generic function retrieves a document from Firestore using the collection name and document ID.
 * Returns the document data typed as <T>, or null if the document does not exist.
 *
 * @template T - The type of the returned data.
 * @param {Object} params - Parameters for the query.
 * @param {CollectionsType['currentColection']} params.currentCollection - The Firestore collection name.
 * @param {string} params.id - The document ID.
 * @returns {Promise<T | null>} The document data or null if not found.
 *
 * @example
 * // Get an animal by ID
 * const animal = await getFirestoreDocById<Animal>({ currentCollection: 'animals', id: 'animal123' });
 *
 * @example
 * // Get a contact by ID
 * const contact = await getFirestoreDocById<ContactType>({ currentCollection: 'contacts', id: 'contact456' });
 *
 * @example
 * // Get a transaction by ID
 * const transaction = await getFirestoreDocById<AnimalTransactionType>({ currentCollection: 'animalTransactions', id: 'txn789' });
 */

export const getFirestoreDocById = async <T>({
  currentCollection,
  id,
}: Props): Promise<T | null> => {
  try {
    const docRef = doc(db, currentCollection, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as T;
    } else {
      console.log('No such document!');
      return null;
    }
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

/* ─────────────────────────  USAGE EXAMPLES  ──────────────────────────

1) Obtener un animal por ID
   const animal = await getFirestoreDocById<Animal>({
     currentCollection: 'animals',
     id: 'animal123'
   });

2) Obtener un contacto por ID
   const contact = await getFirestoreDocById<ContactType>({
     currentCollection: 'contacts',
     id: 'contact456'
   });

3) Obtener una transacción por ID
   const transaction = await getFirestoreDocById<AnimalTransactionType>({
     currentCollection: 'animalTransactions',
     id: 'txn789'
   });

──────────────────────────────────────────────────────────────────────────── */
