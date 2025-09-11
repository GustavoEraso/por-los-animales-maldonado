
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { PrivateInfoDocType } from "@/types";

/**
 * Retrieves a private info document from the 'animalPrivateInfo' Firestore collection by its ID.
 *
 * @param {string} id - The ID of the private info document to retrieve.
 * @returns {Promise<PrivateInfoDocType | null>} A promise that resolves to the PrivateInfoDocType object if found, or null if not found.
 *
 * @example
 * // Get private info with ID 'abc123'
 * const privateInfo = await getFirestorePrivateInfoById('abc123');
 *
 * @example
 * // Handle case when private info does not exist
 * const privateInfo = await getFirestorePrivateInfoById('nonexistentId');
 * if (!privateInfo) {
 *   console.log('Private info not found');
 * }
 */

export const getFirestorePrivateInfoById = async (id: string): Promise<PrivateInfoDocType | null> => {
  try {
    const docRef = doc(db, "animalPrivateInfo", id);
    const docSnap = await getDoc(docRef);   

    if (docSnap.exists()) {
      return {id:docSnap.id ,...docSnap.data() } as PrivateInfoDocType;
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting document:", error);
    throw error;
  }
};

/* ─────────────────────────  USAGE EXAMPLES  ──────────────────────────

1) Get private info by ID
   const privateInfo = await getFirestorePrivateInfoById('abc123');

2) Handle case when private info does not exist
   const privateInfo = await getFirestorePrivateInfoById('nonexistentId');
   if (!privateInfo) {
     console.log('Private info not found');
   }

3) Use the returned private info object
   const privateInfo = await getFirestorePrivateInfoById('abc123');
   if (privateInfo) {
     console.log(`Modified by: ${privateInfo.modifiedBy}`);
   }

──────────────────────────────────────────────────────────────────────────── */
