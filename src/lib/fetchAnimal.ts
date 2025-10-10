import { Animal } from '@/types';

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type PaginatedResponse = {
  data: Animal[];
  pagination: PaginationMeta;
};

export type Filters = Partial<{
  id: string | string[];
  nameIncludes: string;
  gender: Animal['gender'] | Animal['gender'][];
  species: Animal['species'] | Animal['species'][];
  aproxBirthDate: Animal['aproxBirthDate'];
  lifeStage: Animal['lifeStage'] | Animal['lifeStage'][];
  size: Animal['size'] | Animal['size'][];
  isAvalible: Animal['isAvalible'];
  isVisible: Animal['isVisible'];
  isDeleted: Animal['isDeleted'];
  status: Animal['status'] | Animal['status'][];
  minWaitingSince: number;
  sortBy: keyof Pick<
    Animal,
    | 'name'
    | 'waitingSince'
    | 'isAvalible'
    | 'aproxBirthDate'
    | 'gender'
    | 'species'
    | 'size'
    | 'lifeStage'
  >;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}>;

/**
 * Fetches a list of animals from the API, optionally filtered and sorted by various criteria.
 *
 * Sends a POST request to /api/animals with the provided filters and sorting options.
 * Returns an array of Animal objects.
 *
 * Available filters:
 *   - id: string | string[] (supports multiple IDs for bulk lookup)
 *   - nameIncludes: string
 *   - gender: 'macho' | 'hembra' or ['macho', 'hembra'] (multiple)
 *   - species: 'perro' | 'gato' | 'otros' or array (multiple)
 *   - aproxBirthDate: number
 *   - lifeStage: 'cachorro' | 'joven' | 'adulto' or array (multiple)
 *   - size: 'pequeño' | 'mediano' | 'grande' | 'no_se_sabe' or array (multiple)
 *   - isAvalible: boolean
 *   - isVisible: boolean
 *   - isDeleted: boolean
 *   - status: 'calle' | 'protectora' | 'transitorio' | 'adoptado' or array (multiple)
 *   - minWaitingSince: number
 *   - sortBy: 'name' | 'waitingSince' | 'isAvalible' | 'aproxBirthDate' | 'gender' | 'species' | 'size' | 'lifeStage'
 *   - sortOrder: 'asc' | 'desc'
 *   - page: number (1-indexed, for pagination)
 *   - limit: number (results per page, max 100)
 *
 * @param {Filters} [filters={}] - Optional filters and sorting options for the query.
 * @returns {Promise<Animal[] | {data: Animal[], pagination: object}>} A promise that resolves to an array of Animal objects, or paginated response if page/limit provided.
 *
 * @example
 * // Fetch all animals
 * const animals = await fetchAnimals();
 *
 * @example
 * // Fetch single animal by ID (returns Animal[])
 * const animals = await fetchAnimals({ id: 'abc123' });
 * const [animal] = animals; // Get first (and only) result
 *
 * @example
 * // Fetch multiple animals by IDs (returns Animal[])
 * const animals = await fetchAnimals({ id: ['abc123', 'def456'] });
 *
 * @example
 * // Fetch only available dogs, sorted by name
 * const animals = await fetchAnimals({ species: 'perro', isAvalible: true, sortBy: 'name', sortOrder: 'asc' });
 *
 * @example
 * // Fetch animals with name including "Luna"
 * const animals = await fetchAnimals({ nameIncludes: 'Luna' });
 *
 * @example
 * // Fetch cachorros OR jóvenes (multiple values for same field)
 * const animals = await fetchAnimals({ lifeStage: ['cachorro', 'joven'] });
 *
 * @example
 * // Fetch perros OR gatos that are pequeño OR mediano
 * const animals = await fetchAnimals({ species: ['perro', 'gato'], size: ['pequeño', 'mediano'] });
 *
 * @example
 * // Fetch paginated results (returns PaginatedResponse)
 * const result = await fetchAnimals({ species: 'perro', page: 1, limit: 12 });
 * console.log(result.data); // Animal[]
 * console.log(result.pagination); // { page: 1, limit: 12, total: 45, totalPages: 4, ... }
 */

// Function overloads for type safety
export async function fetchAnimals(filters: Filters & { id: string | string[] }): Promise<Animal[]>;
export async function fetchAnimals(
  filters: Filters & { page: number; limit: number }
): Promise<PaginatedResponse>;
export async function fetchAnimals(filters?: Filters): Promise<Animal[] | PaginatedResponse>;

export async function fetchAnimals(filters: Filters = {}): Promise<Animal[] | PaginatedResponse> {
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

2) Fetch single animal by ID (always returns Animal[], never paginated)
   const animals = await fetchAnimals({ id: 'abc123' });
   const [animal] = animals; // Destructure first result

3) Fetch multiple animals by IDs (always returns Animal[], never paginated)
   const animals = await fetchAnimals({ id: ['abc123', 'def456', 'ghi789'] });

4) Fetch only available dogs, sorted by name
   const animals = await fetchAnimals({
     species: 'perro',
     isAvalible: true,
     sortBy: 'name',
     sortOrder: 'asc'
   });

5) Fetch animals with name including "Luna"
   const animals = await fetchAnimals({ nameIncludes: 'Luna' });

6) Fetch animals that are visible and not deleted
   const animals = await fetchAnimals({ isVisible: true, isDeleted: false });

7) Fetch animals with a minimum waiting time
   const animals = await fetchAnimals({ minWaitingSince: 1680000000000 });

8) Fetch cachorros OR jóvenes (multiple values for same field)
   const animals = await fetchAnimals({ lifeStage: ['cachorro', 'joven'] });

9) Fetch perros OR gatos that are pequeño OR mediano
   const animals = await fetchAnimals({ 
     species: ['perro', 'gato'], 
     size: ['pequeño', 'mediano'] 
   });

10) Fetch machos that are in transitorio OR adoptado status
   const animals = await fetchAnimals({ 
     gender: 'macho',
     status: ['transitorio', 'adoptado'] 
   });

11) Fetch paginated results - page 1, 12 per page
   const result = await fetchAnimals({ 
     species: 'perro',
     page: 1,
     limit: 12 
   });
   // result = { data: Animal[], pagination: { page, limit, total, totalPages, ... } }

──────────────────────────────────────────────────────────────────────────── */
