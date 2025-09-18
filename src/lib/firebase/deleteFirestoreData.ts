import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';

interface DeleteDataParams {
  collection: string;
  docId: string;
}

/**
 * Deletes a document from a Firestore collection by its ID.
 *
 * @param {Object} params - Parameters for deletion.
 * @param {string} params.collection - The name of the Firestore collection.
 * @param {string} params.docId - The ID of the document to delete.
 * @returns {Promise<void>} A promise that resolves when the document is deleted.
 *
 * @example
 * // Delete a document with ID 'abc123' from the 'animals' collection
 * await deleteFirestoreData({ collection: 'animals', docId: 'abc123' });
 *
 * @example
 * // Delete a document with ID 'user42' from the 'users' collection
 * await deleteFirestoreData({ collection: 'users', docId: 'user42' });
 */

export async function deleteFirestoreData({ collection, docId }: DeleteDataParams): Promise<void> {
  if (!collection || !docId)
    throw new Error('Both collection and docId are required to delete a document.');

  const docRef = doc(db, collection, docId);
  await deleteDoc(docRef);
}

/* ─────────────────────────  USAGE EXAMPLES  ──────────────────────────

1) Delete a document with ID 'abc123' from the 'animals' collection
   await deleteFirestoreData({ collection: 'animals', docId: 'abc123' });

2) Delete a document with ID 'user42' from the 'users' collection
   await deleteFirestoreData({ collection: 'users', docId: 'user42' });

3) Delete a document with ID 'post99' from the 'posts' collection
   await deleteFirestoreData({ collection: 'posts', docId: 'post99' });

──────────────────────────────────────────────────────────────────────────── */
