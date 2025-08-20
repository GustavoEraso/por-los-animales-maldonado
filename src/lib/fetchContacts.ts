// lib/fetchAnimals.ts
import { WpContactType } from "@/types";


export async function fetchContacts(): Promise<WpContactType[]> {
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://www.porlosanimalesmaldonado.com";

  const res = await fetch(`${baseUrl}/api/contacts`, {
    next: { revalidate: 60 }, // esto está perfecto para ISR
  });

  if (!res.ok) {
    console.error("Error al obtener contactos:", res.statusText);
    return [];
  }

  return res.json();
}
