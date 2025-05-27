import { db } from "@/firebase";
import { Animal } from "@/types";
import { collection, addDoc } from "firebase/firestore";


export async function postData(params:Animal) {    

await addDoc(collection(db, "animals"), params);
console.log("Animal added successfully:", params);
}