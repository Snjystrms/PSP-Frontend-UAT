"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useAuthUser } from "@/components/auth/auth-user-context";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  Clock3,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import {
  useCreatePortalRequest,
  useMarkRequestProcessing,
  useResendRequestCallback,
  useReverseRequest,
  useUpdateRequest,
} from "@/lib/queries/requests";
import type { PaymentRequest, RequestKind, RequestStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { SerialNumberCell } from "@/components/ui/serial-number-cell";
import { TablePagination } from "@/components/ui/table-pagination";
import { RequestProofPreview } from "@/components/requests/request-proof-preview";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRequestDetail, useRequestPage } from "@/lib/queries/requests";
import { usePsps } from "@/lib/queries/psps";

const money = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
};
const date = (value: string) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
const statusStyle: Record<RequestStatus, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  processing: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  approved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  rejected: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  reversed: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
};

export function RequestsTable({ kind }: { kind: RequestKind }) {
  const [filter, setFilter] = useState<"all" | RequestStatus>("all");
  const [searchInput, setSearchInput] = useState("");
  const search = searchInput.trim().length >= 3 ? searchInput.trim() : "";
  const [pspCode, setPspCode] = useState("");
  const [currency, setCurrency] = useState("");
  const [callbackFailed, setCallbackFailed] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [offset, setOffset] = useState(0);
  const pageQuery = useRequestPage(kind, {
    limit: pageSize,
    offset,
    ...(filter === "all" ? {} : { status: filter }),
    ...(pspCode ? { psp_code: pspCode } : {}),
    ...(currency ? { currency } : {}),
    ...(search ? { customer: search } : {}),
    ...(callbackFailed ? { callback_failed: true } : {}),
    ...(dateFrom ? { date_from: dateFrom } : {}),
    ...(dateTo ? { date_to: dateTo } : {}),
  });
  const { data: page, isLoading, isError, refetch } = pageQuery;
  const data = page?.items ?? [];
  const user = useAuthUser();
  const pspQuery = usePsps(user?.role === "admin");
  const mutation = useUpdateRequest();
  const reverseMutation = useReverseRequest();
  const retryMutation = useResendRequestCallback();
  const processingMutation = useMarkRequestProcessing();
  const [decision, setDecision] = useState<{
    row: PaymentRequest;
    status: "approved" | "rejected" | "reversed";
  } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [createPspCode, setCreatePspCode] = useState("all");
  const createRequest = useCreatePortalRequest(kind);
  const detailQuery = useRequestDetail(detailId, kind);
  const [reason, setReason] = useState("");
  const rows = useMemo(
    () =>
      data.filter(
        (row) =>
          (filter === "all" || row.status === filter) &&
          `${row.id} ${row.clientName} ${row.clientId} ${row.reference} ${row.pspCode ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [data, filter, search],
  );
  const Icon = kind === "deposit" ? ArrowDownToLine : ArrowUpFromLine;
  const startDecision = (
    row: PaymentRequest,
    status: "approved" | "rejected" | "reversed",
  ) => {
    setDecision({ row, status });
    setReason("");
  };
  const submitDecision = () => {
    if (
      !decision ||
      ((decision.status === "rejected" || decision.status === "reversed") &&
        !reason.trim())
    )
      return;
    if (decision.status === "reversed") {
      reverseMutation.mutate(
        { id: decision.row.id, kind, reason: reason.trim() },
        { onSuccess: () => setDecision(null) },
      );
      return;
    }
    mutation.mutate(
      {
        id: decision.row.id,
        kind,
        status: decision.status,
        reason: reason.trim(),
      },
      { onSuccess: () => setDecision(null) },
    );
  };
  const submitNewRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (createPspCode === "all") return;
    const formData = new FormData(event.currentTarget);
    formData.set("psp_code", createPspCode);
    createRequest.mutate(formData, {
      onSuccess: () => {
        setCreateOpen(false);
        setScreenshotFile(null);
      },
    });
  };

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search requests (3+ characters)…"
                value={searchInput}
                onChange={(event) => {
                  const value = event.target.value;
                  const nextSearch = value.trim().length >= 3 ? value.trim() : "";
                  setSearchInput(value);
                  if (nextSearch || search) setOffset(0);
                }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              <RefreshCw className="mr-2 size-3.5" />
              Refresh
            </Button>
            {user?.role === "admin" && (
              <Button
                size="sm"
                className="shrink-0"
                onClick={() => {
                  setCreatePspCode("all");
                  setCreateOpen(true);
                }}
              >
                <Plus className="mr-2 size-4" />
                New {kind}
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          {[
            "all",
            "pending",
            "processing",
            "approved",
            "rejected",
            "reversed",
          ].map((item) => (
            <button
              key={item}
              onClick={() => {
                setFilter(item as "all" | RequestStatus);
                setOffset(0);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${filter === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              {item}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={callbackFailed}
              onChange={(event) => {
                setCallbackFailed(event.target.checked);
                setOffset(0);
              }}
            />
            Callback failed
          </label>
        </div>
        <div className="grid min-w-0 grid-cols-1 items-end gap-3 border-b border-border p-4 sm:grid-cols-2 xl:grid-cols-6">
          {user?.role === "admin" && (
            <div className="min-w-0 space-y-1.5">
              <span className="block text-xs font-medium text-muted-foreground">
                PSP
              </span>
              <Select
                value={pspCode || "all"}
                onValueChange={(value) => {
                  setPspCode(value === "all" ? "" : value);
                  setOffset(0);
                }}
              >
                <SelectTrigger
                  aria-label="Filter by PSP"
                  className="w-full bg-background"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All partners</SelectItem>
                  {pspQuery.data?.map((psp) => (
                    <SelectItem key={psp.psp_code} value={psp.psp_code}>
                      {psp.psp_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="min-w-0 space-y-1.5">
            <span className="block text-xs font-medium text-muted-foreground">
              Currency
            </span>
            <Select
              value={currency || "all"}
              onValueChange={(value) => {
                setCurrency(value === "all" ? "" : value);
                setOffset(0);
              }}
            >
              <SelectTrigger
                aria-label="Filter by currency"
                className="w-full bg-background"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All currencies</SelectItem>
                {["INR", "USD", "EUR"].map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 sm:col-span-2 xl:col-span-3">
            <DateRangePicker
              fromDate={dateFrom}
              toDate={dateTo}
              onFromDateChange={(value) => {
                setDateFrom(value);
                setOffset(0);
              }}
              onToDateChange={(value) => {
                setDateTo(value);
                setOffset(0);
              }}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:col-span-2 xl:col-span-1"
            onClick={() => {
              setFilter("all");
              setSearchInput("");
              setPspCode("");
              setCurrency("");
              setCallbackFailed(false);
              setDateFrom("");
              setDateTo("");
              setOffset(0);
            }}
          >
            Clear filters
          </Button>
        </div>
        {isError ? (
          <div className="p-10 text-center">
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => void refetch()}
            >
              Try again
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1020px] text-left text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="w-20 whitespace-nowrap px-4 py-3 font-medium">Sr. No.</th>
                  <th className="px-5 py-3 font-medium">Request</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">
                    {kind === "withdrawal" ? "Destination" : "Deposit account"}
                  </th>
                  <th className="px-5 py-3 font-medium">PSP</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <TableSkeletonRows columns={9} cellClassName="px-5 py-4" />
                ) : (
                  rows.map((row, index) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-muted/25"
                    >
                      <td className="px-4 py-4">
                        <SerialNumberCell serialNumber={offset + index + 1} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="size-4" />
                          </span>
                          <span>
                            <span className="block font-medium">{row.id}</span>
                            <span className="text-xs text-muted-foreground">
                              {row.reference}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="block font-medium">
                          {row.clientName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {row.clientId}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {money(row.amount, row.currency)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="block text-muted-foreground">
                          {row.bankName || row.bankAccountId || "—"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {row.accountNumber ||
                            row.accountName ||
                            row.bankCode ||
                            ""}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                        {row.pspCode || "—"}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {date(row.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyle[row.status]}`}
                        >
                          {row.status === "pending" ||
                          row.status === "processing" ? (
                            <Clock3 className="size-3" />
                          ) : row.status === "approved" ? (
                            <Check className="size-3" />
                          ) : row.status === "reversed" ? (
                            <RotateCcw className="size-3" />
                          ) : (
                            <X className="size-3" />
                          )}
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => setDetailId(row.id)}
                          >
                            Details
                          </Button>
                          {row.status === "pending" ? (
                            <Button
                              size="sm"
                              className="h-8"
                              disabled={processingMutation.isPending}
                              onClick={() =>
                                processingMutation.mutate({ id: row.id, kind })
                              }
                            >
                              Start review
                            </Button>
                          ) : row.status === "processing" ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="h-8"
                                disabled={
                                  mutation.isPending ||
                                  reverseMutation.isPending
                                }
                                onClick={() => startDecision(row, "approved")}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                disabled={
                                  mutation.isPending ||
                                  reverseMutation.isPending
                                }
                                onClick={() => startDecision(row, "rejected")}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : row.status === "approved" ? (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                disabled={reverseMutation.isPending}
                                onClick={() => startDecision(row, "reversed")}
                              >
                                Reverse
                              </Button>
                              {row.callbackFailed && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  disabled={retryMutation.isPending}
                                  onClick={() =>
                                    retryMutation.mutate({ id: row.id, kind })
                                  }
                                >
                                  Retry callback
                                </Button>
                              )}
                            </div>
                          ) : row.callbackFailed ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              disabled={retryMutation.isPending}
                              onClick={() =>
                                retryMutation.mutate({ id: row.id, kind })
                              }
                            >
                              Retry callback
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {!isLoading && !isError && rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-14 text-center">
                      <p className="font-medium">No matching requests</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Try another search or status filter.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <TablePagination
          total={page?.total ?? 0}
          pageIndex={Math.floor(offset / pageSize)}
          pageSize={pageSize}
          onPageChange={(pageIndex) => setOffset(pageIndex * pageSize)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setOffset(0);
          }}
        />
      </section>
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!createRequest.isPending) {
            setCreateOpen(open);
            if (!open) setScreenshotFile(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create {kind} request</DialogTitle>
            <DialogDescription>
              Submit a request on behalf of a PSP. It will appear in the review
              queue.
            </DialogDescription>
          </DialogHeader>
          <form
            id="create-payment-request"
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={submitNewRequest}
          >
            <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
              PSP partner
              <Select value={createPspCode} onValueChange={setCreatePspCode}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a PSP" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select a PSP</SelectItem>
                  {pspQuery.data?.map((psp) => (
                    <SelectItem key={psp.psp_code} value={psp.psp_code}>
                      {psp.psp_name} ({psp.psp_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Customer name
              <Input name="customer_name" placeholder="e.g. Rahul Sharma" required maxLength={200} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Customer email
              <Input name="customer_email" type="email" placeholder="customer@example.com" required />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Amount (₹)
              <Input
                name="amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
              />
            </label>
            {kind === "withdrawal" && (
              <label className="grid gap-1.5 text-sm font-medium">
                Currency
                <Select name="currency" defaultValue="INR">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["INR", "USD", "EUR"].map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            )}
            {kind === "deposit" ? (
              <>
                <div className="grid gap-2 text-sm font-medium sm:col-span-2">
                  <label className="grid gap-1.5">
                    Payment screenshot
                    <input
                      name="screenshot"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      required
                      onChange={(event) =>
                        setScreenshotFile(event.target.files?.[0] ?? null)
                      }
                      className="block w-full cursor-pointer rounded-lg border border-input bg-background px-3 py-2 text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
                    />
                  </label>
                  {screenshotFile && (
                    <RequestProofPreview file={screenshotFile} />
                  )}
                </div>
                <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
                  UTR number (optional)
                  <Input name="utr_number" placeholder="Enter the payment UTR" maxLength={100} />
                </label>
              </>
            ) : (
              <>
                <label className="grid gap-1.5 text-sm font-medium">
                  Destination bank
                  <Input name="dest_bank_name" placeholder="e.g. HDFC Bank" maxLength={200} />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  Account number
                  <Input
                    name="dest_account_number"
                    minLength={4}
                    maxLength={50}
                    placeholder="Enter account number"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  IFSC / SWIFT
                  <Input name="dest_ifsc" placeholder="IFSC or SWIFT code" />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  Account holder
                  <Input name="dest_account_name" placeholder="Name on the bank account" maxLength={200} />
                </label>
              </>
            )}
            <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
              Comment (optional)
              <textarea
                name="comment"
                maxLength={2000}
                rows={3}
                placeholder="Add any details about this request (optional)"
                className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </form>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={createRequest.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-payment-request"
              disabled={createRequest.isPending || createPspCode === "all"}
            >
              {createRequest.isPending ? "Submitting…" : `Create ${kind}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(decision)}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending && !reverseMutation.isPending)
            setDecision(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision?.status === "approved"
                ? "Approve request"
                : decision?.status === "reversed"
                  ? "Reverse approved request"
                  : "Reject request"}
            </DialogTitle>
            <DialogDescription>
              {decision?.row.id} · {decision?.row.clientName} ·{" "}
              {decision
                ? money(decision.row.amount, decision.row.currency)
                : ""}
              {decision?.status === "reversed" && (
                <span className="mt-2 block text-rose-600 dark:text-rose-400">
                  Reversal is final and can only happen once.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <label className="grid gap-2 text-sm font-medium">
            {decision?.status === "approved"
              ? "Review comment (optional)"
              : "Reason (required)"}
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              maxLength={2000}
              placeholder={
                decision?.status === "approved"
                  ? "Add a note for the audit trail…"
                  : decision?.status === "reversed"
                    ? "Explain why this approved request is being reversed…"
                    : "Explain why this request is being rejected…"
              }
              className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDecision(null)}
              disabled={mutation.isPending || reverseMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={submitDecision}
              disabled={
                mutation.isPending ||
                reverseMutation.isPending ||
                ((decision?.status === "rejected" ||
                  decision?.status === "reversed") &&
                  !reason.trim())
              }
            >
              {mutation.isPending || reverseMutation.isPending
                ? "Submitting…"
                : decision?.status === "approved"
                  ? "Confirm approval"
                  : decision?.status === "reversed"
                    ? "Confirm reversal"
                    : "Confirm rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(detailId)}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request details</DialogTitle>
            <DialogDescription>
              {detailQuery.data?.id ?? detailId}
            </DialogDescription>
          </DialogHeader>
          {detailQuery.isLoading ? (
            <div className="grid gap-3 py-2 sm:grid-cols-2" aria-busy="true">
              {Array.from({ length: 8 }, (_, index) => (
                <div
                  key={index}
                  className="space-y-2 rounded-lg border border-border p-3"
                >
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : detailQuery.isError ? (
            <div className="flex justify-end"><Button variant="outline" onClick={() => void detailQuery.refetch()}>Try again</Button></div>
          ) : (
            detailQuery.data && (
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Customer", detailQuery.data.clientName],
                  ["Email", detailQuery.data.clientId],
                  [
                    "Amount",
                    money(detailQuery.data.amount, detailQuery.data.currency),
                  ],
                  ["Status", detailQuery.data.status],
                  ["Reference", detailQuery.data.reference],
                  [
                    "Submitted by",
                    detailQuery.data.createdBy === "admin"
                      ? "Admin portal"
                      : detailQuery.data.createdBy === "crm"
                        ? "CRM"
                        : "—",
                  ],
                  ["PSP", detailQuery.data.pspCode ?? "—"],
                  ["Submitted", date(detailQuery.data.createdAt)],
                  ["Reviewed by", detailQuery.data.reviewedBy ?? "—"],
                  [
                    "Reviewed at",
                    detailQuery.data.reviewedAt
                      ? date(detailQuery.data.reviewedAt)
                      : "—",
                  ],
                  ["Review comment", detailQuery.data.comment ?? "—"],
                  [
                    "Callback attempts",
                    String(detailQuery.data.callbackAttempts),
                  ],
                  [
                    "Callback status",
                    detailQuery.data.callbackSentAt
                      ? `Sent ${date(detailQuery.data.callbackSentAt)}`
                      : detailQuery.data.callbackFailed
                        ? "Failed"
                        : "Not sent",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-border p-3"
                  >
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 break-words text-sm font-medium">
                      {value}
                    </p>
                  </div>
                ))}
                {detailQuery.data.callbackLastError && (
                  <p className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-700 dark:text-rose-300 sm:col-span-2">
                    Callback error: {detailQuery.data.callbackLastError}
                  </p>
                )}
                {detailQuery.data.screenshotUrl && (
                  <RequestProofPreview url={detailQuery.data.screenshotUrl} />
                )}
                {detailQuery.data.utrNumber && (
                  <p className="text-sm sm:col-span-2">
                    UTR: {detailQuery.data.utrNumber}
                  </p>
                )}
              </div>
            )
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
