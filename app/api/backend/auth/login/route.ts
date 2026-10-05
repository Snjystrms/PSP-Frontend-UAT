import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE = "vaspan_access_token";
const backendBase = () => (process.env.PSP_API_BASE_URL ?? "http://localhost:8000/api/v1").replace(/\/+$/, "");

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ message: "Cross-origin login request rejected." }, { status: 403 });
  }

  let credentials: { email?: unknown; password?: unknown };
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ message: "Enter your email and password." }, { status: 400 });
  }
  if (typeof credentials.email !== "string" || typeof credentials.password !== "string" || !credentials.email.trim() || !credentials.password) {
    return NextResponse.json({ message: "Enter your email and password." }, { status: 400 });
  }

  try {
    const loginResponse = await fetch(`${backendBase()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: credentials.email.trim(), password: credentials.password }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    console.info(`[Vaspan auth] POST ${backendBase()}/auth/login -> ${loginResponse.status}`);
    const login = await loginResponse.json().catch(() => null) as { access_token?: unknown; expires_in_minutes?: unknown; message?: string; error_code?: string } | null;
    if (!loginResponse.ok) {
      return NextResponse.json({ message: login?.message ?? "The backend rejected this sign-in.", error_code: login?.error_code }, { status: loginResponse.status });
    }
    if (typeof login?.access_token !== "string" || !login.access_token) {
      console.error("[Vaspan auth] Login succeeded without an access token in the response.");
      return NextResponse.json({ message: "The backend returned an invalid login response." }, { status: 502 });
    }

    const profileResponse = await fetch(`${backendBase()}/auth/me`, {
      headers: { Authorization: `Bearer ${login.access_token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    console.info(`[Vaspan auth] GET ${backendBase()}/auth/me -> ${profileResponse.status}`);
    if (!profileResponse.ok) {
      return NextResponse.json({ message: "The backend accepted sign-in but could not load your user profile." }, { status: 502 });
    }
    const profile = await profileResponse.json() as {
      id: number;
      email: string;
      full_name: string;
      role: string;
      psp_code?: string | null;
    };
    const response = NextResponse.json({
      success: true,
      user: { id: profile.id, email: profile.email, name: profile.full_name, role: profile.role, pspCode: profile.psp_code ?? undefined },
    });
    const configuredMinutes = Number(login.expires_in_minutes);
    response.cookies.set(ACCESS_COOKIE, login.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: Number.isFinite(configuredMinutes) && configuredMinutes > 0 ? configuredMinutes * 60 : 60 * 60,
    });
    return response;
  } catch (error) {
    console.error("[Vaspan auth] Backend login request failed:", error instanceof Error ? error.message : "Unknown network error");
    return NextResponse.json({ message: "Could not reach the payment service. Check the backend URL and try again." }, { status: 502 });
  }
}
