// lib/fetchAnimals.ts
import { Animal } from "@/types";

type Filters = Partial<{
  id: string;
  nameIncludes: string;
  gender: Animal["gender"];
  species: Animal["species"];
  aproxBirthDate: Animal["aproxBirthDate"];
  lifeSatge: Animal["lifeSatge"];
  size: Animal["size"];
  status: Animal["status"];
  location: Animal["location"];
  minWaitingSince: number;
  sortBy: keyof Pick<Animal, "name" | "waitingSince" | "status" | "aproxBirthDate" | "gender" | "species" | "size">;
  sortOrder: "asc" | "desc";
}>;

export async function fetchAnimals(filters: Filters = {}): Promise<Animal[]> {
   const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://porlosanimalesmaldonado.com";

  const res = await fetch(`${baseUrl}/api/animals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-token": process.env.INTERNAL_API_SECRET!,
    },
    body: JSON.stringify(filters),
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    console.error("Error al obtener animales:", res.statusText);
    return [];
  }

  return res.json();
}
