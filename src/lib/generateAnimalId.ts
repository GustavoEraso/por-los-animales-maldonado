import { doc, runTransaction } from 'firebase/firestore';
import { db } from '@/firebase';
import { logger } from '@/lib/logger';

const COUNTER_DOC_PATH = 'config/idCounters';
const COUNTER_FIELD = 'animalId';

/**
 * Generates the next sequential numeric animal ID using an atomic Firestore counter.
 *
 * Reads and increments a counter stored in the `config/idCounters` document
 * via `runTransaction`, which guarantees no duplicate IDs even under concurrent
 * writes. The counter auto-creates with value 0 on first use.
 *
 * @returns {Promise<string>} Numeric ID as a plain string (e.g. "1", "42")
 *
 * @example
 * const id = await generateAnimalId(); // "1", "2", "3", ...
 */
export async function generateAnimalId(): Promise<string> {
  const ids = await generateAnimalIds(1);
  return ids[0];
}

/**
 * Reserves a block of sequential numeric IDs in a single atomic transaction.
 * Essential for litters to avoid N individual roundtrips.
 *
 * @param {number} count - Number of IDs to reserve (must be >= 1)
 * @returns {Promise<string[]>} Array of numeric ID strings
 *
 * @example
 * const ids = await generateAnimalIds(3); // ["5", "6", "7"]
 */
export async function generateAnimalIds(count: number): Promise<string[]> {
  if (count < 1) return [];

  try {
    const startId = await runTransaction(db, async (transaction) => {
      const counterRef = doc(db, COUNTER_DOC_PATH);
      const snap = await transaction.get(counterRef);

      const current: number =
        snap.exists() && typeof snap.data()[COUNTER_FIELD] === 'number'
          ? (snap.data()[COUNTER_FIELD] as number)
          : 0;

      const next = current + 1;
      transaction.set(counterRef, { [COUNTER_FIELD]: current + count }, { merge: true });

      return next;
    });

    return Array.from({ length: count }, (_, i) => String(startId + i));
  } catch (err) {
    logger({
      level: 'error',
      code: 'GENERATE_ID_COUNTER',
      message: 'Failed to generate sequential animal ID via Firestore transaction',
      data: err,
    });
    throw err;
  }
}
