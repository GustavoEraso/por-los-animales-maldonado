import { PrivateInfo } from "@/types";
import {setDoc, doc } from "firebase/firestore";
import { db } from "@/firebase";

interface Props {
  data: PrivateInfo;
  id: string;
}
/**
 * Creates or updates a private info entry for an animal in the 'animalPrivateInfo' Firestore collection.
 * The private info is stored under a key based on the ISO date of the entry.
 *
 * @param {Object} params - Parameters for creating or updating the private info.
 * @param {PrivateInfo} params.data - The private info data to store.
 * @param {string} params.id - The ID of the animal document.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 *
 * @example
 * // Add a new private info entry for an animal
 * await postAnimalPrivateInfo({ data: privateInfoData, id: 'abc123' });
 *
 * @example
 * // Update private info for an existing animal
 * const updatedInfo = { ...privateInfoData, modifiedBy: 'admin@example.com' };
 * await postAnimalPrivateInfo({ data: updatedInfo, id: 'abc123' });
 */
export async function postAnimalPrivateInfo({ data, id }: Props): Promise<void> {
  try {
    const dateKey = new Date(data.date).toISOString();
    const newData = {
      [dateKey]: data
    };

    const docRef = doc(db, "animalPrivateInfo", id);
    await setDoc(docRef, newData, { merge: true });

  } catch (error) {
    console.error("Error creando documento:", error);
    throw error;
  }
}

/* ─────────────────────────  USAGE EXAMPLES  ──────────────────────────

1) Add a new private info entry for an animal
   await postAnimalPrivateInfo({ data: privateInfoData, id: 'abc123' });

2) Update private info for an existing animal
   const updatedInfo = { ...privateInfoData, modifiedBy: 'admin@example.com' };
   await postAnimalPrivateInfo({ data: updatedInfo, id: 'abc123' });

──────────────────────────────────────────────────────────────────────────── */