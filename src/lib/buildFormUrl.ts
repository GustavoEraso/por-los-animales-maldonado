
interface FormUrlParams {
  dogName: string;
  dogId: string;
}

const FORM_BASE =
  'https://docs.google.com/forms/d/e/1FAIpQLScvzAe9is0FY9Yj3jJuVCfi61Un3WhhnmgkXHPWmkwWQcujIw/viewform';

  /**
 * Builds a Google Form URL with pre-filled fields for dog adoption.
 * The generated URL includes the dog's name and a link to its adoption page,
 * automatically filling the corresponding fields in the Google Form.
 *
 * @param {Object} params - Parameters for building the form URL.
 * @param {string} params.dogName - The name of the dog.
 * @param {string} params.dogId - The ID of the dog, used to generate the adoption page URL.
 * @returns {string} The Google Form URL with pre-filled fields.
 *
 * @example
 * // Build a form URL for a dog named "Luna" with ID "abc123"
 * const url = buildFormUrl({ dogName: 'Luna', dogId: 'abc123' });
 * // Result: Google Form URL with Luna's info pre-filled
 * 
 * @example
 * // Use the generated URL in a link to open the Google Form
 *   <a
 *     href={buildFormUrl({ dogName: 'Max', dogId: 'max123' })}
 *     {...otherProps}
 *   >
 *     Fill out form
 *   </a>
 */

export function buildFormUrl({ dogName, dogId }: FormUrlParams): string {
  
  const dogUrl = `https://porlosanimalesmaldonado.com/adopta/${dogId}`;
  const combined = `${dogName.trim()} - ${dogUrl}`;

  const params = new URLSearchParams({
    usp: 'pp_url',
    'entry.1842397340': 'sitio web',
    'entry.1406517497': combined,
  });

  return `${FORM_BASE}?${params.toString()}`;
}

/* ─────────────────────────  USAGE EXAMPLES  ──────────────────────────

1) Build a form URL for a dog named "Luna" with ID "abc123"
   const url = buildFormUrl({ dogName: 'Luna', dogId: 'abc123' });
   // Result: Google Form URL with Luna's info pre-filled

2) Use the generated URL in a link to open the Google Form
   <a
     href={buildFormUrl({ dogName: 'Max', dogId: 'max123' })}
     {...otherProps}
   >
     Fill out form
   </a>

3) Use the generated URL to redirect the user to the Google Form
   const url = buildFormUrl({ dogName: 'Bella', dogId: 'dog77' });
   window.location.href = url;

──────────────────────────────────────────────────────────────────────────── */