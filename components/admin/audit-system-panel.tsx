"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Clipboard,
  Database,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SerialNumberCell } from "@/components/ui/serial-number-cell";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import {
  useAuditLogs,
  useErrorCodes,
  usePortalPublicKey,
  useSystemHealth,
} from "@/lib/queries/admin";

const auditDetailLabels: Record<string, string> = {
  actor_id: "Actor ID",
  login_email: "Login email",
  psp_code: "PSP code",
  source: "Source",
};

function formatAuditDetailLabel(key: string) {
  return (
    auditDetailLabels[key] ??
    key
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function formatAuditDetailValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") {
    if (value === "admin_portal") return "Admin portal";
    if (value === "psp_portal") return "PSP portal";
    return value;
  }
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    return value.map(formatAuditDetailValue).join(", ");
  }
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, nestedValue]) =>
        `${formatAuditDetailLabel(key)}: ${formatAuditDetailValue(nestedValue)}`,
      )
      .join(" · ");
  }
  return String(value);
}

export function AuditSystemPanel() {
  const [actionFilter, setActionFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [auditOffset, setAuditOffset] = useState(0);
  const [auditPageSize, setAuditPageSize] = useState(25);
  const health = useSystemHealth();
  const audit = useAuditLogs({
    action: actionFilter || undefined,
    target: targetFilter || undefined,
    offset: auditOffset,
    limit: auditPageSize,
  });
  const errors = useErrorCodes();
  const publicKey = usePortalPublicKey();
  const ready = health.data?.ready;
  const copyKey = () => {
    if (!publicKey.data) return;
    void navigator.clipboard
      .writeText(publicKey.data)
      .then(() => toast.success("Portal public key copied."))
      .catch(() => toast.error("Clipboard access is unavailable."));
  };

  return (
    <div className="space-y-6">
      {health.isError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-700 dark:text-rose-300"
        >
          {health.error instanceof Error
            ? health.error.message
            : "Could not reach service health endpoint."}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Input
              aria-label="Filter audit action prefix"
              placeholder="Action prefix"
              value={actionFilter}
              onChange={(event) => {
                setActionFilter(event.target.value);
                setAuditOffset(0);
              }}
              className="w-36"
            />
            <Input
              aria-label="Filter audit target"
              placeholder="Target"
              value={targetFilter}
              onChange={(event) => {
                setTargetFilter(event.target.value);
                setAuditOffset(0);
              }}
              className="w-36"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void Promise.all([
                health.refetch(),
                audit.refetch(),
                errors.refetch(),
                publicKey.refetch(),
              ]);
            }}
          >
            <RefreshCw className="mr-2 size-3.5" />
            Refresh
          </Button>
        </div>
        {audit.isError ? (
          <p className="p-6 text-sm text-destructive">
            {audit.error instanceof Error
              ? audit.error.message
              : "Could not load audit trail."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  {[
                    "Sr. No.",
                    "Time",
                    "Actor",
                    "Action",
                    "Target",
                    "IP",
                    "Details",
                  ].map((label, index) => (
                    <th
                      key={label}
                      className={
                        index === 0
                          ? "w-20 whitespace-nowrap px-4 py-3 font-medium"
                          : "px-4 py-3 font-medium"
                      }
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {audit.isLoading ? (
                  <TableSkeletonRows columns={7} cellClassName="px-4 py-3" />
                ) : (
                  audit.data?.items.map((row, index) => (
                    <tr key={row.id} className="align-top hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <SerialNumberCell
                          serialNumber={auditOffset + index + 1}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="block capitalize">
                          {row.actor_type}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {row.actor_id}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{row.action}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {row.target ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {row.ip_address ?? "—"}
                      </td>
                      <td className="max-w-[380px] px-4 py-3">
                        {row.details && Object.keys(row.details).length > 0 ? (
                          <dl className="space-y-1.5 text-xs leading-5">
                            {Object.entries(row.details).map(([key, value]) => (
                              <div key={key} className="break-words">
                                <dt className="inline font-medium text-foreground">
                                  {formatAuditDetailLabel(key)}:
                                </dt>{" "}
                                <dd className="inline text-muted-foreground">
                                  {formatAuditDetailValue(value)}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No additional details
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {audit.data && (
          <TablePagination
            pageIndex={Math.floor(auditOffset / auditPageSize)}
            pageSize={auditPageSize}
            currentCount={audit.data.items.length}
            hasNext={audit.data.items.length === auditPageSize}
            onPageChange={(pageIndex) =>
              setAuditOffset(pageIndex * auditPageSize)
            }
            onPageSizeChange={(size) => {
              setAuditPageSize(size);
              setAuditOffset(0);
            }}
          />
        )}
      </section>
    </div>
  );
}
