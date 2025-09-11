
import { WpContactType } from "@/types";

/**
 * Fetches the list of WhatsApp contacts from the API.
 *
 * Sends a GET request to /api/contacts and returns an array of WpContactType objects.
 * Each contact object includes:
 *   - name: string
 *   - phone: string
 *   - countryCode: string
 * The base URL is determined by the environment (development or production).
 * Revalidates the data every 60 seconds.
 *
 * @returns {Promise<WpContactType[]>} A promise that resolves to an array of WhatsApp contact objects.
 *
 * @example
 * // Fetch all WhatsApp contacts
 * const contacts = await fetchContacts();
 * // Example result: [{ name: 'Juan', phone: '99123456', countryCode: '+598' },{ name: 'Maria', phone: '99123456', countryCode: '+598' }]
 *
 * @example
 * // Handle errors when fetching contacts
 * try {
 *   const contacts = await fetchContacts();
 *   if (contacts.length === 0) {
 *     console.log('No contacts found or there was an error.');
 *   }
 * } catch (error) {
 *   console.error(error);
 * }
 */
export async function fetchContacts(): Promise<WpContactType[]> {
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://www.porlosanimalesmaldonado.com";

  const res = await fetch(`${baseUrl}/api/contacts`, {
    next: { revalidate: 60 }, 
  });

  if (!res.ok) {
    console.error("Error al obtener contactos:", res.statusText);
    return [];
  }

  return res.json();
}

/* ─────────────────────────  USAGE EXAMPLES  ──────────────────────────

1) Fetch all WhatsApp contacts
   const contacts = await fetchContacts();
   // Example result: [{ name: 'Juan', phone: '99123456', countryCode: '+598' },{ name: 'Maria', phone: '99123456', countryCode: '+598' }]

2) Handle errors when fetching contacts
   try {
     const contacts = await fetchContacts();
     if (contacts.length === 0) {
       console.log('No contacts found or there was an error.');
     }
   } catch (error) {
     console.error(error);
   }

3) Display contact names
   const contacts = await fetchContacts();
   contacts.forEach(contact => {
     console.log(contact.name);
   });

──────────────────────────────────────────────────────────────────────────── */