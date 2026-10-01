"use client";

import { Activity, BarChart3 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ChartView } from "./metric-chart";

export interface PeriodOption {
  label: string;
  points?: number;
}

export function ViewToggle({
  value,
  onChange,
}: {
  value: ChartView;
  onChange: (view: ChartView) => void;
}) {
  return (
    <div className="pointer-events-auto inline-flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5">
      <button
        type="button"
        aria-label="Curve view"
        aria-pressed={value === "curve"}
        onClick={() => onChange("curve")}
        className={cn(
          "grid size-6 place-items-center rounded-md text-muted-foreground transition-colors",
          value === "curve" && "bg-muted text-foreground",
        )}
      >
        <Activity className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label="Bar view"
        aria-pressed={value === "bar"}
        onClick={() => onChange("bar")}
        className={cn(
          "grid size-6 place-items-center rounded-md text-muted-foreground transition-colors",
          value === "bar" && "bg-muted text-foreground",
        )}
      >
        <BarChart3 className="size-3.5" />
      </button>
    </div>
  );
}

export function PeriodSelect({
  value,
  options,
  onChange,
  accentText,
}: {
  value: string;
  options: PeriodOption[];
  onChange: (option: PeriodOption) => void;
  accentText?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="pointer-events-auto flex items-center gap-1 rounded-md text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          style={accentText ? { color: accentText } : undefined}
        >
          {value}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.label}
            onSelect={() => onChange(option)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
