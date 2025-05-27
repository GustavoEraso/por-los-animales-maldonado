
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function getFirestoreData({currentCollection}:{currentCollection:string}) {
  const snapshot = await getDocs(collection(db, currentCollection));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}
