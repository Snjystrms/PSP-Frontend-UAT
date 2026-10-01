import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PspDirectoryTable } from "@/components/clients/psp-directory-table";

export default async function ClientsPage() {
  const session = await auth();
  if (session?.user.role !== "admin") redirect("/dashboard");
  return <div className="mx-auto max-w-[1440px] space-y-6"><div><p className="text-sm text-muted-foreground">Payment network</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">PSP partners</h1><p className="mt-2 text-sm text-muted-foreground">Review PSP status, settlement accounts, currencies, and callback configuration.</p></div><PspDirectoryTable /></div>;
}
