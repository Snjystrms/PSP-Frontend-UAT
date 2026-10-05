"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TablePaginationProps = {
  total?: number;
  pageIndex: number;
  pageSize: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  hasNext?: boolean;
  currentCount?: number;
};

export function TablePagination({ total, pageIndex, pageSize, onPageChange, onPageSizeChange, pageSizeOptions = [10, 20, 50], hasNext, currentCount }: TablePaginationProps) {
  const pageCount = total === undefined ? pageIndex + (hasNext ? 2 : 1) : Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(pageIndex + 1, pageCount);
  const first = total === 0 ? 0 : pageIndex * pageSize + 1;
  const last = total === undefined ? pageIndex * pageSize + (currentCount ?? pageSize) : Math.min((pageIndex + 1) * pageSize, total);
  const start = Math.max(0, Math.min(current - 3, pageCount - 5));
  const visiblePages = Array.from({ length: Math.min(pageCount, 5) }, (_, index) => start + index + 1);
  const canNext = hasNext ?? pageIndex < pageCount - 1;

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>{total === undefined ? (last === 0 ? "No records" : `Showing ${first}–${last}`) : `Showing ${first}–${last} of ${total}`}</span>
      <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
        <label className="flex items-center gap-2 whitespace-nowrap">Rows per page
          <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="h-8 w-[4.5rem] bg-background"><SelectValue /></SelectTrigger>
            <SelectContent side="top">{pageSizeOptions.map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent>
          </Select>
        </label>
        <span className="whitespace-nowrap">Page {current}{total !== undefined ? ` of ${pageCount}` : ""}</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" aria-label="First page" disabled={pageIndex === 0} onClick={() => onPageChange(0)}><ChevronsLeft className="size-3.5" /></Button>
          <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={pageIndex === 0} onClick={() => onPageChange(Math.max(0, pageIndex - 1))}><ChevronLeft className="size-3.5" /></Button>
          {visiblePages.map((page) => <Button key={page} variant={page === current ? "default" : "outline"} size="icon-sm" aria-label={`Page ${page}`} aria-current={page === current ? "page" : undefined} onClick={() => onPageChange(page - 1)}>{page}</Button>)}
          <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={!canNext} onClick={() => onPageChange(pageIndex + 1)}><ChevronRight className="size-3.5" /></Button>
          {total !== undefined && <Button variant="outline" size="icon-sm" aria-label="Last page" disabled={pageIndex >= pageCount - 1} onClick={() => onPageChange(pageCount - 1)}><ChevronsRight className="size-3.5" /></Button>}
        </div>
      </div>
    </div>
  );
}
