/**
 * Generates a unique litter ID based on the provided name by calling the internal API.
 *
 * Checks existing animals' litterId fields to ensure uniqueness.
 * If the name does not exist as a litterId, returns the normalized name.
 * If it already exists, returns with a numeric suffix (e.g., 'camada-parque-2').
 *
 * @param name - The name of the litter to generate an ID for
 * @returns A promise that resolves to the generated litter ID
 */
export async function generateLitterId(name: string): Promise<string> {
  const res = await fetch('/api/generate-litter-id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-token': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET!,
    },
    body: JSON.stringify({ name }),
  });

  const data = await res.json();
  return data.id;
}
