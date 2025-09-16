
/**
 * Generates a unique animal ID based on the provided name by calling the internal API.
 *
 * Sends a POST request to /api/generate-animal-id with the animal's name.
 * Requires an internal token for authorization, provided in the 'x-internal-token' header.
 * The value for 'x-internal-token' must be set as the environment variable NEXT_PUBLIC_INTERNAL_API_SECRET.
 *
 * If the name does not exist, returns the name (e.g., 'luna').
 * If the name already exists, returns the name with a number appended (e.g., 'luna1', 'luna2', etc.).
 *
 * @param {string} name - The name of the animal to generate an ID for.
 * @returns {Promise<string>} A promise that resolves to the generated animal ID.
 *
 * @example
 * // Generate an animal ID for "Luna"
 * const id = await generateAnimalId('Luna'); // returns 'luna' or 'luna1'
 */
export async function generateAnimalId (name: string): Promise<string> {
  const res = await fetch('/api/generate-animal-id', {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'x-internal-token': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET!,
     },
    body: JSON.stringify({ name }),
  });

  const data = await res.json();
  return data.id;
};

/* ─────────────────────────  USAGE EXAMPLES  ──────────────────────────

1) Generate an animal ID for a new name
   const id = await generateAnimalId('Luna');
   // Returns: 'luna' if it does not exist, or 'luna1' if 'luna' already exists

2) Generate an animal ID for a name that already exists multiple times
   const id = await generateAnimalId('Max');
   // Returns: 'max', 'max1', 'max2', etc. depending on existing IDs

3) Use the generated ID to create a new animal
   const id = await generateAnimalId('Bella');
   await postFirestoreData<Animal>({ data: animalData, currentCollection: 'animals', id });

──────────────────────────────────────────────────────────────────────────── */