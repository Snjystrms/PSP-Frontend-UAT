import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@/lib/types";

const backendBase = () => (process.env.PSP_API_BASE_URL ?? "http://localhost:8000/api/v1").replace(/\/+$/, "");

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [Credentials({
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
    async authorize(credentials, request) {
      if (typeof credentials.email !== "string") return null;
      const backendToken = request.headers.get("cookie")
        ?.split(";")
        .map((item) => item.trim())
        .find((item) => item.startsWith("vaspan_backend_login_token="))
        ?.slice("vaspan_backend_login_token=".length);
      if (!backendToken) {
        console.warn("[Vaspan auth] Credentials callback received without the short-lived backend login cookie.");
        return null;
      }
      try {
        const accessToken = decodeURIComponent(backendToken);
        const response = await fetch(`${backendBase()}/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        });
        console.info(`[Vaspan auth] GET ${backendBase()}/auth/me -> ${response.status}`);
        if (!response.ok) return null;
        const profile = (await response.json()) as {
          id: number;
          email: string;
          full_name: string;
          role: Role;
          psp_code: string | null;
        };
        return {
          id: String(profile.id),
          name: profile.full_name,
          email: profile.email,
          role: profile.role,
          pspCode: profile.psp_code ?? undefined,
          accessToken,
        };
      } catch (error) {
        console.error("[Vaspan auth] Could not load the authenticated backend profile:", error instanceof Error ? error.message : "Unknown network error");
        return null;
      }
    },
  })],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.pspCode = user.pspCode;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as Role;
        session.user.pspCode = token.pspCode;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
});
