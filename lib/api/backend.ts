import type { PaymentRequest, RequestKind, RequestStatus } from "@/lib/types";

type BackendTransaction = {
  id: string;
  psp_code?: string | null;
  customer_name: string;
  customer_email: string;
  amount: number | string;
  currency: string;
  status: RequestStatus;
  created_by?: "admin" | "crm";
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
  callback_last_error?: string | null;
  callback_sent_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  updated_at?: string;
  screenshot_url?: string;
  utr_number?: string | null;
};

type BackendPage = { items: BackendTransaction[]; total: number };

export type PortalDashboard = {
  role: "admin" | "psp";
  full_name: string;
  psp_code: string | null;
  psp_name: string | null;
  deposits: DashboardRequestCard;
  withdrawals: DashboardRequestCard;
  pending_requests: number;
  approval_rate: number;
  activity: Array<{
    date: string;
    deposits: number;
    withdrawals: number;
  }>;
  requests_overview: {
    pending: number;
    processing: number;
    approved: number;
    rejected: number;
    reversed: number;
    total: number;
  };
  recent_transactions: Array<{
    id: string;
    kind: RequestKind;
    psp_code: string | null;
    customer_name: string;
    customer_email: string;
    amount: number | string;
    currency: string;
    status: RequestStatus;
    created_at: string;
  }>;
  generated_at: string;
};

export type PortalChatMessage = {
  id: number;
  sender_name: string;
  sender_role: "admin" | "psp";
  message: string;
  created_at: string;
};

export type PortalChatSummary = {
  transaction_id: string;
  kind: RequestKind;
  psp_code: string | null;
  status: "open" | "closed" | null;
  opened_by: string | null;
  closed_by: string | null;
  closed_at: string | null;
  created_at: string | null;
  last_message_at: string | null;
  unread_count: number;
};

export type PortalChat = PortalChatSummary & {
  messages: PortalChatMessage[];
};

type DashboardRequestCard = {
  period_days: number;
  total: number;
  today: number;
  peak: number;
  low: number;
  avg: number;
  series: Array<{ date: string; count: number }>;
};

class BackendRequestError extends Error {
  constructor(
    message: string,
    readonly errorCode?: string,
    readonly httpStatus?: number,
  ) {
    super(message);
    this.name = "BackendRequestError";
  }
}

async function backendRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`/api/backend/${path.replace(/^\//, "")}`, {
    ...init,
    headers,
  });
  const raw = await response.text();
  let body: unknown = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = raw;
  }
  if (!response.ok) {
    const errorBody =
      body && typeof body === "object"
        ? (body as { message?: string; error?: string; error_code?: string })
        : null;
    const message =
      errorBody?.message ??
      errorBody?.error ??
      `Backend request failed (${response.status})`;
    throw new BackendRequestError(
      message,
      errorBody?.error_code,
      response.status,
    );
  }
  return body as T;
}

export async function fetchPortalDashboard(
  options: { days?: number; activityDays?: number; recentLimit?: number } = {},
) {
  const query = new URLSearchParams({
    days: String(options.days ?? 30),
    activity_days: String(options.activityDays ?? 14),
    recent_limit: String(options.recentLimit ?? 10),
  });
  return backendRequest<PortalDashboard>(`portal/dashboard?${query}`);
}

export async function fetchPortalChats(filters: {
  status?: "open" | "closed";
  kind?: RequestKind;
  unread?: boolean;
  limit?: number;
  offset?: number;
} = {}) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });
  return backendRequest<{
    items: PortalChatSummary[];
    total: number;
    limit: number;
    offset: number;
  }>(`portal/chats?${query}`);
}

export async function fetchPortalChat(kind: RequestKind, id: string) {
  return backendRequest<PortalChat>(
    `portal/${kind}s/${encodeURIComponent(id)}/chat`,
  );
}

export async function sendPortalChatMessage(
  kind: RequestKind,
  id: string,
  message: string,
) {
  return backendRequest<PortalChatMessage>(
    `portal/${kind}s/${encodeURIComponent(id)}/chat/messages`,
    { method: "POST", body: JSON.stringify({ message }) },
  );
}

export async function updatePortalChatStatus(
  kind: RequestKind,
  id: string,
  action: "close" | "reopen",
) {
  return backendRequest<PortalChatSummary>(
    `portal/${kind}s/${encodeURIComponent(id)}/chat/${action}`,
    { method: "POST" },
  );
}

function mapTransaction(
  row: BackendTransaction,
  kind: RequestKind,
): PaymentRequest {
  const bankAccountId =
    kind === "deposit" ? row.bank_account_id : row.source_account_id;
  return {
    id: row.id,
    kind,
    clientId: row.customer_email,
    clientName: row.customer_name,
    amount: Number(row.amount),
    currency: row.currency,
    method:
      kind === "deposit"
        ? "Bank transfer"
        : row.dest_bank_name || "Bank transfer",
    bankAccountId,
    status: row.status,
    createdAt: row.created_at,
    reference:
      row.idempotency_key || row.psp_code || row.dest_account_number || "—",
    comment: row.review_comment ?? row.comment ?? undefined,
    accountName: row.dest_account_name,
    accountNumber: row.dest_account_number,
    bankName: row.dest_bank_name,
    bankCode: row.dest_ifsc,
    pspCode: row.psp_code ?? undefined,
    callbackFailed:
      (row.status === "approved" ||
        row.status === "rejected" ||
        row.status === "reversed") &&
      row.callback_sent === false,
    callbackAttempts: row.callback_attempts,
  };
}

export async function fetchRequests(
  kind?: RequestKind,
): Promise<PaymentRequest[]> {
  const kinds: RequestKind[] = kind ? [kind] : ["deposit", "withdrawal"];
  const pages = await Promise.all(
    kinds.map(async (type) => {
      const first = await backendRequest<
        BackendPage & { limit: number; offset: number }
      >(`portal/${type}s?limit=200&offset=0`);
      const items = [...first.items];
      for (
        let offset = first.limit;
        offset < first.total;
        offset += first.limit
      ) {
        const next = await backendRequest<
          BackendPage & { limit: number; offset: number }
        >(`portal/${type}s?limit=${first.limit}&offset=${offset}`);
        items.push(...next.items);
      }
      return items.map((row) => mapTransaction(row, type));
    }),
  );
  return pages.flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type PortalRequestFilters = {
  status?: RequestStatus;
  psp_code?: string;
  currency?: string;
  customer?: string;
  callback_failed?: boolean;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
};

export async function fetchRequestPage(
  kind: RequestKind,
  filters: PortalRequestFilters = {},
) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const page = await backendRequest<
    BackendPage & { limit: number; offset: number }
  >(`portal/${kind}s?${query}`);
  return { ...page, items: page.items.map((row) => mapTransaction(row, kind)) };
}

export async function createPortalRequest(
  kind: RequestKind,
  formData: FormData,
) {
  const row = await backendRequest<BackendTransaction>(`portal/${kind}s`, {
    method: "POST",
    body: formData,
  });
  return mapTransaction(row, kind);
}

export async function fetchRequestDetail(id: string, kind: RequestKind) {
  const row = await backendRequest<BackendTransaction>(
    `portal/${kind}s/${encodeURIComponent(id)}`,
  );
  return {
    ...mapTransaction(row, kind),
    screenshotUrl: row.screenshot_url,
    utrNumber: row.utr_number,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    callbackLastError: row.callback_last_error,
    callbackSentAt: row.callback_sent_at,
    callbackAttempts: row.callback_attempts ?? 0,
    createdBy: row.created_by,
  };
}

export type DetailedPaymentRequest = Awaited<
  ReturnType<typeof fetchRequestDetail>
>;

export async function updateRequestStatus(
  id: string,
  kind: RequestKind,
  status: Extract<RequestStatus, "approved" | "rejected">,
  reason: string,
) {
  const action = status === "approved" ? "approve" : "reject";
  const body =
    status === "approved" ? { comment: reason || undefined } : { reason };
  return backendRequest<BackendTransaction>(
    `portal/${kind}s/${encodeURIComponent(id)}/${action}`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function markRequestProcessing(id: string, kind: RequestKind) {
  return backendRequest<BackendTransaction>(
    `portal/${kind}s/${encodeURIComponent(id)}/processing`,
    { method: "POST" },
  );
}

export async function resendRequestCallback(id: string, kind: RequestKind) {
  return backendRequest<{ success: boolean; message: string }>(
    `portal/${kind}s/${encodeURIComponent(id)}/resend-callback`,
    { method: "POST" },
  );
}

export async function reverseRequest(
  id: string,
  kind: RequestKind,
  reason: string,
) {
  return backendRequest<BackendTransaction>(
    `portal/${kind}s/${encodeURIComponent(id)}/reverse`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );
}

export type BackendPsp = {
  psp_code: string;
  psp_name: string;
  status: "active" | "inactive";
  ifsc_code: string | null;
  account_number: string | null;
  contact_email: string | null;
  api_token_expires_at: string;
  credentials_rotated_at?: string | null;
  prev_valid_until?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type PortalUser = {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "psp";
  psp_code: string | null;
  is_active: boolean;
  locked_until: string | null;
  last_login_at: string | null;
  created_at: string;
};

export type PspCreated = {
  psp: BackendPsp;
  credentials: {
    api_token: string;
    api_secret: string;
    signature_salt: string;
    api_token_expires_at: string;
    previous_token_valid_until?: string | null;
    note?: string;
  };
  portal_login: PortalUser;
};

export type PspCredentials = PspCreated["credentials"];

export type PspCreatePayload = {
  psp_name: string;
  account_number: string;
  login_email: string;
  login_password: string;
  ifsc_code?: string;
  contact_email?: string;
};

export type PspUpdatePayload = {
  psp_name?: string;
  account_number?: string;
  ifsc_code?: string | null;
  contact_email?: string | null;
  status?: "active" | "inactive";
};

export async function fetchPsps(): Promise<BackendPsp[]> {
  const result = await backendRequest<{ psps: BackendPsp[] }>("psps");
  return result.psps;
}

export async function fetchPsp(pspCode: string) {
  return backendRequest<BackendPsp>(`psps/${encodeURIComponent(pspCode)}`);
}

export async function fetchUsers(pspCode?: string): Promise<PortalUser[]> {
  const query = pspCode ? `?psp_code=${encodeURIComponent(pspCode)}` : "";
  return backendRequest<PortalUser[]>(`users${query}`);
}

export async function fetchAuditLogs(
  filters: {
    action?: string;
    target?: string;
    limit?: number;
    offset?: number;
  } = {},
) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  return backendRequest<{
    items: Array<{
      id: number;
      created_at: string;
      actor_type: string;
      actor_id: string;
      action: string;
      target: string | null;
      details: Record<string, unknown> | null;
      ip_address?: string | null;
    }>;
  }>(`audit-logs?${query}`);
}

export async function fetchSystemHealth() {
  const [live, ready] = await Promise.all([
    fetch("/api/backend-health/health", { cache: "no-store" }).then(
      async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok)
          throw new Error(
            body?.message ?? `Health check failed (${response.status})`,
          );
        return body as { status: string; environment: string };
      },
    ),
    fetch("/api/backend-health/health/ready", { cache: "no-store" }).then(
      async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok)
          throw new Error(
            body?.message ?? `Readiness check failed (${response.status})`,
          );
        return body as {
          status: string;
          environment: string;
          database: string;
          callbacks_pending: number;
          callbacks_failed: number;
          checked_at: string;
        };
      },
    ),
  ]);
  return { live, ready };
}

export async function fetchErrorCodes() {
  return backendRequest<{
    error_codes: Array<{
      error_code: string;
      name: string;
      http_status: number;
      message: string;
    }>;
  }>("meta/error-codes");
}

export async function fetchPortalPublicKey() {
  return backendRequest<string>("meta/public-key");
}

export async function changeCurrentPassword(payload: {
  current_password: string;
  new_password: string;
}) {
  return backendRequest<{ success: boolean; message: string }>(
    "auth/change-password",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function createPortalUser(payload: {
  email: string;
  full_name: string;
  password: string;
  role: "admin" | "psp";
  psp_code?: string;
}) {
  return backendRequest<PortalUser>("users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePortalUser(
  id: number,
  payload: {
    full_name?: string;
    is_active?: boolean;
    password?: string;
    unlock?: boolean;
  },
) {
  return backendRequest(`users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createPsp(payload: PspCreatePayload) {
  return backendRequest<PspCreated>("psps", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePsp(pspCode: string, payload: PspUpdatePayload) {
  return backendRequest<BackendPsp>(`psps/${encodeURIComponent(pspCode)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function rotatePspCredentials(
  pspCode: string,
  options: { grace_hours?: number; rotate_salt?: boolean } = {},
) {
  return backendRequest<PspCredentials>(
    `psps/${encodeURIComponent(pspCode)}/rotate-credentials`,
    { method: "POST", body: JSON.stringify(options) },
  );
}

export async function deletePsp(pspCode: string) {
  return backendRequest<{ success: boolean; message: string }>(
    `psps/${encodeURIComponent(pspCode)}`,
    { method: "DELETE" },
  );
}
