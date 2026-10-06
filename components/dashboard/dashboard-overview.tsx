"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgeCheck,
  Building2,
  CircleX,
  Clock3,
  LayoutDashboard,
  RotateCcw,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useId } from "react";
import {
  CartesianGrid,
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { useAuthUser } from "@/components/auth/auth-user-context";
import ProgressMetricCard, {
  type SeriesPoint,
} from "@/components/ui/progress-metric-card";
import { usePortalDashboard } from "@/lib/queries/dashboard";
import { Button } from "@/components/ui/button";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";

const currency = (value: number, code: string) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${code}`;
  }
};
const formatDayLabel = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(`${value}T00:00:00Z`),
  );
const summaryCards = [
  {
    title: "Pending requests",
    key: "pending",
    icon: Clock3,
    color: "text-amber-700 bg-amber-500/10",
    trend: "Needs review",
  },
  {
    title: "Pending deposits",
    key: "pending_deposits",
    icon: ArrowDownToLine,
    color: "text-amber-700 bg-amber-500/10",
    trend: "Needs review",
  },
  {
    title: "Pending withdrawals",
    key: "pending_withdrawals",
    icon: ArrowUpFromLine,
    color: "text-amber-700 bg-amber-500/10",
    trend: "Needs review",
  },
  {
    title: "Approved deposits",
    key: "approved_deposits",
    icon: BadgeCheck,
    color: "text-emerald-700 bg-emerald-500/10",
    trend: "Cleared by review",
  },
  {
    title: "Approved withdrawals",
    key: "approved_withdrawals",
    icon: BadgeCheck,
    color: "text-emerald-700 bg-emerald-500/10",
    trend: "Cleared by review",
  },
  {
    title: "Rejected deposits",
    key: "rejected_deposits",
    icon: CircleX,
    color: "text-rose-700 bg-rose-500/10",
    trend: "Declined by review",
  },
  {
    title: "Rejected withdrawals",
    key: "rejected_withdrawals",
    icon: CircleX,
    color: "text-rose-700 bg-rose-500/10",
    trend: "Declined by review",
  },
  {
    title: "Reversed deposits",
    key: "reversed_deposits",
    icon: RotateCcw,
    color: "text-violet-700 bg-violet-500/10",
    trend: "Returned for review",
  },
  {
    title: "Reversed withdrawals",
    key: "reversed_withdrawals",
    icon: RotateCcw,
    color: "text-violet-700 bg-violet-500/10",
    trend: "Returned for review",
  },
  {
    title: "PSP partners",
    key: "total_psp_count",
    icon: Building2,
    color: "text-sky-700 bg-sky-500/10",
    trend: "Available in this portal",
  },
];

function DashboardKpiCard({
  title,
  value,
  color,
  icon: Icon,
  trend,
  loading,
}: {
  title: string;
  value: string | number;
  color: string;
  icon: typeof Clock3;
  trend: string;
  loading: boolean;
}) {
  const patternId = `dashboard-dots-${useId().replace(/:/g, "")}`;

  return (
    <article className="ib-portal-metric relative isolate flex min-h-[170px] flex-col justify-between overflow-hidden rounded-[28px] p-4">
      <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[62%]">
        <div className="absolute inset-0 bg-gradient-to-l from-primary/10 to-transparent" />
        <div
          className="absolute inset-0 text-foreground/[0.13]"
          style={{
            WebkitMaskImage: "linear-gradient(to right, transparent, black 55%)",
            maskImage: "linear-gradient(to right, transparent, black 55%)",
          }}
        >
          <svg className="h-full w-full" aria-hidden>
            <defs>
              <pattern id={patternId} width="14" height="14" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
          </svg>
        </div>
      </div>
      <span className={`grid size-10 place-items-center rounded-xl ${color}`}>
        <Icon className="size-5 text-foreground" />
      </span>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">
          {loading ? "—" : value}
        </p>
        <p className="mt-3 flex items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
            <TrendingUp className="size-3.5" />
            {trend}
          </span>
          <span className="text-muted-foreground">from live data</span>
        </p>
      </div>
    </article>
  );
}

export function DashboardOverview() {
  const user = useAuthUser();
  const { data: dashboard, isLoading, isError, refetch } = usePortalDashboard();
  const overview = dashboard?.requests_overview;
  const totalRequests = overview?.total ?? 0;
  const pending = overview?.pending ?? 0;
  const processing = overview?.processing ?? 0;
  const approved = overview?.approved ?? 0;
  const rejected = overview?.rejected ?? 0;
  const reversed = overview?.reversed ?? 0;
  const values: Record<string, number> = {
    deposit: dashboard?.deposits.total ?? 0,
    withdrawal: dashboard?.withdrawals.total ?? 0,
    pending: dashboard?.pending_requests ?? 0,
    pending_deposits: dashboard?.pending_deposits ?? 0,
    pending_withdrawals: dashboard?.pending_withdrawals ?? 0,
    approved_deposits: dashboard?.approved_deposits ?? 0,
    approved_withdrawals: dashboard?.approved_withdrawals ?? 0,
    rejected_deposits: dashboard?.rejected_deposits ?? 0,
    rejected_withdrawals: dashboard?.rejected_withdrawals ?? 0,
    reversed_deposits: dashboard?.reversed_deposits ?? 0,
    reversed_withdrawals: dashboard?.reversed_withdrawals ?? 0,
    total_psp_count: dashboard?.total_psp_count ?? 0,
  };
  const recent = dashboard?.recent_transactions ?? [];
  const pendingStop = totalRequests ? (pending / totalRequests) * 100 : 0;
  const processingStop = totalRequests
    ? ((pending + processing) / totalRequests) * 100
    : 0;
  const approvedStop = totalRequests
    ? ((pending + processing + approved) / totalRequests) * 100
    : 0;
  const rejectedStop = totalRequests
    ? ((pending + processing + approved + rejected) / totalRequests) * 100
    : 0;
  const depositSeries: SeriesPoint[] = (dashboard?.deposits.series ?? []).map(
    (point) => ({ date: formatDayLabel(point.date), value: point.count }),
  );
  const withdrawalSeries: SeriesPoint[] = (
    dashboard?.withdrawals.series ?? []
  ).map((point) => ({ date: formatDayLabel(point.date), value: point.count }));
  const activitySeries = (dashboard?.activity ?? []).map((point) => ({
    date: formatDayLabel(point.date),
    deposits: point.deposits,
    withdrawals: point.withdrawals,
  }));
  return (
    <div className="dashboard-overview mx-auto max-w-[1440px] space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mt-1 flex items-center gap-3 text-3xl font-semibold tracking-tight">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <LayoutDashboard className="size-5" />
            </span>
            Welcome, {(dashboard?.full_name ?? user?.name)?.split(" ")[0] ?? "there"}{" "}
            <span aria-hidden>✦</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Live request activity from the payment operations server.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCw className="mr-2 size-3.5" />
            Refresh
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 xl:items-stretch">
        {summaryCards.map(({ title, key, icon, color, trend }) => (
          <DashboardKpiCard
            key={key}
            title={title}
            value={values[key]}
            icon={icon}
            color={color}
            trend={trend}
            loading={isLoading}
          />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:items-stretch">
        <ProgressMetricCard
          title="Deposit requests"
          total={String(values.deposit)}
          delta={String(dashboard?.deposits.today ?? 0)}
          deltaLabel="today"
          percent={`${(dashboard?.deposits.avg ?? 0).toFixed(1)} avg/day`}
          unit="requests"
          data={depositSeries}
          dateFormatter={(date) => date}
          accent="emerald"
          size="sm"
          className="ib-portal-metric"
          loading={isLoading}
        />
        <ProgressMetricCard
          title="Withdrawal requests"
          total={String(values.withdrawal)}
          delta={String(dashboard?.withdrawals.today ?? 0)}
          deltaLabel="today"
          percent={`${(dashboard?.withdrawals.avg ?? 0).toFixed(1)} avg/day`}
          unit="requests"
          data={withdrawalSeries}
          dateFormatter={(date) => date}
          accent="emerald"
          size="sm"
          className="ib-portal-metric"
          loading={isLoading}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.65fr_0.85fr]">
        <section className="ib-portal-metric rounded-2xl bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Wallet className="size-4" />
                </span>
                <h2 className="font-semibold">Request activity</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Daily deposits and withdrawals across the last 14 days
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <i className="size-2 rounded-full bg-primary" />
                Deposits
              </span>
              <span className="flex items-center gap-1.5">
                <i className="size-2 rounded-full bg-[#398895]" />
                Withdrawals
              </span>
            </div>
          </div>
          <div className="mt-3 h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={activitySeries}
                margin={{ top: 12, right: 4, left: -22, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="depositFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--primary)"
                      stopOpacity={0.24}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="withdrawalFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#398895" stopOpacity={0.19} />
                    <stop offset="95%" stopColor="#398895" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="4 5"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  dy={10}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "var(--border)",
                    background: "var(--card)",
                    color: "var(--foreground)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="deposits"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  fill="url(#depositFill)"
                />
                <Area
                  type="monotone"
                  dataKey="withdrawals"
                  stroke="#398895"
                  strokeWidth={2.5}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  fill="url(#withdrawalFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="ib-portal-metric rounded-2xl bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Requests overview</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Current queue status
              </p>
            </div>
            <a href="/deposits" className="text-sm font-medium text-primary">
              View deposits
            </a>
          </div>
          <div className="mt-7 flex items-center gap-5">
            <div
              className="relative grid size-32 shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#f59e0b 0 ${pendingStop}%, #0ea5e9 ${pendingStop}% ${processingStop}%, #10b981 ${processingStop}% ${approvedStop}%, #f43f5e ${approvedStop}% ${rejectedStop}%, #8b5cf6 ${rejectedStop}% 100%)`,
              }}
            >
              <div className="grid size-24 place-items-center rounded-full bg-card text-center">
                <span>
                  <strong className="block text-2xl">{totalRequests}</strong>
                  <span className="text-[10px] text-muted-foreground">
                    Loaded requests
                  </span>
                </span>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-500" />
                Pending <strong className="ml-auto">{pending}</strong>
              </p>
              <p className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-sky-500" />
                Processing <strong className="ml-auto">{processing}</strong>
              </p>
              <p className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                Approved <strong className="ml-auto">{approved}</strong>
              </p>
              <p className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-rose-500" />
                Rejected <strong className="ml-auto">{rejected}</strong>
              </p>
              <p className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-violet-500" />
                Reversed <strong className="ml-auto">{reversed}</strong>
              </p>
            </div>
          </div>
          <div className="mt-7 rounded-xl bg-muted/50 p-4">
            <p className="text-xs font-medium">Currently processing</p>
            <p className="mt-1 text-xl font-semibold">
              {processing}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                requests
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Live from the review queue
            </p>
          </div>
        </section>
      </div>
      <section className="ib-portal-metric overflow-hidden rounded-2xl bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-semibold">Recent transactions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Latest activity from across your payment requests
            </p>
          </div>
          <a href="/deposits" className="text-sm font-medium text-primary">
            See all
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                {["Transaction", "Client", "Date", "Amount", "Status"].map(
                  (label) => (
                    <th key={label} className="px-5 py-3 font-medium">
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <TableSkeletonRows columns={5} cellClassName="px-5 py-4" />
              ) : recent.map((row) => (
                <tr key={row.id}>
                  <td className="px-5 py-4 font-medium">
                    {row.id}
                    <span className="ml-2 text-xs font-normal capitalize text-muted-foreground">
                      {row.kind}
                    </span>
                  </td>
                  <td className="px-5 py-4">{row.customer_name}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {new Intl.DateTimeFormat("en", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(new Date(row.created_at))}
                  </td>
                  <td className="px-5 py-4 font-semibold">
                    {currency(Number(row.amount), row.currency)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${row.status === "pending" ? "bg-amber-500/10 text-amber-700" : row.status === "processing" ? "bg-sky-500/10 text-sky-700" : row.status === "approved" ? "bg-emerald-500/10 text-emerald-700" : row.status === "reversed" ? "bg-violet-500/10 text-violet-700" : "bg-rose-500/10 text-rose-700"}`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
