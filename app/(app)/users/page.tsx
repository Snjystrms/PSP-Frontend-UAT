import { redirect } from "next/navigation";
import { UsersRound } from "lucide-react";
import { auth } from "@/lib/auth";
import { UsersTable } from "@/components/admin/users-table";

export default async function UsersPage() {
  const session = await auth();
  if (session?.user.role !== "admin") redirect("/dashboard");
  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div>
        <h1 className="mt-1 flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <UsersRound className="size-5" />
          </span>
          Portal users
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage administrator and partner accounts.
        </p>
      </div>
      <UsersTable currentUserId={Number(session.user.id)} />
    </div>
  );
}
