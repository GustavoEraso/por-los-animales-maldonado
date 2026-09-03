/**
 * Contact normalization helpers for applicant identity resolution.
 *
 * Normalizing contacts consistently is critical: the same person typing their
 * email with uppercase letters or their phone with spaces must produce the
 * same index key on every submission, otherwise duplicate applicant profiles
 * would be created.
 */

/** A piece of contact data extracted from a form submission. */
export interface ContactInput {
  type: 'email' | 'phone';
  /** The value as entered by the applicant (visible to admins only). */
  rawValue: string;
  normalizedValue: string;
  /** Source canonical field, e.g. 'applicantEmail', 'googleAccountEmail', 'phone'. */
  label: string;
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

const MIN_PHONE_DIGITS = 6;
const MAX_PHONE_DIGITS = 15;

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
 * Extracts contact data from a normalized (mapped) form document.
 * Uses both stored emails and the phone, producing a contact list suitable
 * for identity indexing. Values that fail normalization are skipped.
 *
 * @param mappedData - The canonical form fields (after FIELD_MAP mapping)
 * @returns The list of usable contacts found in the submission
 */
export function extractContacts(mappedData: Record<string, unknown>): ContactInput[] {
  const contacts: ContactInput[] = [];

  const applicantEmail = normalizeEmail(mappedData.applicantEmail);
  if (applicantEmail) {
    contacts.push({
      type: 'email',
      rawValue:
        typeof mappedData.applicantEmail === 'string'
          ? mappedData.applicantEmail.trim()
          : applicantEmail,
      normalizedValue: applicantEmail,
      label: 'applicantEmail',
    });
  }

  const googleAccountEmail = normalizeEmail(mappedData.googleAccountEmail);
  if (googleAccountEmail) {
    contacts.push({
      type: 'email',
      rawValue:
        typeof mappedData.googleAccountEmail === 'string'
          ? mappedData.googleAccountEmail.trim()
          : googleAccountEmail,
      normalizedValue: googleAccountEmail,
      label: 'googleAccountEmail',
    });
  }

  const phone = normalizePhone(mappedData.phone);
  if (phone) {
    contacts.push({
      type: 'phone',
      rawValue: typeof mappedData.phone === 'string' ? mappedData.phone.trim() : phone,
      normalizedValue: phone,
      label: 'phone',
    });
  }

  return contacts;
}
