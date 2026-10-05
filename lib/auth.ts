import { cache } from "react";
import { cookies } from "next/headers";
import type { Role } from "@/lib/types";

const backendBase = () => (process.env.PSP_API_BASE_URL ?? "http://localhost:8000/api/v1").replace(/\/+$/, "");
const ACCESS_COOKIE = "vaspan_access_token";


// Read the backend profile directly. React cache deduplicates this if the
// protected layout and a nested page both check the user during one request.
export const auth = cache(async () => {
  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  try {
    const response = await fetch(`${backendBase()}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    console.info(`[Vaspan auth] GET ${backendBase()}/auth/me -> ${response.status}`);
    if (!response.ok) return null;
    const profile = await response.json() as {
      id: number;
      email: string;
      full_name: string;
      role: Role;
      psp_code?: string | null;
    };
    return { user: { id: String(profile.id), name: profile.full_name, email: profile.email, role: profile.role, pspCode: profile.psp_code ?? undefined } };
  } catch (error) {
    console.error("[Vaspan auth] Could not load the authenticated backend profile:", error instanceof Error ? error.message : "Unknown network error");
    return null;
  }
});
