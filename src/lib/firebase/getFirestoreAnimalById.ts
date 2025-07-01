
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Animal } from "@/types";


export const getFirestoreAnimalById = async (id: string) => {
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

