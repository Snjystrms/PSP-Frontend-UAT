import type { Client, PaymentRequest } from "@/lib/types";

export const seedClients: Client[] = [
  { id: "CL-2048", name: "Olivia Chen", email: "olivia.chen@northstar.io", country: "Singapore", kycStatus: "verified", bankAccounts: [{ id: "BA-01", bankName: "DBS Bank", accountName: "Olivia Chen", accountNumber: "•••• 4821", iban: "SG21DBSS••••4821", swift: "DBSSSGSG", currency: "USD", status: "verified" }] },
  { id: "CL-2047", name: "Marcus Weber", email: "marcus@weber-group.de", country: "Germany", kycStatus: "verified", bankAccounts: [{ id: "BA-02", bankName: "Deutsche Bank", accountName: "Weber Group GmbH", accountNumber: "•••• 1904", iban: "DE89••••••••1904", swift: "DEUTDEFF", currency: "EUR", status: "verified" }] },
  { id: "CL-2046", name: "Aisha Rahman", email: "aisha@brightpath.co", country: "UAE", kycStatus: "pending", bankAccounts: [{ id: "BA-03", bankName: "Emirates NBD", accountName: "Aisha Rahman", accountNumber: "•••• 7365", iban: "AE07••••••••7365", swift: "EBILAEAD", currency: "AED", status: "pending" }] },
  { id: "CL-2045", name: "Lucas Martin", email: "lucas@atelier-m.fr", country: "France", kycStatus: "verified", bankAccounts: [{ id: "BA-04", bankName: "BNP Paribas", accountName: "Atelier Martin", accountNumber: "•••• 6312", iban: "FR76••••••••6312", swift: "BNPAFRPP", currency: "EUR", status: "verified" }] },
  { id: "CL-2044", name: "Nina Patel", email: "nina@verdantlabs.com", country: "United Kingdom", kycStatus: "verified", bankAccounts: [{ id: "BA-05", bankName: "Barclays", accountName: "Verdant Labs Ltd", accountNumber: "•••• 0948", iban: "GB29••••••••0948", swift: "BARCGB22", currency: "GBP", status: "verified" }] },
];

const now = Date.now();
export const seedRequests: PaymentRequest[] = [
  { id: "DP-00842", kind: "deposit", clientId: "CL-2048", clientName: "Olivia Chen", amount: 12450, currency: "USD", method: "Bank transfer", status: "pending", createdAt: new Date(now - 8 * 60_000).toISOString(), reference: "TXN-8F2A91" },
  { id: "WD-00317", kind: "withdrawal", clientId: "CL-2047", clientName: "Marcus Weber", amount: 8200, currency: "EUR", method: "Bank transfer", bankAccountId: "BA-02", status: "pending", createdAt: new Date(now - 21 * 60_000).toISOString(), reference: "TXN-7D4C30" },
  { id: "DP-00841", kind: "deposit", clientId: "CL-2046", clientName: "Aisha Rahman", amount: 5600, currency: "AED", method: "Wire transfer", status: "pending", createdAt: new Date(now - 36 * 60_000).toISOString(), reference: "TXN-6A1E82" },
  { id: "WD-00316", kind: "withdrawal", clientId: "CL-2045", clientName: "Lucas Martin", amount: 2375, currency: "EUR", method: "Bank transfer", bankAccountId: "BA-04", status: "approved", createdAt: new Date(now - 2 * 3_600_000).toISOString(), reference: "TXN-5B9F11" },
  { id: "DP-00840", kind: "deposit", clientId: "CL-2044", clientName: "Nina Patel", amount: 18750, currency: "GBP", method: "Card settlement", status: "approved", createdAt: new Date(now - 5 * 3_600_000).toISOString(), reference: "TXN-4E7A05" },
  { id: "WD-00315", kind: "withdrawal", clientId: "CL-2048", clientName: "Olivia Chen", amount: 3200, currency: "USD", method: "Bank transfer", bankAccountId: "BA-01", status: "rejected", createdAt: new Date(now - 8 * 3_600_000).toISOString(), reference: "TXN-3C6D44" },
  { id: "DP-00839", kind: "deposit", clientId: "CL-2047", clientName: "Marcus Weber", amount: 9900, currency: "EUR", method: "SEPA", status: "approved", createdAt: new Date(now - 24 * 3_600_000).toISOString(), reference: "TXN-2A8B73" },
];

export const volumeSeries = [
  { date: "May 01", deposits: 42, withdrawals: 28 }, { date: "May 05", deposits: 58, withdrawals: 36 },
  { date: "May 09", deposits: 49, withdrawals: 31 }, { date: "May 13", deposits: 72, withdrawals: 44 },
  { date: "May 17", deposits: 64, withdrawals: 39 }, { date: "May 21", deposits: 88, withdrawals: 54 },
  { date: "May 25", deposits: 77, withdrawals: 48 }, { date: "May 29", deposits: 104, withdrawals: 63 },
];
