"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowDownToLine, ArrowUpFromLine, Check, Clock3, MoreHorizontal, Search, X } from "lucide-react";
import { useMarkRequestProcessing, useRequests, useResendRequestCallback, useUpdateRequest } from "@/lib/queries/requests";
import type { PaymentRequest, RequestKind, RequestStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const money = (amount: number, currency: string) => {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount); }
  catch { return `${amount.toLocaleString()} ${currency}`; }
};
const date = (value: string) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const statusStyle: Record<RequestStatus, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  processing: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  approved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  rejected: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

export function RequestsTable({ kind }: { kind: RequestKind }) {
  const { data = [], isLoading, isError, error, refetch } = useRequests(kind);
  const mutation = useUpdateRequest();
  const retryMutation = useResendRequestCallback();
  const processingMutation = useMarkRequestProcessing();
  const { data: session } = useSession();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [decision, setDecision] = useState<{ row: PaymentRequest; status: "approved" | "rejected" } | null>(null);
  const [reason, setReason] = useState("");
  const rows = useMemo(() => data.filter((row) => (filter === "all" || row.status === filter) && `${row.id} ${row.clientName} ${row.clientId} ${row.reference} ${row.pspCode ?? ""}`.toLowerCase().includes(search.toLowerCase())), [data, filter, search]);
  const Icon = kind === "deposit" ? ArrowDownToLine : ArrowUpFromLine;
  const isPsp = session?.user.role === "psp";
  const startDecision = (row: PaymentRequest, status: "approved" | "rejected") => { setDecision({ row, status }); setReason(""); };
  const submitDecision = () => {
    if (!decision || (decision.status === "rejected" && !reason.trim())) return;
    mutation.mutate({ id: decision.row.id, kind, status: decision.status, reason: reason.trim() }, { onSuccess: () => setDecision(null) });
  };

  return <>
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-semibold">{kind === "deposit" ? "Deposit requests" : "Withdrawal requests"}</h2><p className="mt-1 text-sm text-muted-foreground">Live queue from the payment operations backend.</p></div>
        <div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search requests…" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-border px-5 py-3">{["all", "pending", "processing", "approved", "rejected"].map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${filter === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{item}{item === "pending" ? ` · ${data.filter((row) => row.status === "pending").length}` : ""}</button>)}</div>
      {isError ? <div className="p-10 text-center"><p className="font-medium">Couldn’t load requests</p><p className="mt-1 text-sm text-muted-foreground">{error instanceof Error ? error.message : "The backend is unavailable."}</p><Button variant="outline" size="sm" className="mt-4" onClick={() => void refetch()}>Try again</Button></div> :
      <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left text-sm"><thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Request</th><th className="px-5 py-3 font-medium">Customer</th><th className="px-5 py-3 font-medium">Amount</th><th className="px-5 py-3 font-medium">{kind === "withdrawal" ? "Destination" : "Deposit account"}</th><th className="px-5 py-3 font-medium">PSP</th><th className="px-5 py-3 font-medium">Submitted</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Action</th></tr></thead><tbody className="divide-y divide-border">
        {isLoading ? <tr><td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">Loading requests…</td></tr> : rows.map((row) => <tr key={row.id} className="transition-colors hover:bg-muted/25">
          <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></span><span><span className="block font-medium">{row.id}</span><span className="text-xs text-muted-foreground">{row.reference}</span></span></div></td>
          <td className="px-5 py-4"><span className="block font-medium">{row.clientName}</span><span className="text-xs text-muted-foreground">{row.clientId}</span></td>
          <td className="px-5 py-4 font-semibold">{money(row.amount, row.currency)}</td>
          <td className="px-5 py-4"><span className="block text-muted-foreground">{row.bankName || row.bankAccountId || "—"}</span><span className="text-xs text-muted-foreground">{row.accountNumber || row.accountName || row.bankCode || ""}</span></td>
          <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{row.pspCode || "—"}</td>
          <td className="px-5 py-4 text-muted-foreground">{date(row.createdAt)}</td>
          <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyle[row.status]}`}>{row.status === "pending" || row.status === "processing" ? <Clock3 className="size-3" /> : row.status === "approved" ? <Check className="size-3" /> : <X className="size-3" />}{row.status}</span></td>
          <td className="px-5 py-4">{isPsp && row.status === "pending" ? <Button size="sm" className="h-8" disabled={processingMutation.isPending} onClick={() => processingMutation.mutate({ id: row.id, kind })}>Start review</Button> : isPsp && row.status === "processing" ? <div className="flex items-center gap-2"><Button size="sm" className="h-8" disabled={mutation.isPending} onClick={() => startDecision(row, "approved")}>Approve</Button><Button variant="outline" size="sm" className="h-8" disabled={mutation.isPending} onClick={() => startDecision(row, "rejected")}>Reject</Button></div> : row.callbackFailed ? <Button variant="outline" size="sm" className="h-8" disabled={retryMutation.isPending} onClick={() => retryMutation.mutate({ id: row.id, kind })}>Retry callback</Button> : <span className="text-xs text-muted-foreground">{session?.user.role === "admin" ? "Read only" : "—"}</span>}</td>
        </tr>)}
        {!isLoading && !isError && rows.length === 0 && <tr><td colSpan={8} className="px-5 py-14 text-center"><p className="font-medium">No matching requests</p><p className="mt-1 text-sm text-muted-foreground">Try another search or status filter.</p></td></tr>}
      </tbody></table></div>}
      <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground"><span>Showing {rows.length} of {data.length} loaded requests</span><span>Refreshes when you revisit this queue</span></div>
    </section>
    <Dialog open={Boolean(decision)} onOpenChange={(open) => { if (!open && !mutation.isPending) setDecision(null); }}>
      <DialogContent><DialogHeader><DialogTitle>{decision?.status === "approved" ? "Approve request" : "Reject request"}</DialogTitle><DialogDescription>{decision?.row.id} · {decision?.row.clientName} · {decision ? money(decision.row.amount, decision.row.currency) : ""}</DialogDescription></DialogHeader>
        <label className="grid gap-2 text-sm font-medium">{decision?.status === "rejected" ? "Reason (required)" : "Review comment (optional)"}<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} maxLength={2000} placeholder={decision?.status === "rejected" ? "Explain why this request is being rejected…" : "Add a note for the audit trail…"} className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
        <DialogFooter><Button variant="outline" onClick={() => setDecision(null)} disabled={mutation.isPending}>Cancel</Button><Button onClick={submitDecision} disabled={mutation.isPending || (decision?.status === "rejected" && !reason.trim())}>{mutation.isPending ? "Submitting…" : decision?.status === "approved" ? "Confirm approval" : "Confirm rejection"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
