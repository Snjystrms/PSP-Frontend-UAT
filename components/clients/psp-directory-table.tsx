"use client";

import { Building2, RefreshCw } from "lucide-react";
import { usePsps } from "@/lib/queries/psps";
import { Button } from "@/components/ui/button";

export function PspDirectoryTable() {
  const { data = [], isLoading, isError, error, refetch } = usePsps();
  return <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="font-semibold">PSP partners</h2><p className="mt-1 text-sm text-muted-foreground">Partner accounts and enabled settlement configuration.</p></div><Button variant="outline" size="sm" onClick={() => void refetch()}><RefreshCw className="mr-2 size-3.5" />Refresh</Button></div>
    {isError ? <div className="p-10 text-center"><p className="font-medium">Couldn’t load PSPs</p><p className="mt-1 text-sm text-muted-foreground">{error instanceof Error ? error.message : "The backend is unavailable."}</p></div> :
      <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr>{["Partner", "Status", "Currencies", "Bank accounts", "Callback", "Token expiry"].map((heading) => <th key={heading} className="px-5 py-3 font-medium">{heading}</th>)}</tr></thead><tbody className="divide-y divide-border">
        {isLoading ? <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">Loading partner accounts…</td></tr> : data.map((psp) => <tr key={psp.psp_code} className="hover:bg-muted/25"><td className="px-5 py-4"><span className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Building2 className="size-4" /></span><span><span className="block font-medium">{psp.psp_name}</span><span className="font-mono text-xs text-muted-foreground">{psp.psp_code}</span></span></span></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${psp.status === "active" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>{psp.status}</span></td><td className="px-5 py-4">{psp.allowed_currencies.join(", ")}</td><td className="px-5 py-4">{psp.bank_accounts.join(", ")}</td><td className="max-w-56 truncate px-5 py-4 text-muted-foreground" title={psp.callback_url}>{psp.callback_url}</td><td className="px-5 py-4 text-muted-foreground">{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(psp.api_token_expires_at))}</td></tr>)}
        {!isLoading && !isError && data.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">No PSP partners have been configured.</td></tr>}
      </tbody></table></div>}
    <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">{data.length} partner{data.length === 1 ? "" : "s"}</div>
  </section>;
}
