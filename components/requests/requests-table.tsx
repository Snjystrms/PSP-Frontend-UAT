"use client";

import { useMemo, useState } from "react";
import { useAuthUser } from "@/components/auth/auth-user-context";
import { ArrowDownToLine, ArrowUpFromLine, Check, Clock3, RotateCcw, Search, X } from "lucide-react";
import { useMarkRequestProcessing, useResendRequestCallback, useReverseRequest, useUpdateRequest } from "@/lib/queries/requests";
import type { PaymentRequest, RequestKind, RequestStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRequestDetail, useRequestPage } from "@/lib/queries/requests";
import { usePsps } from "@/lib/queries/psps";

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
  reversed: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
};

export function RequestsTable({ kind }: { kind: RequestKind }) {
  const [filter, setFilter] = useState<"all" | RequestStatus>("all");
  const [search, setSearch] = useState("");
  const [pspCode, setPspCode] = useState("");
  const [currency, setCurrency] = useState("");
  const [callbackFailed, setCallbackFailed] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [offset, setOffset] = useState(0);
  const pageQuery = useRequestPage(kind, { limit: 50, offset, ...(filter === "all" ? {} : { status: filter }), ...(pspCode ? { psp_code: pspCode } : {}), ...(currency ? { currency } : {}), ...(search ? { customer: search } : {}), ...(callbackFailed ? { callback_failed: true } : {}), ...(dateFrom ? { date_from: dateFrom } : {}), ...(dateTo ? { date_to: dateTo } : {}) });
  const { data: page, isLoading, isError, error, refetch } = pageQuery;
  const data = page?.items ?? [];
  const user = useAuthUser();
  const pspQuery = usePsps(user?.role === "admin");
  const mutation = useUpdateRequest();
  const reverseMutation = useReverseRequest();
  const retryMutation = useResendRequestCallback();
  const processingMutation = useMarkRequestProcessing();
  const [decision, setDecision] = useState<{ row: PaymentRequest; status: "approved" | "rejected" | "reversed" } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailQuery = useRequestDetail(detailId, kind);
  const [reason, setReason] = useState("");
  const rows = useMemo(() => data.filter((row) => (filter === "all" || row.status === filter) && `${row.id} ${row.clientName} ${row.clientId} ${row.reference} ${row.pspCode ?? ""}`.toLowerCase().includes(search.toLowerCase())), [data, filter, search]);
  const Icon = kind === "deposit" ? ArrowDownToLine : ArrowUpFromLine;
  const startDecision = (row: PaymentRequest, status: "approved" | "rejected" | "reversed") => { setDecision({ row, status }); setReason(""); };
  const submitDecision = () => {
    if (!decision || ((decision.status === "rejected" || decision.status === "reversed") && !reason.trim())) return;
    if (decision.status === "reversed") {
      reverseMutation.mutate({ id: decision.row.id, kind, reason: reason.trim() }, { onSuccess: () => setDecision(null) });
      return;
    }
    mutation.mutate({ id: decision.row.id, kind, status: decision.status, reason: reason.trim() }, { onSuccess: () => setDecision(null) });
  };

  return <>
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-semibold">{kind === "deposit" ? "Deposit requests" : "Withdrawal requests"}</h2><p className="mt-1 text-sm text-muted-foreground">Live queue from the payment operations backend.</p></div>
        <div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search requests…" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">{["all", "pending", "processing", "approved", "rejected", "reversed"].map((item) => <button key={item} onClick={() => { setFilter(item as "all" | RequestStatus); setOffset(0); }} className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${filter === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{item}</button>)}<label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={callbackFailed} onChange={(event) => { setCallbackFailed(event.target.checked); setOffset(0); }} />Callback failed</label></div>
      <div className="grid gap-2 border-b border-border p-4 sm:grid-cols-2 lg:grid-cols-5">{user?.role === "admin" && <select aria-label="Filter by PSP" value={pspCode} onChange={(event) => { setPspCode(event.target.value); setOffset(0); }} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="">All partners</option>{pspQuery.data?.map((psp) => <option key={psp.psp_code} value={psp.psp_code}>{psp.psp_name}</option>)}</select>}<select aria-label="Filter by currency" value={currency} onChange={(event) => { setCurrency(event.target.value); setOffset(0); }} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="">All currencies</option>{["INR", "USD", "EUR"].map((item) => <option key={item} value={item}>{item}</option>)}</select><label className="flex items-center gap-2 text-xs text-muted-foreground">From<Input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setOffset(0); }} className="h-9" /></label><label className="flex items-center gap-2 text-xs text-muted-foreground">To<Input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setOffset(0); }} className="h-9" /></label><Button variant="outline" size="sm" onClick={() => { setFilter("all"); setSearch(""); setPspCode(""); setCurrency(""); setCallbackFailed(false); setDateFrom(""); setDateTo(""); setOffset(0); }}>Clear filters</Button></div>
      {isError ? <div className="p-10 text-center"><p className="font-medium">Couldn’t load requests</p><p className="mt-1 text-sm text-muted-foreground">{error instanceof Error ? error.message : "The backend is unavailable."}</p><Button variant="outline" size="sm" className="mt-4" onClick={() => void refetch()}>Try again</Button></div> :
      <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left text-sm"><thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Request</th><th className="px-5 py-3 font-medium">Customer</th><th className="px-5 py-3 font-medium">Amount</th><th className="px-5 py-3 font-medium">{kind === "withdrawal" ? "Destination" : "Deposit account"}</th><th className="px-5 py-3 font-medium">PSP</th><th className="px-5 py-3 font-medium">Submitted</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Action</th></tr></thead><tbody className="divide-y divide-border">
        {isLoading ? <tr><td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">Loading requests…</td></tr> : rows.map((row) => <tr key={row.id} className="transition-colors hover:bg-muted/25">
          <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></span><span><span className="block font-medium">{row.id}</span><span className="text-xs text-muted-foreground">{row.reference}</span></span></div></td>
          <td className="px-5 py-4"><span className="block font-medium">{row.clientName}</span><span className="text-xs text-muted-foreground">{row.clientId}</span></td>
          <td className="px-5 py-4 font-semibold">{money(row.amount, row.currency)}</td>
          <td className="px-5 py-4"><span className="block text-muted-foreground">{row.bankName || row.bankAccountId || "—"}</span><span className="text-xs text-muted-foreground">{row.accountNumber || row.accountName || row.bankCode || ""}</span></td>
          <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{row.pspCode || "—"}</td>
          <td className="px-5 py-4 text-muted-foreground">{date(row.createdAt)}</td>
          <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyle[row.status]}`}>{row.status === "pending" || row.status === "processing" ? <Clock3 className="size-3" /> : row.status === "approved" ? <Check className="size-3" /> : row.status === "reversed" ? <RotateCcw className="size-3" /> : <X className="size-3" />}{row.status}</span></td>
          <td className="px-5 py-4"><div className="flex items-center gap-1"><Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setDetailId(row.id)}>Details</Button>{row.status === "pending" ? <Button size="sm" className="h-8" disabled={processingMutation.isPending} onClick={() => processingMutation.mutate({ id: row.id, kind })}>Start review</Button> : row.status === "processing" ? <div className="flex items-center gap-2"><Button size="sm" className="h-8" disabled={mutation.isPending || reverseMutation.isPending} onClick={() => startDecision(row, "approved")}>Approve</Button><Button variant="outline" size="sm" className="h-8" disabled={mutation.isPending || reverseMutation.isPending} onClick={() => startDecision(row, "rejected")}>Reject</Button></div> : row.status === "approved" ? <div className="flex items-center gap-1"><Button variant="outline" size="sm" className="h-8" disabled={reverseMutation.isPending} onClick={() => startDecision(row, "reversed")}>Reverse</Button>{row.callbackFailed && <Button variant="outline" size="sm" className="h-8" disabled={retryMutation.isPending} onClick={() => retryMutation.mutate({ id: row.id, kind })}>Retry callback</Button>}</div> : row.callbackFailed ? <Button variant="outline" size="sm" className="h-8" disabled={retryMutation.isPending} onClick={() => retryMutation.mutate({ id: row.id, kind })}>Retry callback</Button> : <span className="text-xs text-muted-foreground">—</span>}</div></td>
        </tr>)}
        {!isLoading && !isError && rows.length === 0 && <tr><td colSpan={8} className="px-5 py-14 text-center"><p className="font-medium">No matching requests</p><p className="mt-1 text-sm text-muted-foreground">Try another search or status filter.</p></td></tr>}
      </tbody></table></div>}
      <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground"><span>Showing {page?.total ? Math.min(offset + 1, page.total) : 0}–{Math.min(offset + rows.length, page?.total ?? 0)} of {page?.total ?? 0}</span><span className="flex gap-2"><Button variant="outline" size="xs" disabled={offset === 0 || isLoading} onClick={() => setOffset(Math.max(0, offset - 50))}>Previous</Button><Button variant="outline" size="xs" disabled={!page || offset + page.limit >= page.total || isLoading} onClick={() => setOffset(offset + 50)}>Next</Button></span></div>
    </section>
    <Dialog open={Boolean(decision)} onOpenChange={(open) => { if (!open && !mutation.isPending && !reverseMutation.isPending) setDecision(null); }}>
      <DialogContent><DialogHeader><DialogTitle>{decision?.status === "approved" ? "Approve request" : decision?.status === "reversed" ? "Reverse approved request" : "Reject request"}</DialogTitle><DialogDescription>{decision?.row.id} · {decision?.row.clientName} · {decision ? money(decision.row.amount, decision.row.currency) : ""}{decision?.status === "reversed" && <span className="mt-2 block text-rose-600 dark:text-rose-400">Reversal is final and can only happen once.</span>}</DialogDescription></DialogHeader>
        <label className="grid gap-2 text-sm font-medium">{decision?.status === "approved" ? "Review comment (optional)" : "Reason (required)"}<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} maxLength={2000} placeholder={decision?.status === "approved" ? "Add a note for the audit trail…" : decision?.status === "reversed" ? "Explain why this approved request is being reversed…" : "Explain why this request is being rejected…"} className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
        <DialogFooter><Button variant="outline" onClick={() => setDecision(null)} disabled={mutation.isPending || reverseMutation.isPending}>Cancel</Button><Button onClick={submitDecision} disabled={mutation.isPending || reverseMutation.isPending || ((decision?.status === "rejected" || decision?.status === "reversed") && !reason.trim())}>{mutation.isPending || reverseMutation.isPending ? "Submitting…" : decision?.status === "approved" ? "Confirm approval" : decision?.status === "reversed" ? "Confirm reversal" : "Confirm rejection"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={Boolean(detailId)} onOpenChange={(open) => { if (!open) setDetailId(null); }}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Request details</DialogTitle><DialogDescription>{detailQuery.data?.id ?? detailId}</DialogDescription></DialogHeader>{detailQuery.isLoading ? <p className="py-6 text-center text-sm text-muted-foreground">Loading request details…</p> : detailQuery.isError ? <p role="alert" className="text-sm text-destructive">{detailQuery.error instanceof Error ? detailQuery.error.message : "Could not load details."}</p> : detailQuery.data && <div className="grid gap-3 sm:grid-cols-2">{[["Customer", detailQuery.data.clientName], ["Email", detailQuery.data.clientId], ["Amount", money(detailQuery.data.amount, detailQuery.data.currency)], ["Status", detailQuery.data.status], ["Reference", detailQuery.data.reference], ["PSP", detailQuery.data.pspCode ?? "—"], ["Submitted", date(detailQuery.data.createdAt)], ["Reviewed by", detailQuery.data.reviewedBy ?? "—"], ["Reviewed at", detailQuery.data.reviewedAt ? date(detailQuery.data.reviewedAt) : "—"], ["Review comment", detailQuery.data.comment ?? "—"], ["Callback attempts", String(detailQuery.data.callbackAttempts)], ["Callback status", detailQuery.data.callbackSentAt ? `Sent ${date(detailQuery.data.callbackSentAt)}` : detailQuery.data.callbackFailed ? "Failed" : "Not sent"]].map(([label, value]) => <div key={label} className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-medium">{value}</p></div>)}{detailQuery.data.callbackLastError && <p className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-700 dark:text-rose-300 sm:col-span-2">Callback error: {detailQuery.data.callbackLastError}</p>}{detailQuery.data.screenshotUrl && <a className="text-sm text-primary underline sm:col-span-2" href={detailQuery.data.screenshotUrl} target="_blank" rel="noreferrer">Open deposit proof</a>}{detailQuery.data.utrNumber && <p className="text-sm sm:col-span-2">UTR: {detailQuery.data.utrNumber}</p>}</div>}<DialogFooter><Button variant="outline" onClick={() => setDetailId(null)}>Close</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
