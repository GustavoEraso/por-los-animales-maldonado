import { Animal } from "@/types";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";
import { db } from "@/firebase";

interface Props {
  data: Animal;
  id?: string;
}
export async function postAnimal({ data, id }: Props) {
  try {
    if (!id) {
      await addDoc(collection(db, "animals"), data); // ID automático
    } else {
      const docRef = doc(db, "animals", id); // Referencia a documento con ID personalizado
      await setDoc(docRef, data, {merge: true}); 
    }
  } catch (error) {
    console.error("Error creando documento:", error);
    throw error;
  }
}