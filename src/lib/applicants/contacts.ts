/**
 * Contact normalization helpers for applicant profiles.
 *
 * Normalizing contacts consistently matters for the reverse index, but phone
 * numbers are no longer used as automatic identity: they are only a suggestion
 * that staff must review and confirm before they are indexed.
 *
 * Phone values in the form are free text and frequently ambiguous. The
 * splitting/normalizing helpers below are therefore presentation helpers; the
 * confirmation UI is the source of truth.
 */

import type { ApplicantContact, ApplicantContactKind, ApplicantContactStatus } from '@/types';

/** A piece of contact data extracted from a form submission. */
export interface ContactInput {
  type: 'email' | 'phone';
  /** The value as entered by the applicant (visible to admins only). */
  rawValue: string;
  normalizedValue: string;
  /** Source canonical field, e.g. 'applicantEmail', 'googleAccountEmail', 'phone'. */
  label: string;
}

/** A phone contact declared in a form that still needs human confirmation. */
export interface DeclaredContactInput {
  type: 'phone';
  /** The value exactly as entered by the applicant. */
  rawValue: string;
  /** Source canonical field, e.g. 'phone'. */
  label: string;
}

/**
 * Computes the deterministic document ID for a normalized contact.
 *
 * @param contact - Contact type and normalized value
 * @returns The `applicantContactIndex` document ID (e.g. `phone:92194030`)
 */
export function contactIndexDocId(contact: Pick<ContactInput, 'type' | 'normalizedValue'>): string {
  return `${contact.type}:${contact.normalizedValue}`;
}

/**
 * Normalizes a contact value according to its type.
 *
 * @param type - Contact kind
 * @param rawValue - Value entered by staff
 * @returns The normalized value, or null when it is not usable
 */
export function normalizeContactValue(type: 'email' | 'phone', rawValue: string): string | null {
  return type === 'email' ? normalizeEmail(rawValue) : normalizePhone(rawValue);
}

/**
 * Resolves the review state of a contact, including legacy records written
 * before the confirmation flow existed.
 *
 * The automatic Google email and contacts added manually by staff are
 * confirmed. Phones (and any legacy user-typed email) are pending: phones need
 * human review because their raw values are ambiguous.
 *
 * @param contact - Contact stored in the profile
 * @returns The effective review state
 */
export function getApplicantContactStatus(contact: ApplicantContact): ApplicantContactStatus {
  if (contact.confirmationStatus) return contact.confirmationStatus;
  if (contact.labels?.includes('googleAccountEmail') || contact.labels?.includes('manual')) {
    return 'confirmed';
  }
  return 'pending';
}

/**
 * Normalizes a phone-like search term to digits, stripping a leading country
 * code (598/00598) and trunk zero. Used by search boxes so typing `092000`
 * matches a stored `092 000` or a normalized `92000`.
 *
 * @param value - Raw search term or phone value
 * @returns Digits without country code/trunk zero, or an empty string
 */
export function normalizePhoneSearchDigits(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';

  let digits = String(value).replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('00598')) {
    digits = digits.slice(5);
  } else if (digits.startsWith('598')) {
    digits = digits.slice(3);
  }

  return digits.replace(/^0+/, '');
}

/**
 * Normalizes a name for prefix search: lowercase, no diacritics and collapsed
 * whitespace. The same normalization must be used when writing `searchName`.
 *
 * @param value - Raw name or search term
 * @returns A normalized name suitable for prefix comparisons
 */
export function normalizeApplicantSearchName(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Resolves the user-facing kind of a contact, including legacy records that
 * only have the internal email/phone channel.
 *
 * @param contact - Contact stored in the profile
 * @returns The kind shown in the UI
 */
export function getApplicantContactKind(contact: ApplicantContact): ApplicantContactKind {
  if (contact.kind) return contact.kind;
  return contact.type === 'email' ? 'email' : 'celular';
}

/**
 * Maps a user-facing kind to the internal identity channel.
 *
 * `other` is stored as a phone channel, but it is not indexed: it is only a
 * visible contact (e.g. a landline or an alternative contact).
 *
 * @param kind - User-facing contact kind
 * @returns The identity channel used for normalization
 */
export function getContactTypeFromKind(kind: ApplicantContactKind): 'email' | 'phone' {
  return kind === 'email' ? 'email' : 'phone';
}

/**
 * Whether a contact kind should be normalized and written to the reverse index.
 *
 * @param kind - User-facing contact kind
 * @returns False for `other`, which is visible-only
 */
export function isIndexableContactKind(kind: ApplicantContactKind): boolean {
  return kind !== 'other';
}

/**
 * Builds a stable key to deduplicate contacts in the profile list.
 *
 * Confirmed contacts are keyed by their normalized value; pending and
 * discarded contacts are keyed by their raw value, because they do not have a
 * trustworthy normalization yet.
 *
 * @param contact - Contact to key
 * @returns A string key unique within a profile
 */
export function applicantContactKey(contact: ApplicantContact): string {
  const status = getApplicantContactStatus(contact);
  if (status === 'confirmed' && contact.normalizedValue) {
    return `${contact.type}:confirmed:${contact.normalizedValue}`;
  }
  return `${contact.type}:${status}:${contact.value.trim().toLowerCase()}`;
}

/**
 * Normalizes an email for matching: trims and lowercases.
 *
 * @param value - The raw email value from the form
 * @returns The normalized email, or null when empty/invalid-ish
 */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  if (!trimmed.includes('@') || trimmed.startsWith('@') || trimmed.endsWith('@')) {
    return null;
  }
  return trimmed;
}

const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;

/**
 * A field with up to this many digits is treated as a single phone number.
 * A single local/international number never exceeds this length, while two
 * real-world numbers always add up to more, so this is a safe split boundary.
 */
const MAX_SINGLE_NUMBER_DIGITS = MAX_PHONE_DIGITS;

/**
 * When a field holds several numbers, consecutive digit groups are merged
 * until they reach this size. This keeps space-separated groups of the same
 * number together ("092 161 229" is one number, not three).
 */
const MERGE_GROUP_MIN_DIGITS = 8;

/** A phone number extracted from a free-text form field. */
interface PhoneCandidate {
  /** The digits as they were grouped from the original value, for display. */
  rawValue: string;
  /** The normalized number used for matching and indexing. */
  normalizedValue: string;
}

/**
 * Normalizes a phone number for matching (conservative, Uruguay-friendly).
 *
 * - Keeps digits only.
 * - Strips a leading country code ("598" or "00598") when present.
 * - Strips a leading trunk "0" for mobiles.
 * - Rejects values that are clearly not usable phone numbers (too short or
 *   too long to match a real number, e.g. the "999" samples sent in tests).
 *
 * @param value - The raw phone value from the form
 * @returns The normalized phone, or null when not trustworthy for identity
 */
export function normalizePhone(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const digitsOnly = String(value).replace(/\D/g, '');
  if (!digitsOnly) return null;

  let normalized = digitsOnly;
  if (normalized.startsWith('00598')) {
    normalized = normalized.slice(5);
  } else if (normalized.startsWith('598')) {
    normalized = normalized.slice(3);
  }
  if (normalized.startsWith('0')) {
    normalized = normalized.slice(1);
  }

  if (normalized.length < MIN_PHONE_DIGITS || normalized.length > MAX_PHONE_DIGITS) {
    return null;
  }
  return normalized;
}

/**
 * Splits a free-text phone field into individual phone candidates.
 *
 * This is a best-effort **suggestion** for the contact confirmation UI. Phone
 * values are no longer used as automatic identity, so an imperfect split is
 * safe: staff reviews the suggested rows, can add/remove them and confirms the
 * final values before anything is indexed.
 *
 * Applicants type phone numbers without a consistent pattern: spaces inside
 * the number ("091 073 961"), several numbers separated by "y" / "/" / "-" /
 * newlines / text ("092 161 229 mi pareja 098 018 150"), country codes
 * ("+598 97 066 958", "54 9 299 628-0910") and occasionally non-phone answers
 * ("Prefiero no compartir").
 *
 * Strategy:
 * - Dots and commas are treated as noise (thousands separators, punctuation
 *   inside a number) and removed before grouping.
 * - Up to MAX_SINGLE_NUMBER_DIGITS digits means a single number: normalize
 *   the whole value.
 * - More digits means several numbers: digit runs are merged until they reach
 *   MERGE_GROUP_MIN_DIGITS, so groups of the same number stay together.
 *
 * @param raw - The raw value of the phone form field
 * @returns The valid, deduplicated phone candidates found in the value
 */
export function splitPhoneCandidates(raw: unknown): PhoneCandidate[] {
  if (typeof raw !== 'string' && typeof raw !== 'number') return [];

  const text = String(raw).trim();
  const withoutNoise = text.replace(/[.,]/g, '');
  const digits = withoutNoise.replace(/\D/g, '');
  if (!digits) return [];

  const candidates: PhoneCandidate[] = [];
  const seen = new Set<string>();

  const push = (rawValue: string, digitsValue: string): void => {
    const normalizedValue = normalizePhone(digitsValue);
    if (!normalizedValue || seen.has(normalizedValue)) return;
    seen.add(normalizedValue);
    candidates.push({ rawValue: rawValue.trim(), normalizedValue });
  };

  if (digits.length <= MAX_SINGLE_NUMBER_DIGITS) {
    push(text || digits, digits);
    return candidates;
  }

  const digitRuns = withoutNoise.match(/\d+/g) ?? [];
  let pending = '';
  for (const run of digitRuns) {
    pending += run;
    if (pending.length >= MERGE_GROUP_MIN_DIGITS) {
      push(pending, pending);
      pending = '';
    }
  }
  if (pending) {
    push(pending, pending);
  }

  return candidates;
}

/**
 * Extracts the normalized phone numbers from a free-text form field.
 * Exposed for scripted verification and for the confirmation UI suggestions.
 *
 * @param raw - The raw value of the phone form field
 * @returns The normalized phone numbers found, deduplicated
 */
export function extractPhoneNumbers(raw: unknown): string[] {
  return splitPhoneCandidates(raw).map((candidate) => candidate.normalizedValue);
}

/**
 * Extracts the phone contacts that need human confirmation.
 *
 * The raw phone field is stored as a single row (not split), because staff
 * decides how many numbers the text actually contains. Splitting it
 * automatically is only a suggestion shown by the confirmation UI.
 *
 * @param mappedData - The canonical form fields (after FIELD_MAP mapping)
 * @returns The declared phone contacts, with their raw values untouched
 */
export function extractPendingPhoneContacts(
  mappedData: Record<string, unknown>
): DeclaredContactInput[] {
  const phone =
    typeof mappedData.phone === 'string'
      ? mappedData.phone.trim()
      : typeof mappedData.phone === 'number'
        ? String(mappedData.phone)
        : '';

  return phone ? [{ type: 'phone', rawValue: phone, label: 'phone' }] : [];
}
