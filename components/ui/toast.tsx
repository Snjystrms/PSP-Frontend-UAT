"use client";

import { motion } from "motion/react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { toast as sonnerToast } from "sonner";

type ToastVariant = "success" | "error" | "info" | "warning";
export type ToastErrorCode = {
  error_code: string;
  name: string;
  http_status: number;
  message: string;
};
type ApiError = Error & { errorCode?: string; httpStatus?: number };

let errorCodeCatalog: ToastErrorCode[] = [];

const variants: Record<ToastVariant, { title: string; Icon: typeof Info; iconClass: string; borderClass: string }> = {
  success: { title: "Success", Icon: CheckCircle2, iconClass: "text-emerald-500", borderClass: "border-emerald-500/25" },
  error: { title: "Error", Icon: AlertCircle, iconClass: "text-destructive", borderClass: "border-destructive/25" },
  info: { title: "Notification", Icon: Info, iconClass: "text-muted-foreground", borderClass: "border-border" },
  warning: { title: "Warning", Icon: TriangleAlert, iconClass: "text-amber-500", borderClass: "border-amber-500/25" },
};

const animation = {
  initial: { opacity: 0, y: 50, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 50, scale: 0.95 },
};

function showToast(
  message: string,
  variant: ToastVariant,
  duration = 4500,
  extra?: { title?: string; metadata?: string; detail?: string },
) {
  const { title: defaultTitle, Icon, iconClass, borderClass } = variants[variant];
  const title = extra?.title ?? defaultTitle;
  return sonnerToast.custom((id) => (
    <motion.div
      variants={animation}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative flex w-[min(20rem,calc(100vw-2rem))] items-start gap-3 rounded-2xl border ${borderClass} bg-card p-4 pr-10 text-card-foreground shadow-xl shadow-black/10`}
      role={variant === "error" ? "alert" : "status"}
    >
      <Icon className={`mt-0.5 size-[18px] shrink-0 ${iconClass}`} strokeWidth={1.8} />
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-semibold leading-5">{title}</p>
        <p className="break-words text-[13px] leading-[1.35rem] text-muted-foreground">{message}</p>
        {extra?.detail && (
          <p className="break-words pt-0.5 text-xs leading-5 text-muted-foreground">
            {extra.detail}
          </p>
        )}
        {extra?.metadata && (
          <p className="pt-1 text-[10px] font-medium tracking-wide text-muted-foreground/80">
            {extra.metadata}
          </p>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => sonnerToast.dismiss(id)}
        className="absolute right-3 top-3 grid size-5 cursor-pointer place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-3.5" />
      </button>
    </motion.div>
  ), { duration, position: "top-right" });
}

function humanizeErrorName(name: string) {
  const acronyms: Record<string, string> = {
    api: "API",
    ifsc: "IFSC",
    ip: "IP",
    rsa: "RSA",
    psp: "PSP",
    tx: "Transaction",
  };
  return name
    .toLowerCase()
    .split("_")
    .map((word) => acronyms[word] ?? `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function showApiError(error: ApiError, duration?: number) {
  const code = error.errorCode;
  if (!code) return showToast(error.message, "error", duration);

  const definition = errorCodeCatalog.find((entry) => entry.error_code === code);
  const detail =
    definition && error.message !== definition.message ? error.message : undefined;
  const metadata = [code, error.httpStatus ? `HTTP ${error.httpStatus}` : undefined]
    .filter(Boolean)
    .join(" · ");

  return showToast(
    definition?.message ?? error.message,
    "error",
    duration,
    {
      title: definition ? humanizeErrorName(definition.name) : "Request failed",
      metadata,
      detail,
    },
  );
}

export const toast = {
  success: (message: string, duration?: number) => showToast(message, "success", duration),
  error: (message: string | Error, duration?: number) =>
    message instanceof Error
      ? showApiError(message as ApiError, duration)
      : showToast(message, "error", duration),
  info: (message: string, duration?: number) => showToast(message, "info", duration),
  warning: (message: string, duration?: number) => showToast(message, "warning", duration),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  setErrorCodeCatalog: (catalog: ToastErrorCode[]) => {
    errorCodeCatalog = catalog;
  },
};
