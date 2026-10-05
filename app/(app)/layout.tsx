import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { AppShell } from "@/components/layout/app-shell";
import { AuthUserProvider } from "@/components/auth/auth-user-context";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user.role ?? "psp") as Role;
  const userName = session.user.name ?? "Team member";
  return <AuthUserProvider user={{ role, name: userName }}><AppShell role={role} userName={userName}>{children}</AppShell></AuthUserProvider>;
}
