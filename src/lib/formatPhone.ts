interface Props{
    countryCode: string,
    phone: string
}

/**
 * Formats a phone number with its country code according to local conventions.
 *
 * Supports formatting for Uruguay (+598), Argentina (+54), and Brazil (+55).
 * For other country codes, returns a generic format: "<countryCode> <phone>".
 *
 * @param {Object} params - Parameters for formatting the phone number.
 * @param {string} params.countryCode - The country code (e.g., "+598").
 * @param {string} params.phone - The phone number as a string.
 * @returns {string} The formatted phone number.
 *
 * @example
 * // Format a Uruguayan phone number
 * const formatted = formatPhone({ countryCode: '+598', phone: '94144657' });
 * // Result: "+598 94 144 657"
 *
 * @example
 * // Format an Argentine phone number
 * const formatted = formatPhone({ countryCode: '+54', phone: '911234567' });
 * // Result: "+54 9 11 2345 67"
 *
 * @example
 * // Format a Brazilian phone number
 * const formatted = formatPhone({ countryCode: '+55', phone: '11987654321' });
 * // Result: "+55 11 98765 4321"
 *
 * @example
 * // Format a phone number with an unsupported country code
 * const formatted = formatPhone({ countryCode: '+1', phone: '1234567890' });
 * // Result: "+1 1234567890"
 */
export function formatPhone({countryCode, phone}:Props): string {
  switch (countryCode) {
    case "+598": // Uruguay (ej: 94144657 → 94 144 657)
      return `${countryCode} ${phone.slice(0,2)} ${phone.slice(2,5)} ${phone.slice(5)}`;

    case "+54": // Argentina (ej: 911234567 → 9 11 2345 67)
      return `${countryCode} ${phone.slice(0,1)} ${phone.slice(1,3)} ${phone.slice(3,7)} ${phone.slice(7)}`;

    case "+55": // Brasil (ej: 11987654321 → 11 98765 4321)
      return `${countryCode} ${phone.slice(0,2)} ${phone.slice(2,7)} ${phone.slice(7)}`;

    default: // generic format for other country codes
      return `${countryCode} ${phone}`;
  }
}

/* ─────────────────────────  USAGE EXAMPLES  ──────────────────────────

1) Format a Uruguayan phone number
   const formatted = formatPhone({ countryCode: '+598', phone: '94144657' });
   // Result: "+598 94 144 657"

2) Format an Argentine phone number
   const formatted = formatPhone({ countryCode: '+54', phone: '911234567' });
   // Result: "+54 9 11 2345 67"

3) Format a Brazilian phone number
   const formatted = formatPhone({ countryCode: '+55', phone: '11987654321' });
   // Result: "+55 11 98765 4321"

4) Format a phone number with an unsupported country code
   const formatted = formatPhone({ countryCode: '+1', phone: '1234567890' });
   // Result: "+1 1234567890"

──────────────────────────────────────────────────────────────────────────── */