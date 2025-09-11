import { Animal } from "@/types";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";
import { db } from "@/firebase";

interface Props {
  data: Animal;
  id?: string;
}

/**
 * Creates or updates an animal document in the 'animals' Firestore collection.
 *
 * If no ID is provided, a new document is created with an automatic ID.
 * If an ID is provided, the document is created or updated with that ID (using merge).
 *
 * @param {Object} params - Parameters for creating or updating the animal.
 * @param {Animal} params.data - The animal data to store in Firestore.
 * @param {string} [params.id] - Optional custom ID for the document.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 *
 * @example
 * // Create a new animal with automatic ID
 * await postAnimal({ data: animalData });
 *
 * @example
 * // Create or update an animal with a specific ID
 * await postAnimal({ data: animalData, id: 'abc123' });
 */

export async function postAnimal({ data, id }: Props): Promise<void> {
  try {
    if (!id) {
      await addDoc(collection(db, "animals"), data); // automatic ID
    } else {
      const docRef = doc(db, "animals", id); // Reference to document with custom ID
      await setDoc(docRef, data, {merge: true}); 
    }
  } catch (error) {
    console.error("Error creating document:", error);
    throw error;
  }
}

/* ─────────────────────────  USAGE EXAMPLES  ──────────────────────────

1) Create a new animal with automatic ID
   await postAnimal({ data: animalData });

2) Create or update an animal with a specific ID
   await postAnimal({ data: animalData, id: 'abc123' });
   
3) Update an existing animal's information
   const updatedAnimal = { ...animalData, name: 'New Name' };
   await postAnimal({ data: updatedAnimal, id: 'abc123' });


──────────────────────────────────────────────────────────────────────────── */