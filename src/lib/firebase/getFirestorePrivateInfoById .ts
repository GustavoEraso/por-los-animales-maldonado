
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { PrivateInfoDocType } from "@/types";


export const getFirestorePrivateInfoById = async (id: string) => {
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

