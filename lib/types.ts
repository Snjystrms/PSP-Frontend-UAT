export type Role = "admin" | "psp";

export type RequestStatus = "pending" | "processing" | "approved" | "rejected" | "reversed";

export type RequestKind = "deposit" | "withdrawal";

export interface PaymentRequest {
  id: string;
  kind: RequestKind;
  clientId: string;
  clientName: string;
  amount: number;
  currency: string;
  method: string;
  bankAccountId?: string;
  status: RequestStatus;
  createdAt: string;
  reference: string;
  comment?: string;
  requestComment?: string;
  reviewComment?: string;
  createdBy?: string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  bankCode?: string;
  pspCode?: string;
  callbackFailed?: boolean;
  callbackAttempts?: number;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
  swift: string;
  currency: string;
  status: "verified" | "pending" | "flagged";
}

export interface Client {
  id: string;
  name: string;
  email: string;
  country: string;
  kycStatus: "verified" | "pending" | "rejected";
  bankAccounts: BankAccount[];
}

export interface ChatThread {
  id: string;
  clientName: string;
  lastMessage: string;
  unread: number;
  updatedAt: string;
}
