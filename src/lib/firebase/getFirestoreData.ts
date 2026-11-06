import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/firebase';
import {
  Animal,
  WpContactType,
  AnimalTransactionType,
  UserType,
  PrivateInfoType,
  BannerType,
  SponsorType,
  CarouselType,
  GoogleFormEntry,
  ApplicantProfile,
  ApplicantContactIndexEntry,
} from '@/types';

interface CollectionsMap {
  animals: Animal;
  authorizedEmails: UserType;
  contacts: WpContactType;
  animalTransactions: AnimalTransactionType;
  animalPrivateInfo: PrivateInfoType;
  banners: BannerType;
  sponsors: SponsorType;
  carousels: CarouselType;
  googleForms: GoogleFormEntry;
  applicantProfiles: ApplicantProfile;
  applicantContactIndex: ApplicantContactIndexEntry;
}

type FirestoreSimpleValue = string | number | boolean | null;
type FirestoreArrayValue = FirestoreSimpleValue[];

type FirestoreSimpleOperator = '==' | '!=' | '<' | '<=' | '>' | '>=';
type FirestoreArrayOperator = 'in' | 'not-in' | 'array-contains-any';
type FirestoreContainsOperator = 'array-contains';

// Filtros para operadores simples
type FirestoreSimpleFilter = [
  field: string,
  op: FirestoreSimpleOperator,
  value: FirestoreSimpleValue,
];

// Filtros para operadores que requieren array
type FirestoreArrayFilter = [field: string, op: FirestoreArrayOperator, value: FirestoreArrayValue];

// Filtro para array-contains (el valor es simple)
type FirestoreContainsFilter = [
  field: string,
  op: FirestoreContainsOperator,
  value: FirestoreSimpleValue,
];

// Unión de todos los tipos de filtro
export type FirestoreFilter =
  | FirestoreSimpleFilter
  | FirestoreArrayFilter
  | FirestoreContainsFilter;

const collectionsWithTrash = new Set<keyof CollectionsMap>(['animals']);

interface GetDataParams<C extends keyof CollectionsMap> {
  currentCollection: C;
  filter?: FirestoreFilter[];
  orderBy?: keyof CollectionsMap[C];
  direction?: 'asc' | 'desc';
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
}

/**
 * Retrieves documents from a Firestore collection with optional filters and ordering.
 *
 * @param {Object} params - Query parameters.
 * @param {keyof CollectionsMap} params.currentCollection - The name of the collection to query.
 * @param {FirestoreFilter[]} [params.filter] - Array of filters in the format [field, operator, value].
 *   Available operators:
 *     - '==' : Equal
 *     - '!=' : Not equal
 *     - '<'  : Less than
 *     - '<=' : Less than or equal
 *     - '>'  : Greater than
 *     - '>=' : Greater than or equal
 *     - 'in' : In array of values
 *     - 'not-in' : Not in array of values
 *     - 'array-contains' : Array contains value
 *     - 'array-contains-any' : Array contains any of the values
 * @param {keyof CollectionsMap[C]} [params.orderBy] - Field to order the results by.
 * @param {'asc' | 'desc'} [params.direction] - Sort direction ('asc' or 'desc').
 * @param {boolean} [params.includeDeleted] - If true, includes deleted items (only for collections with trash).
 * @param {boolean} [params.onlyDeleted] - If true, returns only deleted items (only for collections with trash).
 * @returns {Promise<(CollectionsMap[C] & { id: string })[]>} Array of documents with their Firestore id.
 *
 * @example
 * // Get all authorized emails
 * const emails = await getFirestoreData({ currentCollection: 'authorizedEmails' });
 *
 * @example
 * // Get active dogs ordered by name
 * const dogs = await getFirestoreData({
 *   currentCollection: 'animals',
 *   filter: [['species', '==', 'perro']],
 *   orderBy: 'name',
 * });
 *
 * @example
 * // Get only deleted animals (trash)
 * const trash = await getFirestoreData({
 *   currentCollection: 'animals',
 *   onlyDeleted: true,
 * });
 *
 * @example
 * // Get animals with status not equal to 'adoptado'
 * const notAdopted = await getFirestoreData({
 *   currentCollection: 'animals',
 *   filter: [['status', 'not-in', ['adoptado']]],
 *   orderBy: 'name',
 * });
 *
 * @example
 * // Get animals with status 'calle' or 'transitorio'
 * const streetOrTemporary = await getFirestoreData({
 *   currentCollection: 'animals',
 *   filter: [['status', 'in', ['calle', 'transitorio']]],
 *   orderBy: 'name',
 * });
 */

export async function getFirestoreData<C extends keyof CollectionsMap>({
  currentCollection,
  filter = [],
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

  for (const f of filter) {
    if (!Array.isArray(f) || f.length !== 3) {
      throw new Error(`Filtro inválido: ${JSON.stringify(f)}`);
    }
    const [field, op, value] = f;
    constraints.push(where(field, op, value));
  }

  if (orderKey) {
    constraints.push(orderBy(orderKey as string, direction));
  }

  const snap = await getDocs(constraints.length ? query(baseRef, ...constraints) : baseRef);

  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as (CollectionsMap[C] & {
    id: string;
  })[];
}

export interface GetFirestorePageParams<C extends keyof CollectionsMap> {
  currentCollection: C;
  filter?: FirestoreFilter[];
  orderBy?: keyof CollectionsMap[C];
  direction?: 'asc' | 'desc';
  pageSize?: number;
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null;
}

export interface FirestorePage<C extends keyof CollectionsMap> {
  items: (CollectionsMap[C] & { id: string })[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/**
 * Retrieves one page of a Firestore collection.
 *
 * It requests `pageSize + 1` documents to know whether more results exist
 * without an extra count query. Use `startAfterDoc` with the `lastDoc` from the
 * previous page to load the next one.
 *
 * @param params.currentCollection - Collection to query
 * @param params.filter - Optional Firestore filters
 * @param params.orderBy - Field used to order the page
 * @param params.direction - Sort direction
 * @param params.pageSize - Maximum number of items in the page
 * @param params.startAfterDoc - Cursor returned by the previous page
 * @returns The page items, the cursor and whether more results exist
 */
export async function getFirestorePage<C extends keyof CollectionsMap>({
  currentCollection,
  filter = [],
  orderBy: orderKey,
  direction = 'asc',
  pageSize = 25,
  startAfterDoc = null,
}: GetFirestorePageParams<C>): Promise<FirestorePage<C>> {
  const baseRef = collection(db, currentCollection);
  const constraints: QueryConstraint[] = [];

  if (collectionsWithTrash.has(currentCollection)) {
    constraints.push(where('isDeleted', '==', false));
  }

  for (const f of filter) {
    if (!Array.isArray(f) || f.length !== 3) {
      throw new Error(`Filtro inválido: ${JSON.stringify(f)}`);
    }
    const [field, op, value] = f;
    constraints.push(where(field, op, value));
  }

  if (orderKey) {
    constraints.push(orderBy(orderKey as string, direction));
  }

  constraints.push(limit(pageSize + 1));
  if (startAfterDoc) {
    constraints.push(startAfter(startAfterDoc));
  }

  const snap = await getDocs(query(baseRef, ...constraints));
  const hasMore = snap.docs.length > pageSize;
  const pageDocs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;

  return {
    items: pageDocs.map((d) => ({ id: d.id, ...d.data() })) as (CollectionsMap[C] & {
      id: string;
    })[],
    lastDoc: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
    hasMore,
  };
}

/* ─────────────────────────  USAGE EXAMPLES  ──────────────────────────

1) All authorized emails
   const emails = await getFirestoreData({ currentCollection: 'authorizedEmails' });

2) Active animals ordered by name
   // No need to add ['isDeleted', '==', false] because the function adds it automatically
   const dogs = await getFirestoreData({
     currentCollection: 'animals',
     filter: [['species', '==', 'perro']],
     orderBy: 'name',
   });

3) Trash bin (only deleted animals)
   const trash = await getFirestoreData({
     currentCollection: 'animals',
     onlyDeleted: true,
   });

4) Active + deleted animals (no isDeleted filter)
   const allAnimals = await getFirestoreData({
     currentCollection: 'animals',
     includeDeleted: true,
   });

5) Animals with status not equal to 'adoptado'
   const notAdopted = await getFirestoreData({
     currentCollection: 'animals',
     filter: [['status', 'not-in', ['adoptado']]],
     orderBy: 'name',
   });

6) Animals with status 'calle' or 'transitorio'
   const streetOrTemporary = await getFirestoreData({
     currentCollection: 'animals',
     filter: [['status', 'in', ['calle', 'transitorio']]],
     orderBy: 'name',
   });

──────────────────────────────────────────────────────────────────────────── */
