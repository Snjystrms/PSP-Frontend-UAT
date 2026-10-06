"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from "recharts";

export type ChartView = "curve" | "bar";
export type MetricAccent = "emerald" | "rose" | "neutral" | "blue" | "amber";

export interface SeriesPoint {
  value: number;
  date: string;
}

export interface MetricSeries {
  name: string;
  data: SeriesPoint[];
  accent?: MetricAccent;
}

export interface ChartSeries {
  name: string;
  data: SeriesPoint[];
  color: string;
}

export const ACCENTS: Record<MetricAccent, { stroke: string; text: string }> = {
  emerald: { stroke: "#10b981", text: "#059669" },
  rose: { stroke: "#f43f5e", text: "#e11d48" },
  neutral: { stroke: "#64748b", text: "#475569" },
  blue: { stroke: "#00DDFF", text: "#0891b2" },
  amber: { stroke: "#f59e0b", text: "#d97706" },
};

export const SERIES_COLORS = [
  "#00DDFF",
  "#00AFCB",
  "#398895",
  "#72CCD9",
  "#285D68",
];

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

interface MetricChartProps {
  series: ChartSeries[];
  view: ChartView;
  defaultIndex?: number;
  valueFormatter?: (value: number) => string;
  dateFormatter?: (date: string) => string;
}

interface TooltipRow {
  name: string;
  value: number;
  color: string;
}

export function MetricChart({
  series,
  view,
  valueFormatter = (n) => n.toLocaleString(),
  dateFormatter = (d) => d,
}: MetricChartProps) {
  // Merge every series into one row per point index keyed by series name so
  // recharts can render multiple areas/bars over a shared axis.
  const merged = useMemo(() => {
    const length = Math.max(0, ...series.map((s) => s.data.length));
    return Array.from({ length }, (_, i) => {
      const row: Record<string, number | string> = {
        date: series[0]?.data[i]?.date ?? "",
      };
      for (const s of series) row[s.name] = s.data[i]?.value ?? 0;
      return row;
    });
  }, [series]);

  const renderTooltip = ({ active, payload, label }: TooltipContentProps) => {
    if (!active || !payload?.length) return null;
    const tooltipDate =
      (payload[0]?.payload as { date?: string } | undefined)?.date ?? label;
    const rows: TooltipRow[] = payload.map((p) => ({
      name: String(p.name ?? ""),
      value: Number(p.value ?? 0),
      color: p.color ?? "#000",
    }));
    return (
      <div className="pointer-events-none rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg">
        <p className="mb-1 font-medium text-popover-foreground">
          {dateFormatter(String(tooltipDate ?? ""))}
        </p>
        {rows.map((r) => (
          <p key={r.name} className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: r.color }}
            />
            <span className="font-medium text-popover-foreground">
              {valueFormatter(r.value)}
            </span>
            {series.length > 1 ? r.name : null}
          </p>
        ))}
      </div>
    );
  };

  if (view === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={merged} margin={{ top: 12, right: 8, bottom: 8, left: 8 }}>
          <Tooltip content={renderTooltip} cursor={{ fill: "transparent" }} />
          {series.map((s) => (
            <Bar
              key={s.name}
              dataKey={s.name}
              fill={s.color}
              radius={[3, 3, 0, 0]}
              maxBarSize={18}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={merged} margin={{ top: 12, right: 0, bottom: 4, left: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient
              key={s.name}
              id={`fill-${s.name.replace(/\s+/g, "-")}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={s.color} stopOpacity={0.34} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <Tooltip content={renderTooltip} cursor={{ stroke: "var(--border)" }} />
        {series.map((s) => (
          <Area
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={s.color}
            strokeWidth={2.5}
            fill={`url(#fill-${s.name.replace(/\s+/g, "-")})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: s.color }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
