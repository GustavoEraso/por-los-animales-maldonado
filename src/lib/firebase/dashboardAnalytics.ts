import { logger } from '@/lib/logger';
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
 * Applies a set of transactions to the dashboard analytics summary.
 * Called automatically after transaction writes complete.
 *
 * - Prepends the lean transaction to recentTransactions (capped at 30)
 * - Updates monthly aggregates (counts, adopted IDs, user stats)
 * - Triggers one cache revalidation for the dashboard
 *
 * @param transactions - The full transactions that were just written
 */
async function updateDashboardAnalytics(transactions: AnimalTransactionType[]): Promise<void> {
  if (transactions.length === 0) return;

  try {
    const summary = await readSummary();

    for (const transaction of transactions) {
      const transactionId = transaction.transactionId ?? generateId();
      const lean = toLeanTransaction(transaction, transactionId);
      summary.recentTransactions = [lean, ...summary.recentTransactions].slice(
        0,
        MAX_RECENT_TRANSACTIONS
      );

      const monthKey = getMonthKey(transaction.date);
      const existing: MonthlyAggregate = summary.monthly[monthKey] ?? {
        transactionCount: 0,
        adoptionCount: 0,
        adoptedAnimalIds: [],
        animalIdsWithTx: [],
        byUser: {},
      };

      existing.transactionCount += 1;

      if (transaction.status === 'adoptado') {
        existing.adoptionCount += 1;
        if (!existing.adoptedAnimalIds.includes(transaction.id)) {
          existing.adoptedAnimalIds = [...existing.adoptedAnimalIds, transaction.id];
        }
      }

      if (!existing.animalIdsWithTx.includes(transaction.id)) {
        existing.animalIdsWithTx = [...existing.animalIdsWithTx, transaction.id];
      }

      const userEmail = transaction.modifiedBy;
      existing.byUser[userEmail] = (existing.byUser[userEmail] ?? 0) + 1;

      summary.monthly[monthKey] = existing;
    }

    summary.updatedAt = Date.now();

    // Write the summary and revalidate the cache once for the whole batch.
    await writeSummary(summary);
    await revalidateCache('dashboard-transactions');
  } catch (error) {
    // Analytics update failure should not block the main transaction
    logger({
      level: 'error',
      code: 'UPDATE_DASHBOARD_ANALYTICS',
      message: '[dashboardAnalytics] Error updating summary:',
      data: error,
    });
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
  await updateDashboardAnalytics([txWithId]);

  return transactionId;
}

/**
 * Writes multiple transaction documents and updates dashboard analytics once.
 *
 * @param params.data - The transaction data to write
 * @returns The generated or existing transaction IDs
 */
export async function postTransactionsData({
  data,
}: {
  data: AnimalTransactionType[];
}): Promise<string[]> {
  const transactionsWithIds = data.map((transaction) => {
    const transactionId = transaction.transactionId ?? generateId();
    return {
      transaction: { ...transaction, transactionId },
      transactionId,
    };
  });

  await Promise.all(
    transactionsWithIds.map(({ transaction }) =>
      postFirestoreData<AnimalTransactionType>({
        data: transaction,
        currentCollection: 'animalTransactions',
      })
    )
  );

  await updateDashboardAnalytics(transactionsWithIds.map(({ transaction }) => transaction));

  return transactionsWithIds.map(({ transactionId }) => transactionId);
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
    logger({
      level: 'error',
      code: 'FETCH_FULL_TRANSACTION',
      message: '[dashboardAnalytics] Error fetching full transaction:',
      data: error,
    });
    return null;
  }
}
