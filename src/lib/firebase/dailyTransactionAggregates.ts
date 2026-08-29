import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { removeUndefinedDeep } from './postFirestoreData';
import { logger } from '@/lib/logger';
import type { AnimalTransactionType, DailyTransactionAggregate } from '@/types';

const DAILY_TRANSACTION_AGGREGATES_COLLECTION = 'dailyTransactionAggregates';

/**
 * Day key formatter using the America/Montevideo timezone so keys are stable
 * regardless of the browser timezone of whoever writes or reads.
 */
const DAY_KEY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Montevideo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Returns the 'YYYY-MM-DD' day key (America/Montevideo) for a timestamp.
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Day key string, e.g. '2026-08-15'
 */
export function getDayKey(timestamp: number): string {
  return DAY_KEY_FORMATTER.format(new Date(timestamp));
}

/**
 * Adds a copy of a transaction to the daily aggregate document of its day.
 *
 * Uses setDoc merge with a unique field path, so concurrent writes from
 * different clients never overwrite each other. Failures are logged but never
 * thrown, so a missing daily copy does not block the main transaction write.
 *
 * @param transaction - The full transaction that was just written
 */
export async function updateDailyTransactionAggregate(
  transaction: AnimalTransactionType
): Promise<void> {
  const transactionId = transaction.transactionId;
  if (!transactionId) {
    logger({
      level: 'warn',
      code: 'DAILY_AGGREGATE_NO_ID',
      message: 'Skipping daily aggregate update: transaction has no transactionId',
      data: { date: transaction.date, animalId: transaction.id },
    });
    return;
  }

  const dayKey = getDayKey(transaction.date);
  const sanitized = removeUndefinedDeep(transaction);

  try {
    const docRef = doc(db, DAILY_TRANSACTION_AGGREGATES_COLLECTION, dayKey);
    await setDoc(
      docRef,
      {
        dayKey,
        transactions: { [transactionId]: sanitized },
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    logger({
      level: 'error',
      code: 'DAILY_AGGREGATE_UPDATE',
      message: 'Error updating daily transaction aggregate:',
      data: { dayKey, transactionId, error },
    });
  }
}

/**
 * Reads all transactions of a date range from the daily aggregate collection.
 *
 * Replaces querying animalTransactions directly: reads one document per day
 * instead of one per transaction (e.g. ~92 reads for a 3-month range).
 *
 * @param startDate - Range start, unix timestamp in milliseconds (inclusive)
 * @param endDate - Range end, unix timestamp in milliseconds (inclusive)
 * @returns All transactions in the range, sorted by date descending
 */
export async function getTransactionsByDateRange(
  startDate: number,
  endDate: number
): Promise<AnimalTransactionType[]> {
  const startKey = getDayKey(startDate);
  const endKey = getDayKey(endDate);

  const snapshot = await getDocs(
    query(
      collection(db, DAILY_TRANSACTION_AGGREGATES_COLLECTION),
      where('dayKey', '>=', startKey),
      where('dayKey', '<=', endKey)
    )
  );

  const transactions: AnimalTransactionType[] = [];
  for (const snap of snapshot.docs) {
    const aggregate = snap.data() as DailyTransactionAggregate;
    if (!aggregate.transactions) continue;
    transactions.push(...Object.values(aggregate.transactions));
  }

  return transactions.sort((a, b) => b.date - a.date);
}
