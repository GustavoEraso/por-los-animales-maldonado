import { CollectionsType } from '@/types';
import { collection, addDoc, setDoc, doc, DocumentData } from 'firebase/firestore';
import { db } from '@/firebase';

interface Props<T> {
  data: T;
  currentCollection: CollectionsType['currentColection'];
  id?: string;
}

/**
 * Creates or updates a document in any Firestore collection.
 *
 * If no ID is provided, a new document is created with an automatic ID.
 * If an ID is provided, the document is created or updated with that ID (using merge).
 * The function is reusable for any collection by specifying the collection name and type.
 *
 * @template T - The type of the data to store in Firestore. Must be a plain object (not array, not function).
 * @param {Object} params - Parameters for creating or updating the document.
 * @param {T} params.data - The data to store in Firestore.
 * @param {CollectionsType['currentColection']} params.currentCollection - The name of the Firestore collection.
 * @param {string} [params.id] - Optional custom ID for the document.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 *
 * @example
 * // Create a new animal document with automatic ID
 * await postFirestoreData<Animal>({ data: animalData, currentCollection: 'animals' });
 *
 * @example
 * // Create or update a contact document with a specific ID
 * await postFirestoreData<Contact>({ data: contactData, currentCollection: 'contacts', id: 'contact123' });
 *
 * @example
 * // Update an existing transaction document
 * const updatedTransaction = { ...transactionData, status: 'adoptado' };
 * await postFirestoreData<AnimalTransactionType>({ data: updatedTransaction, currentCollection: 'animalTransactions', id: 'txn456' });
 */
export async function postFirestoreData<T extends object>({
  data,
  currentCollection,
  id,
}: Props<T>): Promise<void> {
  // Remove undefined values recursively (objects & arrays)
  function removeUndefinedDeep<V>(value: V): V {
    if (value === null || value === undefined) return value;

    if (Array.isArray(value)) {
      const items = value.map((v: unknown) => removeUndefinedDeep<unknown>(v));
      return items.filter((v): v is Exclude<unknown, undefined> => v !== undefined) as unknown as V;
    }

    if (typeof value === 'object') {
      const obj: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        const cleaned = removeUndefinedDeep(v as unknown);
        if (cleaned !== undefined) obj[k] = cleaned;
      }
      return obj as V;
    }

    return value;
  }

  try {
    const sanitized = removeUndefinedDeep(data) as unknown as Record<string, unknown>;

    if (!id) {
      await addDoc(collection(db, currentCollection), sanitized as DocumentData);
    } else {
      const docRef = doc(db, currentCollection, id);
      await setDoc(docRef, sanitized as DocumentData, { merge: true });
    }
  } catch (error) {
    console.error('Error creating/updating document:', error);
    throw error;
  }
}

/* ──────────────── USAGE EXAMPLES ────────────────

// 1) Create a new animal document with automatic ID
await postFirestoreData<Animal>({ data: animalData, currentCollection: 'animals' });

// 2) Create or update a contact document with a specific ID
await postFirestoreData<Contact>({ data: contactData, currentCollection: 'contacts', id: 'contact123' });

// 3) Update an existing transaction document
const updatedTransaction = { ...transactionData, status: 'adoptado' };
await postFirestoreData<AnimalTransactionType>({ data: updatedTransaction, currentCollection: 'animalTransactions', id: 'txn456' });

────────────────────────────────────────────────────*/
