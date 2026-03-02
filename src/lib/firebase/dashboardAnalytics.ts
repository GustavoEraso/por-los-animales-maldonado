import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { postFirestoreData } from './postFirestoreData';
import { revalidateCache } from '@/lib/revalidateCache';
import generateId from '@/lib/generateId';
import type {
  AnimalTransactionType,
  DashboardAnalyticsData,
  LeanTransaction,
  MonthlyAggregate,
} from '@/types';

/** Maximum number of recent transactions to keep in the summary document */
const MAX_RECENT_TRANSACTIONS = 30;

/**
 * Extracts lean (public, non-sensitive) fields from a full transaction.
 * Used to create the LeanTransaction stored in the dashboard analytics summary.
 *
 * @param tx - Full transaction object
 * @param transactionId - The unique transaction ID
 * @returns A LeanTransaction with only safe, public fields
 */
function toLeanTransaction(tx: AnimalTransactionType, transactionId: string): LeanTransaction {
  const lean: LeanTransaction = {
    transactionId,
    id: tx.id,
    name: tx.name,
    date: tx.date,
    modifiedBy: tx.modifiedBy,
  };

  if (tx.transactionType) lean.transactionType = tx.transactionType;
  if (tx.status) lean.status = tx.status;
  if (tx.img) lean.img = tx.img;
  if (tx.cost !== undefined) lean.cost = tx.cost;

  return lean;
}

/**
 * Returns the YYYY-MM key for a given timestamp.
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns String in format "YYYY-MM" (e.g. "2026-03")
 */
function getMonthKey(timestamp: number): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Reads the current dashboard analytics summary document from Firestore.
 *
 * @returns The existing analytics data, or a fresh empty object if the doc doesn't exist
 */
async function readSummary(): Promise<DashboardAnalyticsData> {
  const docRef = doc(db, 'dashboardAnalytics', 'summary');
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    return snap.data() as DashboardAnalyticsData;
  }

  return {
    recentTransactions: [],
    monthly: {},
    updatedAt: Date.now(),
  };
}

/**
 * Writes the dashboard analytics summary document to Firestore.
 *
 * @param data - The complete analytics data to write
 */
async function writeSummary(data: DashboardAnalyticsData): Promise<void> {
  const docRef = doc(db, 'dashboardAnalytics', 'summary');
  await setDoc(docRef, data);
}

/**
 * Updates the dashboard analytics summary with a new transaction.
 * Called automatically by postTransactionData after every transaction write.
 *
 * - Prepends the lean transaction to recentTransactions (capped at 30)
 * - Updates monthly aggregates (counts, adopted IDs, user stats)
 * - Triggers cache revalidation for the dashboard
 *
 * @param tx - The full transaction that was just written
 * @param transactionId - The unique ID assigned to this transaction
 */
async function updateDashboardAnalytics(
  tx: AnimalTransactionType,
  transactionId: string
): Promise<void> {
  try {
    const summary = await readSummary();

    // 1. Prepend lean transaction to recent list, trim to max
    const lean = toLeanTransaction(tx, transactionId);
    summary.recentTransactions = [lean, ...summary.recentTransactions].slice(
      0,
      MAX_RECENT_TRANSACTIONS
    );

    // 2. Update monthly aggregates
    const monthKey = getMonthKey(tx.date);
    const existing: MonthlyAggregate = summary.monthly[monthKey] ?? {
      transactionCount: 0,
      adoptionCount: 0,
      adoptedAnimalIds: [],
      animalIdsWithTx: [],
      byUser: {},
    };

    existing.transactionCount += 1;

    if (tx.status === 'adoptado') {
      existing.adoptionCount += 1;
      if (!existing.adoptedAnimalIds.includes(tx.id)) {
        existing.adoptedAnimalIds = [...existing.adoptedAnimalIds, tx.id];
      }
    }

    if (!existing.animalIdsWithTx.includes(tx.id)) {
      existing.animalIdsWithTx = [...existing.animalIdsWithTx, tx.id];
    }

    const userEmail = tx.modifiedBy;
    existing.byUser[userEmail] = (existing.byUser[userEmail] ?? 0) + 1;

    summary.monthly[monthKey] = existing;
    summary.updatedAt = Date.now();

    // 3. Write summary and revalidate cache
    await writeSummary(summary);
    await revalidateCache('dashboard-transactions');
  } catch (error) {
    // Analytics update failure should not block the main transaction
    console.error('[dashboardAnalytics] Error updating summary:', error);
  }
}

/**
 * Centralized function for writing transaction data to Firestore.
 *
 * Replaces all direct `postFirestoreData({ currentCollection: 'animalTransactions' })` calls.
 * Automatically:
 * - Generates transactionId if missing
 * - Writes to animalTransactions collection
 * - Updates the dashboard analytics summary document
 * - Revalidates the dashboard cache
 *
 * @param params.data - The transaction data to write
 * @param params.id - Optional explicit document ID (used by editar/[id] for setDoc merge)
 * @returns The generated or existing transactionId
 *
 * @example
 * // Auto-generated doc ID
 * await postTransactionData({ data: newTransactionData });
 *
 * @example
 * // Explicit doc ID (for updates with merge)
 * await postTransactionData({ data: txData, id: txData.transactionId });
 */
export async function postTransactionData({
  data,
  id,
}: {
  data: AnimalTransactionType;
  id?: string;
}): Promise<string> {
  // Ensure transactionId is always present
  const transactionId = data.transactionId ?? generateId();
  const txWithId: AnimalTransactionType = { ...data, transactionId };

  // Write to animalTransactions
  await postFirestoreData<AnimalTransactionType>({
    data: txWithId,
    currentCollection: 'animalTransactions',
    id,
  });

  // Update analytics (fire-and-forget — errors logged but not thrown)
  await updateDashboardAnalytics(txWithId, transactionId);

  return transactionId;
}

/**
 * Fetches the full transaction document from animalTransactions by its transactionId.
 * Used by the "Ver Detalles" button in the dashboard to load private data on demand.
 * Requires authentication context (client-side only).
 *
 * @param transactionId - The transactionId field of the transaction document
 * @returns The full transaction data, or null if not found
 */
export async function getFullTransaction(
  transactionId: string
): Promise<AnimalTransactionType | null> {
  try {
    const docRef = doc(db, 'animalTransactions', transactionId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return snap.data() as AnimalTransactionType;
    }

    return null;
  } catch (error) {
    console.error('[dashboardAnalytics] Error fetching full transaction:', error);
    return null;
  }
}
