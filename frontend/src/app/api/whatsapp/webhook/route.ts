import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || "addons_secret_token";

  // Permitir verificación si el token coincide o es el por defecto addons_secret_token
  if (mode === "subscribe" && (!token || token === expectedToken || token === "addons_secret_token")) {
    console.log("✅ Meta Webhook verificado en Next.js Vercel:", challenge);
    return new Response(challenge || "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Token de verificación inválido", { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://proyecto-benchamen.onrender.com";

    // Reenviar evento al backend de FastAPI en Render
    await fetch(`${backendUrl}/api/whatsapp/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("Error en Next.js Webhook proxy:", error);
    return NextResponse.json({ status: "error", detail: error?.message }, { status: 500 });
  }
}
