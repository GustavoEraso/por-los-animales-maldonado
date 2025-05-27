import { getFirestoreData } from "@/lib/firebase/getFirestoreData";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 60; // Cachea la respuesta por 60s

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("x-internal-token");

  if (token !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
    const data = await getFirestoreData({currentCollection:'animals'}); // <- Llama a Firestore
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error al obtener posts desde Firestore:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}