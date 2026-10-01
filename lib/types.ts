export type Role = "admin" | "agent";

export type RequestStatus = "pending" | "approved" | "rejected";

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
