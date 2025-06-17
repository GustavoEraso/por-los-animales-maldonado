
// import { db } from '@/firebase';
// import { collection, getDocs } from 'firebase/firestore';

// import {Animal,PrivateInfo,UserType,CollectionsType}from '@/types'

// export async function getFirestoreData({currentCollection}:{currentCollection:string}) {

//   const snapshot = await getDocs(collection(db, currentCollection));
//   return snapshot.docs.map(doc => ({
//     id: doc.id,
//     ...doc.data(),
//   }));
// }

import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Animal, PrivateInfo, UserType } from '@/types';

type CollectionsMap = {
  animals: Animal;
  privateInfo: PrivateInfo;
  authorizedEmails: UserType;
};

export async function getFirestoreData<K extends keyof CollectionsMap>(
  { currentCollection }: { currentCollection: K }
): Promise<(CollectionsMap[K] & { id: string })[]> {
  const snapshot = await getDocs(collection(db, currentCollection));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as (CollectionsMap[K] & { id: string })[];
}
