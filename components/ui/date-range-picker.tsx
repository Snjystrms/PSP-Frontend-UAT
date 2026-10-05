"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DateRangePickerProps = {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  disabled?: boolean;
};

function toDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDate(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function CalendarField({ label, value, min, max, disabled, onChange }: {
  label: string;
  value: string;
  min?: string;
  max?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const selected = parseDate(value);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const initial = selected ?? new Date();
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const gridStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1 - firstDay.getDay());
  const days = Array.from({ length: 42 }, (_, index) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index));
  const minDate = parseDate(min ?? "");
  const maxDate = parseDate(max ?? "");
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 + 11 }, (_, index) => 1990 + index);
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="min-w-0 space-y-1.5">
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" disabled={disabled} aria-label={`${label}: ${value || "choose date"}`} className="w-full min-w-0 justify-start gap-2 px-3 font-normal">
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{selected ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(selected) : "Choose date"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(19rem,calc(100vw-2rem))] p-3">
          <div className="mb-3 flex items-center justify-between gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Previous month" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}><ChevronLeft className="size-4" /></Button>
            <div className="flex min-w-0 items-center gap-1">
              <Select value={String(viewMonth.getMonth())} onValueChange={(month) => setViewMonth(new Date(viewMonth.getFullYear(), Number(month), 1))}>
                <SelectTrigger aria-label="Choose month" className="h-8 w-[7.5rem] border-transparent bg-transparent px-2 font-semibold shadow-none"><SelectValue /></SelectTrigger>
                <SelectContent align="center">{Array.from({ length: 12 }, (_, month) => <SelectItem key={month} value={String(month)}>{new Intl.DateTimeFormat("en", { month: "long" }).format(new Date(2024, month, 1))}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={String(viewMonth.getFullYear())} onValueChange={(year) => setViewMonth(new Date(Number(year), viewMonth.getMonth(), 1))}>
                <SelectTrigger aria-label="Choose year" className="h-8 w-[5.5rem] border-transparent bg-transparent px-2 font-semibold shadow-none"><SelectValue /></SelectTrigger>
                <SelectContent align="center">{years.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Next month" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}><ChevronRight className="size-4" /></Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
            {weekdays.map((day) => <span key={day} className="py-1">{day}</span>)}
            {days.map((day) => {
              const inMonth = day.getMonth() === viewMonth.getMonth();
              const dayValue = toDateValue(day);
              const isSelected = dayValue === value;
              const outsideRange = Boolean((minDate && day < minDate) || (maxDate && day > maxDate));
              return <Button key={dayValue} type="button" variant={isSelected ? "default" : "ghost"} size="icon-sm" disabled={outsideRange} aria-pressed={isSelected} aria-label={new Intl.DateTimeFormat("en", { dateStyle: "full" }).format(day)} onClick={() => { onChange(dayValue); setOpen(false); }} className={`mx-auto size-8 text-xs ${!inMonth ? "text-muted-foreground/50" : ""}`}>
                {day.getDate()}
              </Button>;
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function DateRangePicker({ fromDate, toDate, onFromDateChange, onToDateChange, disabled = false }: DateRangePickerProps) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
      <CalendarField label="From date" value={fromDate} max={toDate} disabled={disabled} onChange={onFromDateChange} />
      <CalendarField label="To date" value={toDate} min={fromDate} disabled={disabled} onChange={onToDateChange} />
    </div>
  );
}
