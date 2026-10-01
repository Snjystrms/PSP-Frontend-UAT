import "next-auth";
import "next-auth/jwt";
import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/types";

declare module "next-auth" {
  interface User { role: Role; accessToken: string; pspCode?: string }
  interface Session { user: { role: Role; pspCode?: string } & NonNullable<DefaultSession["user"]> }
}

declare module "next-auth/jwt" { interface JWT { role?: Role; accessToken?: string; pspCode?: string } }
