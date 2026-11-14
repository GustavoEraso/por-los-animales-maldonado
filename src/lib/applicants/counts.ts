import type { ApplicantProfile, AnimalTransactionType } from '@/types';

/** Transaction types that are denormalized on an applicant profile. */
export type ApplicantTransactionCountType = 'adoption' | 'return';

/**
 * Reads a denormalized counter stored on an applicant profile.
 *
 * Older documents may contain a serialized Firestore sentinel instead of a
 * number (for example `{ _methodName: 'increment', Cc: 1 }`), because the write
 * sanitizer used to rebuild every object it visited. Consumers must treat those
 * values as unknown and derive the real number from the transactions.
 *
 * @param storedValue - Raw value read from Firestore
 * @returns The counter when it is a finite number, otherwise null
 */
export function getStoredApplicantCount(storedValue: unknown): number | null {
  return typeof storedValue === 'number' && Number.isFinite(storedValue) ? storedValue : null;
}

/**
 * Counts the adoption or return transactions linked to an applicant.
 *
 * @param transactions - Transactions fetched for the applicant
 * @param transactionType - Event type to count
 * @returns Number of matching transactions
 */
export function countApplicantTransactions(
  transactions: AnimalTransactionType[],
  transactionType: ApplicantTransactionCountType
): number {
  return transactions.filter((transaction) => transaction.transactionType === transactionType)
    .length;
}

/**
 * Resolves a denormalized counter, falling back to the transaction history when
 * the stored value is not a valid number.
 *
 * @param storedValue - Raw value read from the applicant profile
 * @param transactions - Transactions linked to the applicant
 * @param transactionType - Event type used for the fallback count
 * @returns A valid counter
 */
export function resolveApplicantCount(
  storedValue: unknown,
  transactions: AnimalTransactionType[],
  transactionType: ApplicantTransactionCountType
): number {
  return (
    getStoredApplicantCount(storedValue) ??
    countApplicantTransactions(transactions, transactionType)
  );
}

/**
 * Checks whether a profile has at least one corrupted denormalized counter.
 *
 * @param profile - Applicant profile read from Firestore
 * @returns True when adoptionCount or returnCount is not a finite number
 */
export function hasInvalidApplicantCounts(profile: ApplicantProfile): boolean {
  return (
    getStoredApplicantCount(profile.adoptionCount) === null ||
    getStoredApplicantCount(profile.returnCount) === null
  );
}

/**
 * Sums two counters safely, treating invalid values as zero.
 *
 * @param firstValue - First raw counter
 * @param secondValue - Second raw counter
 * @returns The sum of the valid counters
 */
export function sumApplicantCounts(firstValue: unknown, secondValue: unknown): number {
  return (getStoredApplicantCount(firstValue) ?? 0) + (getStoredApplicantCount(secondValue) ?? 0);
}
