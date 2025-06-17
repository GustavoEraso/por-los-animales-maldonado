import { PrivateInfo } from "@/types";
import {setDoc, doc } from "firebase/firestore";
import { db } from "@/firebase";

interface Props {
  data: PrivateInfo;
  id: string;
}
export async function postAnimalPrivateInfo({ data, id }: Props) {
  try {   
    const dateKey = new Date(data.date).toISOString();
    const newData ={
      [dateKey]:data
    } 
   
      const docRef = doc(db, "animalPrivateInfo", id);
      await setDoc(docRef, newData, {merge: true}); 
    
  } catch (error) {
    console.error("Error creando documento:", error);
    throw error;
  }
}