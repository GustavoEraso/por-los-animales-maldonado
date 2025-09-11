/**
 * Formats a timestamp as MM/YYYY.
 *
 * @param {number} timestamp - The timestamp in milliseconds.
 * @returns {string} The formatted date as MM/YYYY.
 *
 * @example
 * // Format a timestamp for March 2024
 * const dateStr = formatDateMMYYYY(1711929600000); // "03/2024"
 */
export function formatDateMMYYYY(timestamp: number): string {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${month}/${year}`;
}



/**
 * Calculates the elapsed time in years and months from a given timestamp to now.
 *
 * @param {number} millis - The timestamp in milliseconds.
 * @returns {string} A string describing the elapsed time (e.g., "2 años y 3 meses", "5 meses", "menos de un mes").
 *
 * @example
 * // Get elapsed time from a timestamp
 * const elapsed = yearsOrMonthsElapsed(1711929600000); // "1 año y 1 mes"
 *
 * @example
 * // Less than a month
 * const elapsed = yearsOrMonthsElapsed(1711929600000); // "menos de un mes"
 */
export function yearsOrMonthsElapsed(millis: number): string {
  
  const then = new Date(millis);
  const now  = new Date();

  let years  = now.getFullYear() - then.getFullYear();
  let months = now.getMonth()   - then.getMonth();

  // Adjust months if the current day is before the day in 'then'
  if (now.getDate() < then.getDate()) months--;

  // Normalize negative months by adding 12 and subtracting a year
  if (months < 0) {
    years--;
    months += 12;
  }

  // If there is at least one year, return years and months (months can be 0)  
  if (years >= 1) {
    const yearPart  = `${years} ${years === 1 ? 'año' : 'años'}`;
    const monthPart = months > 0 ? ` y ${months} ${months === 1 ? 'mes' : 'meses'}` : '';
    return yearPart + monthPart;
  }

  // If less than a year, return only months
  if (months >= 1) return `${months} ${months === 1 ? 'mes' : 'meses'}`;

  // If less than a month, return this message
  return 'menos de un mes';
}

