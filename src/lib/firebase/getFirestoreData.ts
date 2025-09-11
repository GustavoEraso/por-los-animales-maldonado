
import { collection, query, where, orderBy, getDocs, type QueryConstraint } from 'firebase/firestore';
import { db } from '@/firebase';
import { Animal, WpContactType, PrivateInfoDocType, UserType } from '@/types';

interface CollectionsMap {
  animals: Animal;
  animalPrivateInfo: PrivateInfoDocType;
  authorizedEmails: UserType;
  contacts: WpContactType;
};

type FirestoreSimpleValue = string | number | boolean | null;
type FirestoreArrayValue = FirestoreSimpleValue[];

type FirestoreSimpleOperator = '==' | '!=' | '<' | '<=' | '>' | '>=';
type FirestoreArrayOperator = 'in' | 'not-in' | 'array-contains-any';
type FirestoreContainsOperator = 'array-contains';

// Filtros para operadores simples
type FirestoreSimpleFilter = [field: string, op: FirestoreSimpleOperator, value: FirestoreSimpleValue];

// Filtros para operadores que requieren array
type FirestoreArrayFilter = [field: string, op: FirestoreArrayOperator, value: FirestoreArrayValue];

// Filtro para array-contains (el valor es simple)
type FirestoreContainsFilter = [field: string, op: FirestoreContainsOperator, value: FirestoreSimpleValue];

// Unión de todos los tipos de filtro
type FirestoreFilter = FirestoreSimpleFilter | FirestoreArrayFilter | FirestoreContainsFilter;



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

  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as (CollectionsMap[C] & { id: string })[];
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