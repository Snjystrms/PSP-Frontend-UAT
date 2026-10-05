"use client";

import { createContext, useContext } from "react";
import type { Role } from "@/lib/types";

type AuthUser = { id: string; name: string; email: string; role: Role; pspCode?: string };
const AuthUserContext = createContext<AuthUser | null>(null);

export function AuthUserProvider({ user, children }: { user: AuthUser; children: React.ReactNode }) {
  return <AuthUserContext.Provider value={user}>{children}</AuthUserContext.Provider>;
}

export function useAuthUser() {
  return useContext(AuthUserContext);
}
