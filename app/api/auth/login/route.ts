import type { NextRequest } from "next/server";

const LOGIN_COOKIE = "vaspan_backend_login_token";
const backendBase = () => (process.env.PSP_API_BASE_URL ?? "http://localhost:8000/api/v1").replace(/\/+$/, "");

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return Response.json({ message: "Cross-origin login request rejected." }, { status: 403 });
  }

  let credentials: { email?: unknown; password?: unknown };
  try {
    credentials = await request.json();
  } catch {
    return Response.json({ message: "Enter your email and password." }, { status: 400 });
  }
  if (typeof credentials.email !== "string" || typeof credentials.password !== "string" || !credentials.email.trim() || !credentials.password) {
    return Response.json({ message: "Enter your email and password." }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${backendBase()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: credentials.email.trim(), password: credentials.password }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    console.info(`[Vaspan auth] POST ${backendBase()}/auth/login -> ${upstream.status}`);
    const result = await upstream.json().catch(() => null) as { access_token?: unknown; message?: string; error_code?: string } | null;
    if (!upstream.ok) {
      return Response.json(
        { message: result?.message ?? "The backend rejected this sign-in.", error_code: result?.error_code },
        { status: upstream.status },
      );
    }
    if (typeof result?.access_token !== "string" || !result.access_token) {
      console.error("[Vaspan auth] Login succeeded without an access token in the response.");
      return Response.json({ message: "The backend returned an invalid login response." }, { status: 502 });
    }

    const response = Response.json({ success: true });
    response.headers.append("Set-Cookie", `${LOGIN_COOKIE}=${encodeURIComponent(result.access_token)}; Path=/api/auth; Max-Age=60; HttpOnly; SameSite=Strict${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
    return response;
  } catch (error) {
    console.error("[Vaspan auth] Backend login request failed:", error instanceof Error ? error.message : "Unknown network error");
    return Response.json({ message: "Could not reach the payment service. Check the backend URL and try again." }, { status: 502 });
  }
}

export async function DELETE() {
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": `${LOGIN_COOKIE}=; Path=/api/auth; Max-Age=0; HttpOnly; SameSite=Strict${process.env.NODE_ENV === "production" ? "; Secure" : ""}` },
  });
}
