"use client";

import { useState } from "react";
import { Activity, AlertTriangle, Clipboard, Database, KeyRound, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SerialNumberCell } from "@/components/ui/serial-number-cell";
import { TablePagination } from "@/components/ui/table-pagination";
import { useAuditLogs, useErrorCodes, usePortalPublicKey, useSystemHealth } from "@/lib/queries/admin";

export function AuditSystemPanel() {
  const [actionFilter, setActionFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [auditOffset, setAuditOffset] = useState(0);
  const [auditPageSize, setAuditPageSize] = useState(25);
  const health = useSystemHealth();
  const audit = useAuditLogs({ action: actionFilter || undefined, target: targetFilter || undefined, offset: auditOffset, limit: auditPageSize });
  const errors = useErrorCodes();
  const publicKey = usePortalPublicKey();
  const ready = health.data?.ready;
  const copyKey = () => {
    if (!publicKey.data) return;
    void navigator.clipboard.writeText(publicKey.data).then(() => toast.success("Portal public key copied.")).catch(() => toast.error("Clipboard access is unavailable."));
  };

  return <div className="space-y-6">
    <section className="grid gap-4 md:grid-cols-3">
      <article className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-2 text-sm font-medium"><Activity className="size-4 text-primary" /> API service</div><p className="mt-4 text-2xl font-semibold">{health.isLoading ? "Checking…" : health.isError ? "Unavailable" : health.data?.live.status}</p><p className="mt-1 text-xs text-muted-foreground">Environment: {ready?.environment ?? "—"}</p></article>
      <article className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-2 text-sm font-medium"><Database className="size-4 text-primary" /> Database</div><p className="mt-4 text-2xl font-semibold">{health.isLoading ? "Checking…" : ready?.database ?? "Unavailable"}</p><p className="mt-1 text-xs text-muted-foreground">Readiness endpoint and database connectivity</p></article>
      <article className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-2 text-sm font-medium"><AlertTriangle className={`size-4 ${ready?.callbacks_failed ? "text-rose-500" : "text-primary"}`} /> Callback queue</div><p className="mt-4 text-2xl font-semibold">{ready ? `${ready.callbacks_pending} pending · ${ready.callbacks_failed} failed` : "—"}</p><p className="mt-1 text-xs text-muted-foreground">Last check {ready ? new Date(ready.checked_at).toLocaleTimeString() : "unavailable"}</p></article>
    </section>
    {health.isError && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-700 dark:text-rose-300">{health.error instanceof Error ? health.error.message : "Could not reach service health endpoint."}</div>}

    <section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Audit trail</h2><p className="mt-1 text-sm text-muted-foreground">Recent security and payment operations activity from the backend.</p></div><div className="flex gap-2"><Input aria-label="Filter audit action prefix" placeholder="Action prefix" value={actionFilter} onChange={(event) => { setActionFilter(event.target.value); setAuditOffset(0); }} className="w-36" /><Input aria-label="Filter audit target" placeholder="Target" value={targetFilter} onChange={(event) => { setTargetFilter(event.target.value); setAuditOffset(0); }} className="w-36" /><Button size="icon" variant="outline" aria-label="Refresh audit trail" onClick={() => void audit.refetch()}><RefreshCw className="size-4" /></Button></div></div>{audit.isError ? <p className="p-6 text-sm text-destructive">{audit.error instanceof Error ? audit.error.message : "Could not load audit trail."}</p> : <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground"><tr>{["#", "Time", "Actor", "Action", "Target", "IP", "Details"].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-border">{audit.isLoading ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading audit trail…</td></tr> : audit.data?.items.map((row, index) => <tr key={row.id} className="align-top hover:bg-muted/20"><td className="px-4 py-3"><SerialNumberCell serialNumber={auditOffset + index + 1} /></td><td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</td><td className="px-4 py-3"><span className="block capitalize">{row.actor_type}</span><span className="font-mono text-xs text-muted-foreground">{row.actor_id}</span></td><td className="px-4 py-3 font-medium">{row.action}</td><td className="px-4 py-3 font-mono text-xs">{row.target ?? "—"}</td><td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.ip_address ?? "—"}</td><td className="max-w-[380px] px-4 py-3"><pre className="whitespace-pre-wrap break-all text-xs text-muted-foreground">{row.details ? JSON.stringify(row.details, null, 2) : "—"}</pre></td></tr>)}</tbody></table></div>}{audit.data && <TablePagination pageIndex={Math.floor(auditOffset / auditPageSize)} pageSize={auditPageSize} currentCount={audit.data.items.length} hasNext={audit.data.items.length === auditPageSize} onPageChange={(pageIndex) => setAuditOffset(pageIndex * auditPageSize)} onPageSizeChange={(size) => { setAuditPageSize(size); setAuditOffset(0); }} />}</section>

    <section className="grid gap-6 lg:grid-cols-2">
      <article className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold">Callback verification key</h2><p className="mt-1 text-sm text-muted-foreground">Public RSA key used to verify signed backend callbacks.</p></div><Button size="icon" variant="outline" aria-label="Copy portal public key" disabled={!publicKey.data} onClick={copyKey}><Clipboard className="size-4" /></Button></div>{publicKey.isLoading ? <p className="mt-4 text-sm text-muted-foreground">Loading public key…</p> : publicKey.isError ? <p className="mt-4 text-sm text-destructive">{publicKey.error instanceof Error ? publicKey.error.message : "Could not load key."}</p> : <pre className="mt-4 max-h-48 overflow-auto rounded-xl border border-border bg-muted/40 p-3 text-[11px] leading-5">{publicKey.data}</pre>}</article>
      <article className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-2"><KeyRound className="size-4 text-primary" /><div><h2 className="font-semibold">API error catalog</h2><p className="mt-1 text-sm text-muted-foreground">Backend error codes and HTTP statuses.</p></div></div>{errors.isLoading ? <p className="mt-4 text-sm text-muted-foreground">Loading error catalog…</p> : errors.isError ? <p className="mt-4 text-sm text-destructive">{errors.error instanceof Error ? errors.error.message : "Could not load error catalog."}</p> : <div className="mt-4 max-h-52 space-y-2 overflow-y-auto">{errors.data?.error_codes.map((item) => <div key={item.error_code} className="grid grid-cols-[62px_52px_1fr] gap-2 text-xs"><code className="font-semibold text-primary">{item.error_code}</code><span className="text-muted-foreground">HTTP {item.http_status}</span><span><span className="font-medium">{item.name}</span><span className="block text-muted-foreground">{item.message}</span></span></div>)}</div>}</article>
    </section>
  </div>;
}
