import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BankAccountsTable } from "@/components/clients/bank-accounts-table";
export default async function ClientsPage() {
  const session = await auth();
  if (session?.user.role !== "admin") redirect("/dashboard");
  return <div className="mx-auto max-w-[1440px] space-y-6"><div><p className="text-sm text-muted-foreground">Customer information</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Clients & accounts</h1><p className="mt-2 text-sm text-muted-foreground">Review client profiles and their verified bank account details.</p></div><div className="grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Total clients</p><p className="mt-2 text-2xl font-semibold">2,481</p><p className="mt-1 text-xs text-emerald-600">+124 this month</p></article><article className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Verified accounts</p><p className="mt-2 text-2xl font-semibold">2,309</p><p className="mt-1 text-xs text-muted-foreground">93.1% of all clients</p></article><article className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Awaiting review</p><p className="mt-2 text-2xl font-semibold">18</p><p className="mt-1 text-xs text-amber-600">Requires attention</p></article></div><BankAccountsTable /></div>;
}
