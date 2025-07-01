
// import { db } from '@/firebase';
// import { collection, getDocs } from 'firebase/firestore';
// import { Animal, PrivateInfoDocType, UserType } from '@/types';

// type CollectionsMap = {
//   animals: Animal;
//   animalPrivateInfo: PrivateInfoDocType;
//   authorizedEmails: UserType;
// };

// export async function getFirestoreData<K extends keyof CollectionsMap>(
//   { currentCollection }: { currentCollection: K }
// ): Promise<(CollectionsMap[K] & { id: string })[]> {
//   const snapshot = await getDocs(collection(db, currentCollection));
//   return snapshot.docs.map(doc => ({
//     id: doc.id,
//     ...doc.data(),
//   })) as (CollectionsMap[K] & { id: string })[];
// }

import { collection, query, where, orderBy, getDocs, type QueryConstraint } from 'firebase/firestore';
import { db } from '@/firebase';
import { Animal, PrivateInfoDocType, UserType } from '@/types';

type CollectionsMap = {
  animals: Animal;
  animalPrivateInfo: PrivateInfoDocType;
  authorizedEmails: UserType;
};

type Scalar = string | number | boolean;

type SimpleFilter<T> = Partial<{ [K in keyof T as T[K] extends Scalar ? K : never]: T[K] }>;

const collectionsWithTrash = new Set<keyof CollectionsMap>(['animals']);

interface GetDataParams<C extends keyof CollectionsMap> {
  currentCollection: C;
  filter?: SimpleFilter<CollectionsMap[C]>;
  orderBy?: keyof CollectionsMap[C];
  direction?: 'asc' | 'desc';
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
}

export async function getFirestoreData<C extends keyof CollectionsMap>({
  currentCollection,
  filter = {},
  orderBy: orderKey,
  direction = 'asc',
  includeDeleted = false,
  onlyDeleted = false,
}: GetDataParams<C>): Promise<(CollectionsMap[C] & { id: string })[]> {
  const baseRef = collection(db, currentCollection);
  const supportsTrash = collectionsWithTrash.has(currentCollection);

  const constraints: QueryConstraint[] = [];

  if (supportsTrash) {
    if (onlyDeleted) {
      constraints.push(where('isDeleted', '==', true));
    } else if (!includeDeleted) {
      constraints.push(where('isDeleted', '==', false));
    }
  }

  for (const k in filter) {
    const v = filter[k as keyof typeof filter];
    if (v !== undefined) {
      constraints.push(where(k, '==', v));
    }
  }

  if (orderKey) {
    constraints.push(orderBy(orderKey as string, direction));
  }

  const snap = await getDocs(constraints.length ? query(baseRef, ...constraints) : baseRef);

  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as (CollectionsMap[C] & { id: string })[];
}

/* ─────────────────────────  EJEMPLOS DE USO  ──────────────────────────

1) Compatibilidad intacta (todos los emails)
   const emails = await getFirestoreData({ currentCollection: 'authorizedEmails' });

2) Animales activos y ordenados por nombre
   const perros = await getFirestoreData({
     currentCollection: 'animals',
     filter: { species: 'perro' },
     orderBy: 'name',
   });

3) Papelera completa
   const trash = await getFirestoreData({
     currentCollection: 'animals',
     onlyDeleted: true,
   });

4) Activos + papelera (sin filtro)
   const allAnimals = await getFirestoreData({
     currentCollection: 'animals',
     includeDeleted: true,
   });
──────────────────────────────────────────────────────────────────────────── */