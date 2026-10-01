import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@/lib/types";

export const MOCK_USERS = [
  { id: "usr_admin", name: "Alex Morgan", email: "admin@vaspan.dev", password: "admin123", role: "admin" as const },
  { id: "usr_agent", name: "Sam Rivera", email: "agent@vaspan.dev", password: "agent123", role: "agent" as const },
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? "vaspan-local-demo-secret-change-before-deploy",
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [Credentials({
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
    authorize(credentials) {
      const user = MOCK_USERS.find((entry) => entry.email === credentials.email && entry.password === credentials.password);
      if (!user) return null;
      return { id: user.id, name: user.name, email: user.email, role: user.role };
    },
  })],
  callbacks: {
    jwt({ token, user }) { if (user) token.role = user.role as Role; return token; },
    session({ session, token }) { if (session.user) session.user.role = token.role as Role; return session; },
  },
  pages: { signIn: "/login" },
});
