import { Animal } from '@/types';

type Filters = Partial<{
  id: string;
  nameIncludes: string;
  gender: Animal['gender'];
  species: Animal['species'];
  aproxBirthDate: Animal['aproxBirthDate'];
  lifeStage: Animal['lifeStage'];
  size: Animal['size'];
  isAvalible: Animal['isAvalible'];
  isVisible: Animal['isVisible'];
  isDeleted: Animal['isDeleted'];
  status: Animal['status'];
  minWaitingSince: number;
  sortBy: keyof Pick<
    Animal,
    'name' | 'waitingSince' | 'isAvalible' | 'aproxBirthDate' | 'gender' | 'species' | 'size'
  >;
  sortOrder: 'asc' | 'desc';
}>;

/**
 * Fetches a list of animals from the API, optionally filtered and sorted by various criteria.
 *
 * Sends a POST request to /api/animals with the provided filters and sorting options.
 * Returns an array of Animal objects.
 *
 * Available filters:
 *   - id: string
 *   - nameIncludes: string
 *   - gender: 'male' | 'female' | ...
 *   - species: string
 *   - aproxBirthDate: number
 *   - lifeStage: string
 *   - size: string
 *   - isAvalible: boolean
 *   - isVisible: boolean
 *   - isDeleted: boolean
 *   - status: string
 *   - minWaitingSince: number
 *   - sortBy: 'name' | 'waitingSince' | 'isAvalible' | 'aproxBirthDate' | 'gender' | 'species' | 'size'
 *   - sortOrder: 'asc' | 'desc'
 *
 * @param {Filters} [filters={}] - Optional filters and sorting options for the query.
 * @returns {Promise<Animal[]>} A promise that resolves to an array of Animal objects.
 *
 * @example
 * // Fetch all animals
 * const animals = await fetchAnimals();
 *
 * @example
 * // Fetch only available dogs, sorted by name
 * const animals = await fetchAnimals({ species: 'perro', isAvalible: true, sortBy: 'name', sortOrder: 'asc' });
 *
 * @example
 * // Fetch animals with name including "Luna"
 * const animals = await fetchAnimals({ nameIncludes: 'Luna' });
 */

export async function fetchAnimals(filters: Filters = {}): Promise<Animal[]> {
  const baseUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://www.porlosanimalesmaldonado.com';

  const res = await fetch(`${baseUrl}/api/animals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filters),
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    console.error('Error al obtener animales:', res.statusText);
    return [];
  }

  return res.json();
}

/* ─────────────────────────  USAGE EXAMPLES  ──────────────────────────

1) Fetch all animals
   const animals = await fetchAnimals();

2) Fetch only available dogs, sorted by name
   const animals = await fetchAnimals({
     species: 'perro',
     isAvalible: true,
     sortBy: 'name',
     sortOrder: 'asc'
   });

3) Fetch animals with name including "Luna"
   const animals = await fetchAnimals({ nameIncludes: 'Luna' });

4) Fetch animals that are visible and not deleted
   const animals = await fetchAnimals({ isVisible: true, isDeleted: false });

5) Fetch animals with a minimum waiting time
   const animals = await fetchAnimals({ minWaitingSince: 1680000000000 });

──────────────────────────────────────────────────────────────────────────── */
