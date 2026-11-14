import { logger } from '@/lib/logger';
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
/**
 * Removes undefined values recursively from plain objects and arrays so the
 * result can be written to Firestore (which rejects undefined fields).
 *
 * Non-plain objects (Firestore `FieldValue` sentinels, `Timestamp`, `GeoPoint`,
 * `DocumentReference`, etc.) are returned untouched. Rebuilding them as plain
 * objects would silently destroy their behavior: for example, `increment(1)`
 * would be persisted as a map like `{ _methodName: 'increment', Cc: 1 }`
 * instead of being applied as an atomic increment.
 *
 * @param value - Any value that may contain undefined nested fields
 * @returns The same value with all undefined fields removed
 */
export function removeUndefinedDeep<V>(value: V): V {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    const items = value.map((item: unknown) => removeUndefinedDeep<unknown>(item));
    return items.filter(
      (item): item is Exclude<unknown, undefined> => item !== undefined
    ) as unknown as V;
  }

  if (typeof value === 'object') {
    const prototype = Reflect.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      return value;
    }

    const cleanedObject: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
      const cleanedValue = removeUndefinedDeep(entryValue as unknown);
      if (cleanedValue !== undefined) cleanedObject[key] = cleanedValue;
    }
    return cleanedObject as V;
  }

  return value;
}

export async function postFirestoreData<T extends object>({
  data,
  currentCollection,
  id,
}: Props<T>): Promise<void> {
  try {
    // Remove undefined values recursively (objects & arrays)
    const sanitized = removeUndefinedDeep(data) as unknown as Record<string, unknown>;

    if (!id) {
      await addDoc(collection(db, currentCollection), sanitized as DocumentData);
    } else {
      const docRef = doc(db, currentCollection, id);
      await setDoc(docRef, sanitized as DocumentData, { merge: true });
    }
  } catch (error) {
    logger({
      level: 'error',
      code: 'SAVE_DOCUMENT',
      message: 'Error creating/updating document:',
      data: error,
    });
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
