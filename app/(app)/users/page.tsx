import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { UsersTable } from "@/components/admin/users-table";

export default async function UsersPage() {
  const session = await auth();
  if (session?.user.role !== "admin") redirect("/dashboard");
  return <div className="mx-auto max-w-[1440px] space-y-6"><div><p className="text-sm text-muted-foreground">Access control</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Portal users</h1><p className="mt-2 text-sm text-muted-foreground">Manage administrator and partner accounts.</p></div><UsersTable currentUserId={Number(session.user.id)} /></div>;
}
