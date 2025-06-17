
import { NextRequest, NextResponse } from "next/server";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/firebase"; // tu instancia de Firestore cliente

export const revalidate = 300; // Cachea la respuesta por 5 mins

export async function GET(req: NextRequest) {
    
  const token = req.headers.get("x-internal-token");

  if (token !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await getDocs(collection(db, "authorizedEmails"));
    const users = snapshot.docs.map(doc => ({
      email: doc.id,
      ...doc.data(), 
    }));   
    return NextResponse.json(users);
  } catch (err) {
    console.error("Error al obtener correos autorizados:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
