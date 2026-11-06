/**
 * Date parsing for Google Forms values.
 *
 * Google Sheets stores `Marca temporal` as a locale string (dd/mm/yyyy in
 * Uruguay). `new Date('12/09/2026')` interprets it as mm/dd/yyyy (December 9),
 * which shifts migrated applicant dates. This helper parses day-first and
 * stores the resulting date at noon UTC so the calendar date does not shift
 * when displayed in any nearby timezone.
 */

const MONTEVIDEO_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Montevideo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function toNoonUtc(year: number, month: number, day: number): number | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const time = Date.UTC(year, month - 1, day, 12, 0, 0);
  return Number.isNaN(time) ? null : time;
}

/**
 * Normalizes an instant to noon UTC of its America/Montevideo calendar date.
 *
 * @param time - Timestamp in milliseconds
 * @returns Noon UTC timestamp, or null when invalid
 */
function toNoonUtcFromInstant(time: number): number | null {
  if (!Number.isFinite(time)) return null;
  const dayKey = MONTEVIDEO_DATE_FORMATTER.format(new Date(time));
  const [year, month, day] = dayKey.split('-').map(Number);
  return toNoonUtc(year, month, day);
}

/**
 * Parses a form date value into a timestamp.
 *
 * Supported values:
 * - ISO strings (`2026-09-12`, `2026-09-12T14:30:00-03:00`).
 * - Locale strings (`12/09/2026`, `12/9/2026 14:30:00`, `12-09-2026`).
 * - Unix timestamps in seconds/milliseconds.
 * - Google Sheets serial dates.
 *
 * Slash/dash dates are parsed day-first, matching the Uruguayan form locale.
 *
 * @param value - Value stored in `submittedAt` or `createdAt`
 * @returns Noon UTC timestamp for the form's calendar date, or null
 */
export function parseFormDate(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 1e12) return toNoonUtcFromInstant(value);
    if (value > 1e9) return toNoonUtcFromInstant(value * 1000);
    if (value > 20000 && value < 80000) {
      // Google Sheets serial date: days since 1899-12-30.
      const dayTime = Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000;
      return toNoonUtcFromInstant(dayTime);
    }
    return null;
  }

  if (typeof value !== 'string') return null;

  const text = value.trim();
  if (!text) return null;

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return toNoonUtc(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const localeMatch = text.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (localeMatch) {
    let day = Number(localeMatch[1]);
    let month = Number(localeMatch[2]);
    const year = Number(localeMatch[3]);

    // If the second value cannot be a month, treat the string as mm/dd/yyyy.
    if (month > 12 && day <= 12) {
      const swap = day;
      day = month;
      month = swap;
    }

    return toNoonUtc(year, month, day);
  }

  const fallback = new Date(text).getTime();
  return toNoonUtcFromInstant(fallback);
}
