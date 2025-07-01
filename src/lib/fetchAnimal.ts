// lib/fetchAnimals.ts
import { Animal } from "@/types";

type Filters = Partial<{
  id: string;
  nameIncludes: string;
  gender: Animal["gender"];
  species: Animal["species"];
  aproxBirthDate: Animal["aproxBirthDate"];
  lifeStage: Animal["lifeStage"];
  size: Animal["size"];
  isAvalible: Animal["isAvalible"];
  isVisible: Animal["isVisible"];
  isDeleted: Animal["isDeleted"];
  status: Animal["status"];
  minWaitingSince: number;
  sortBy: keyof Pick<Animal, "name" | "waitingSince" | "isAvalible" | "aproxBirthDate" | "gender" | "species" | "size">;
  sortOrder: "asc" | "desc";
}>;

export async function fetchAnimals(filters: Filters = {}): Promise<Animal[]> {
   const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://www.porlosanimalesmaldonado.com";

  const res = await fetch(`${baseUrl}/api/animals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
