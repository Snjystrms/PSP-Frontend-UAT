import { redirect } from "next/navigation";
import { UsersRound } from "lucide-react";
import { auth } from "@/lib/auth";
import { PspDirectoryTable } from "@/components/clients/psp-directory-table";

export default async function ClientsPage() {
  const session = await auth();
  if (session?.user.role !== "admin") redirect("/dashboard");
  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          <span className="mr-3 inline-grid size-10 place-items-center rounded-xl bg-primary/10 align-middle text-primary">
            <UsersRound className="size-5" />
          </span>
          PSP partners
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review PSP status, settlement accounts, currencies, and callback
          configuration.
        </p>
      </div>
      <PspDirectoryTable />
    </div>
  );
}
