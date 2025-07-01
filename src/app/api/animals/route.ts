import { NextRequest, NextResponse } from "next/server";
import { Animal } from "@/types";

// Cache en memoria
let lastCache: Animal[] | null = null;
let lastFetch = 0;
const TTL = 60_000; // 60 segundos

// Campos que no deben ser normalizados
const EXCLUDE_NORMALIZATION: (keyof Animal)[] = ["id", "waitingSince"];

// Función para normalizar texto (sin mayúsculas ni acentos)
function normalize(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export async function POST(req: NextRequest) {
    const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://www.porlosanimalesmaldonado.com";
  try {
 
    const {
      sortBy,
      sortOrder = "asc",
      ...filters
    } = await req.json();

    const now = Date.now();

    // Refresca cache si expiró
    if (!lastCache || now - lastFetch > TTL) {
      const res = await fetch(baseUrl + "/api/animals-cache",{
  headers: {
    "x-internal-token": process.env.INTERNAL_API_SECRET!,
  },});
      if (!res.ok) throw new Error("No se pudo obtener el cache");
      lastCache = await res.json();
      lastFetch = now;
    }

    // Filtro principal
    const filtered = lastCache?.filter((animal) => {
       if (animal.isDeleted) return false;
      const exactMatches = Object.entries(filters).every(([key, value]) => {
        if (["minWaitingSince", "nameIncludes"].includes(key)) return true;

        const animalVal = animal[key as keyof Animal];
        if (value === undefined || animalVal === undefined) return true;

        if (typeof animalVal === "string" && typeof value === "string") {
          if (EXCLUDE_NORMALIZATION.includes(key as keyof Animal)) {
            return animalVal === value;
          }
          return normalize(animalVal) === normalize(value);
        }

        if (typeof animalVal === "number" || typeof animalVal === "boolean") {
          return animalVal === value;
        }

        return true; // ignora arrays/objetos
      });

      const matchesName =
        !filters.nameIncludes ||
        normalize(animal.name).includes(normalize(filters.nameIncludes));

      const matchesWait =
        filters.minWaitingSince === undefined ||
        animal.waitingSince >= filters.minWaitingSince;

      return exactMatches && matchesName && matchesWait;
    });

    // Ordenamiento si se especifica
    let finalResults = filtered;

    if (
      sortBy &&
      ["name", "waitingSince", "aproxBirthDate","isAvalible","isVisible", "gender", "species", "size"].includes(sortBy)
    ) {
        if(!filtered) return NextResponse.json([]);
      finalResults = [...filtered].sort((a, b) => {
        const aVal = a[sortBy as keyof Animal];
        const bVal = b[sortBy as keyof Animal];

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortOrder === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    }

    return NextResponse.json(finalResults);
  } catch (err) {
    console.error("Error en filtrado de animales:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}


