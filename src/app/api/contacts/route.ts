import {  NextResponse } from "next/server";
import { WpContactType } from "@/types";

// Cache en memoria
let lastCache: WpContactType[] | null = null;
let lastFetch = 0;
const TTL = 60_000; // 60 segundos



export async function GET() {
    const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://www.porlosanimalesmaldonado.com";
  try {
 

    const now = Date.now();

    // Refresca cache si expiró
    if (!lastCache || now - lastFetch > TTL) {
      const res = await fetch(baseUrl + "/api/contacts-cache",{
  headers: {
    "x-internal-token": process.env.INTERNAL_API_SECRET!,
  },});
      if (!res.ok) throw new Error("No se pudo obtener el cache");
      lastCache = await res.json();
      lastFetch = now;
    }
    

    
    return NextResponse.json(lastCache);
  } catch (err) {
    console.error("Error al recibir los contactos:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}


