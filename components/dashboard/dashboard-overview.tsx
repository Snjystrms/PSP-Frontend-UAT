"use client";

import { BadgeCheck, Clock3, MoreHorizontal, TrendingUp, Wallet } from "lucide-react";
import { CartesianGrid, Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useAuthUser } from "@/components/auth/auth-user-context";
import ProgressMetricCard, { type SeriesPoint } from "@/components/ui/progress-metric-card";
import { useRequests } from "@/lib/queries/requests";
import type { PaymentRequest } from "@/lib/types";

const currency = (value: number, code: string) => {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(value); }
  catch { return `${value.toLocaleString()} ${code}`; }
};
const makeDailySeries = (rows: PaymentRequest[], kind: PaymentRequest["kind"]): SeriesPoint[] => {
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    return date;
  });
  return days.map((day) => {
    const key = day.toLocaleDateString("en-CA");
    return { date: day.toLocaleDateString("en", { month: "short", day: "numeric" }), value: rows.filter((row) => row.kind === kind && new Date(row.createdAt).toLocaleDateString("en-CA") === key).length };
  });
};
const summaryCards = [
  { title: "Pending requests", key: "pending", icon: Clock3, color: "text-amber-700 bg-amber-500/10", trend: "Needs review" },
  { title: "Approval rate", key: "approval", icon: BadgeCheck, color: "text-emerald-700 bg-emerald-500/10", trend: "approved share" },
];

export function DashboardOverview() {
  const user = useAuthUser();
  const { data = [], isLoading, isError, error } = useRequests();
  const deposits = data.filter((row) => row.kind === "deposit");
  const withdrawals = data.filter((row) => row.kind === "withdrawal");
  const pending = data.filter((row) => row.status === "pending");
  const decided = data.filter((row) => row.status === "approved" || row.status === "rejected" || row.status === "reversed");
  const values: Record<string, string | number> = {
    deposit: deposits.length,
    withdrawal: withdrawals.length,
    pending: pending.length,
    approval: `${decided.length ? Math.round((decided.filter((row) => row.status === "approved").length / decided.length) * 100) : 0}%`,
  };
  const recent = [...data].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0,5);
  const processing = data.filter((row) => row.status === "processing");
  const approved = data.filter((row) => row.status === "approved");
  const rejected = data.filter((row) => row.status === "rejected");
  const reversed = data.filter((row) => row.status === "reversed");
  const pendingStop = data.length ? pending.length / data.length * 100 : 0;
  const processingStop = data.length ? (pending.length + processing.length) / data.length * 100 : 0;
  const approvedStop = data.length ? (pending.length + processing.length + approved.length) / data.length * 100 : 0;
  const rejectedStop = data.length ? (pending.length + processing.length + approved.length + rejected.length) / data.length * 100 : 0;
  const depositSeries = makeDailySeries(data, "deposit");
  const withdrawalSeries = makeDailySeries(data, "withdrawal");
  const activitySeries = depositSeries.map((point, index) => ({ date: point.date, deposits: point.value, withdrawals: withdrawalSeries[index]?.value ?? 0 }));
  return <div className="mx-auto max-w-[1440px] space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">Payment operations · Daily overview</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Welcome, {user?.name.split(" ")[0] ?? "there"} <span aria-hidden>✦</span></h1><p className="mt-2 text-sm text-muted-foreground">Live request activity from the payment operations backend.</p></div><div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground"><span className={`size-2 rounded-full ${isError ? "bg-rose-500" : isLoading ? "bg-amber-500" : "bg-emerald-500"}`} />{isError ? "Backend unavailable" : isLoading ? "Connecting to backend" : "Backend connected"}</div></div>
    {isError && <div role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error instanceof Error ? error.message : "Could not load backend data."}</div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
      <ProgressMetricCard title="Deposit requests" total={String(values.deposit)} deltaLabel="daily activity" percent={`${deposits.length} total`} unit="requests" data={depositSeries} dateFormatter={(date) => date} size="sm" className="ib-portal-metric xl:col-span-2" loading={isLoading} />
      <ProgressMetricCard title="Withdrawal requests" total={String(values.withdrawal)} deltaLabel="daily activity" percent={`${withdrawals.length} total`} unit="requests" data={withdrawalSeries} dateFormatter={(date) => date} size="sm" className="ib-portal-metric xl:col-span-2" loading={isLoading} />
      {summaryCards.map(({ title, key, icon: Icon, color, trend }) => <article key={key} className="ib-portal-metric flex min-h-[260px] flex-col justify-between rounded-[28px] bg-card p-5"><div className="flex items-start justify-between"><span className={`grid size-10 place-items-center rounded-xl ${color}`}><Icon className="size-5" /></span><button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted" aria-label={`${title} menu`}><MoreHorizontal className="size-4" /></button></div><div><p className="text-sm text-muted-foreground">{title}</p><p className="mt-1 text-3xl font-semibold tracking-tight">{isLoading ? "—" : values[key]}</p><p className="mt-3 flex items-center gap-1.5 text-xs"><span className={`inline-flex items-center gap-1 font-medium ${key === "pending" ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}`}><TrendingUp className="size-3.5" />{trend}</span><span className="text-muted-foreground">from live requests</span></p></div></article>)}
    </div>
    <div className="grid gap-5 xl:grid-cols-[1.65fr_0.85fr]">
      <section className="ib-portal-metric rounded-2xl bg-card p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><Wallet className="size-4" /></span><h2 className="font-semibold">Request activity</h2></div><p className="mt-2 text-sm text-muted-foreground">Daily deposits and withdrawals across the last 14 days</p></div><div className="flex items-center gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-primary" />Deposits</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#398895]" />Withdrawals</span></div></div><div className="mt-3 h-[250px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={activitySeries} margin={{ top: 12, right: 4, left: -22, bottom: 0 }}><defs><linearGradient id="depositFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.24} /><stop offset="95%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient><linearGradient id="withdrawalFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#398895" stopOpacity={0.19} /><stop offset="95%" stopColor="#398895" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 5" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} dy={10} /><Tooltip contentStyle={{ borderRadius: 12, borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)" }} /><Area type="monotone" dataKey="deposits" stroke="var(--primary)" strokeWidth={2.5} activeDot={{ r: 4, strokeWidth: 0 }} fill="url(#depositFill)" /><Area type="monotone" dataKey="withdrawals" stroke="#398895" strokeWidth={2.5} activeDot={{ r: 4, strokeWidth: 0 }} fill="url(#withdrawalFill)" /></AreaChart></ResponsiveContainer></div></section>
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Requests overview</h2><p className="mt-1 text-sm text-muted-foreground">Current queue status</p></div><a href="/deposits" className="text-sm font-medium text-primary">View deposits</a></div><div className="mt-7 flex items-center gap-5"><div className="relative grid size-32 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#f59e0b 0 ${pendingStop}%, #0ea5e9 ${pendingStop}% ${processingStop}%, #10b981 ${processingStop}% ${approvedStop}%, #f43f5e ${approvedStop}% ${rejectedStop}%, #8b5cf6 ${rejectedStop}% 100%)` }}><div className="grid size-24 place-items-center rounded-full bg-card text-center"><span><strong className="block text-2xl">{data.length}</strong><span className="text-[10px] text-muted-foreground">Loaded requests</span></span></div></div><div className="space-y-3 text-sm"><p className="flex items-center gap-2"><span className="size-2 rounded-full bg-amber-500" />Pending <strong className="ml-auto">{pending.length}</strong></p><p className="flex items-center gap-2"><span className="size-2 rounded-full bg-sky-500" />Processing <strong className="ml-auto">{processing.length}</strong></p><p className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500" />Approved <strong className="ml-auto">{approved.length}</strong></p><p className="flex items-center gap-2"><span className="size-2 rounded-full bg-rose-500" />Rejected <strong className="ml-auto">{rejected.length}</strong></p><p className="flex items-center gap-2"><span className="size-2 rounded-full bg-violet-500" />Reversed <strong className="ml-auto">{reversed.length}</strong></p></div></div><div className="mt-7 rounded-xl bg-muted/50 p-4"><p className="text-xs font-medium">Currently processing</p><p className="mt-1 text-xl font-semibold">{processing.length} <span className="text-sm font-normal text-muted-foreground">requests</span></p><p className="mt-1 text-xs text-muted-foreground">Live from the review queue</p></div></section>
    </div>
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="font-semibold">Recent transactions</h2><p className="mt-1 text-sm text-muted-foreground">Latest activity from across your payment requests</p></div><a href="/deposits" className="text-sm font-medium text-primary">See all</a></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr>{["Transaction", "Client", "Date", "Amount", "Status"].map((label) => <th key={label} className="px-5 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-border">{recent.map((row) => <tr key={row.id}><td className="px-5 py-4 font-medium">{row.id}<span className="ml-2 text-xs font-normal capitalize text-muted-foreground">{row.kind}</span></td><td className="px-5 py-4">{row.clientName}</td><td className="px-5 py-4 text-muted-foreground">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(row.createdAt))}</td><td className="px-5 py-4 font-semibold">{currency(row.amount, row.currency)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${row.status === "pending" ? "bg-amber-500/10 text-amber-700" : row.status === "processing" ? "bg-sky-500/10 text-sky-700" : row.status === "approved" ? "bg-emerald-500/10 text-emerald-700" : row.status === "reversed" ? "bg-violet-500/10 text-violet-700" : "bg-rose-500/10 text-rose-700"}`}>{row.status}</span></td></tr>)}</tbody></table></div></section>
  </div>;
}
