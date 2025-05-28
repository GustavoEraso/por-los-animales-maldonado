import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://porlosanimalesmaldonado.com";

  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  try {
    const res = await fetch(`${baseUrl}/api/authorized-emails`, {
      headers: {
        "x-internal-token": process.env.INTERNAL_API_SECRET!,
      },
    });

    if (!res.ok) throw new Error("Fallo al consultar emails autorizados");

    const users: { email: string; name?: string; role?: string }[] = await res.json();

    const user = users.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json({ authorized: false });
    }

    return NextResponse.json({
      authorized: true,
      role: user.role || "viewer",
      name: user.name || "",
    });
  } catch (err) {
    console.error("Error verificando usuario:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
