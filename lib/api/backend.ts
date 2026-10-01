import type { PaymentRequest, RequestKind, RequestStatus } from "@/lib/types";

type BackendTransaction = {
  id: string;
  psp_code?: string | null;
  customer_name: string;
  customer_email: string;
  amount: number | string;
  currency: string;
  status: RequestStatus;
  created_at: string;
  comment?: string | null;
  review_comment?: string | null;
  idempotency_key?: string | null;
  bank_account_id?: string;
  dest_bank_name?: string;
  dest_account_number?: string;
  dest_ifsc?: string;
  dest_account_name?: string;
  source_account_id?: string;
  callback_sent?: boolean;
  callback_attempts?: number;
};

type BackendPage = { items: BackendTransaction[]; total: number };

async function backendRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/backend/${path.replace(/^\//, "")}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.message ?? body?.error ?? `Backend request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

function mapTransaction(row: BackendTransaction, kind: RequestKind): PaymentRequest {
  const bankAccountId = kind === "deposit" ? row.bank_account_id : row.source_account_id;
  return {
    id: row.id,
    kind,
    clientId: row.customer_email,
    clientName: row.customer_name,
    amount: Number(row.amount),
    currency: row.currency,
    method: kind === "deposit" ? "Bank transfer" : row.dest_bank_name || "Bank transfer",
    bankAccountId,
    status: row.status,
    createdAt: row.created_at,
    reference: row.idempotency_key || row.psp_code || row.dest_account_number || "—",
    comment: row.review_comment ?? row.comment ?? undefined,
    accountName: row.dest_account_name,
    accountNumber: row.dest_account_number,
    bankName: row.dest_bank_name,
    bankCode: row.dest_ifsc,
    pspCode: row.psp_code ?? undefined,
    callbackFailed: (row.status === "approved" || row.status === "rejected") && row.callback_sent === false,
    callbackAttempts: row.callback_attempts,
  };
}

export async function fetchRequests(kind?: RequestKind): Promise<PaymentRequest[]> {
  const kinds: RequestKind[] = kind ? [kind] : ["deposit", "withdrawal"];
  const pages = await Promise.all(kinds.map(async (type) => {
    const page = await backendRequest<BackendPage>(`portal/${type}s?limit=200`);
    return page.items.map((row) => mapTransaction(row, type));
  }));
  return pages.flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateRequestStatus(
  id: string,
  kind: RequestKind,
  status: Extract<RequestStatus, "approved" | "rejected">,
  reason: string,
) {
  const action = status === "approved" ? "approve" : "reject";
  const body = status === "approved" ? { comment: reason || undefined } : { reason };
  return backendRequest<BackendTransaction>(`portal/${kind}s/${encodeURIComponent(id)}/${action}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function markRequestProcessing(id: string, kind: RequestKind) {
  return backendRequest<BackendTransaction>(`portal/${kind}s/${encodeURIComponent(id)}/processing`, { method: "POST" });
}

export async function resendRequestCallback(id: string, kind: RequestKind) {
  return backendRequest<{ success: boolean; message: string }>(`portal/${kind}s/${encodeURIComponent(id)}/resend-callback`, { method: "POST" });
}

export type BackendPsp = {
  psp_code: string;
  psp_name: string;
  status: string;
  callback_url: string;
  bank_accounts: string[];
  allowed_currencies: string[];
  ifsc_code: string | null;
  account_number: string | null;
  contact_email: string | null;
  api_token_expires_at: string;
};

export async function fetchPsps(): Promise<BackendPsp[]> {
  const result = await backendRequest<{ psps: BackendPsp[] }>("psps");
  return result.psps;
}

export async function fetchUsers(pspCode?: string) {
  const query = pspCode ? `?psp_code=${encodeURIComponent(pspCode)}` : "";
  return backendRequest<Array<{ id: number; email: string; full_name: string; role: string; psp_code: string | null; is_active: boolean }>>(`users${query}`);
}

export async function fetchAuditLogs() {
  return backendRequest<{ items: Array<{ id: number; created_at: string; actor_type: string; actor_id: string; action: string; target: string | null; details: Record<string, unknown> | null }> }>("audit-logs");
}

export async function createPortalUser(payload: { email: string; full_name: string; password: string; role: "admin" | "psp"; psp_code?: string }) {
  return backendRequest("users", { method: "POST", body: JSON.stringify(payload) });
}

export async function updatePortalUser(id: number, payload: { full_name?: string; is_active?: boolean; password?: string; unlock?: boolean }) {
  return backendRequest(`users/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function createPsp(payload: {
  psp_name: string; callback_url: string; callback_username: string; callback_password: string;
  bank_accounts: string[]; allowed_currencies: string[]; login_email: string; login_password: string;
  ifsc_code?: string; account_number?: string; contact_email?: string;
}) {
  return backendRequest("psps", { method: "POST", body: JSON.stringify(payload) });
}

export async function updatePsp(pspCode: string, payload: Record<string, unknown>) {
  return backendRequest(`psps/${encodeURIComponent(pspCode)}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function rotatePspCredentials(pspCode: string, options: { grace_hours?: number; rotate_salt?: boolean } = {}) {
  return backendRequest(`psps/${encodeURIComponent(pspCode)}/rotate-credentials`, { method: "POST", body: JSON.stringify(options) });
}

export async function deletePsp(pspCode: string) {
  return backendRequest<{ success: boolean; message: string }>(`psps/${encodeURIComponent(pspCode)}`, { method: "DELETE" });
}
