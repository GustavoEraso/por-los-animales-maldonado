
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Animal } from "@/types";

/**
 * Retrieves an animal document from the 'animals' Firestore collection by its ID.
 *
 * @param {string} id - The ID of the animal document to retrieve.
 * @returns {Promise<Animal | null>} A promise that resolves to the Animal object if found, or null if not found.
 *
 * @example
 * // Get animal with ID 'abc123'
 * const animal = await getFirestoreAnimalById('abc123');
 *
 * @example
 * // Handle case when animal does not exist
 * const animal = await getFirestoreAnimalById('nonexistentId');
 * if (!animal) {
 *   console.log('Animal not found');
 * }
 */

export const getFirestoreAnimalById = async (id: string): Promise<Animal | null> => {
  try {
    const docRef = doc(db, "animals", id);
    const docSnap = await getDoc(docRef);   

    if (docSnap.exists()) {
      return { ...docSnap.data() } as Animal;
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

1) Get an animal by ID
   const animal = await getFirestoreAnimalById('abc123');

2) Handle case when animal does not exist
   const animal = await getFirestoreAnimalById('nonexistentId');
   if (!animal) {
     console.log('Animal not found');
   }

3) Use the returned animal object
   const animal = await getFirestoreAnimalById('abc123');
   if (animal) {
     console.log(`Animal name: ${animal.name}`);
   }

──────────────────────────────────────────────────────────────────────────── */