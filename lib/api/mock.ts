import { seedClients, seedRequests } from "@/lib/mock-data";
import type { Client, PaymentRequest, RequestKind, RequestStatus } from "@/lib/types";

let requests = seedRequests.map((row) => ({ ...row }));
const delay = () => new Promise((resolve) => setTimeout(resolve, 250));

export async function fetchRequests(kind?: RequestKind): Promise<PaymentRequest[]> {
  await delay();
  return requests.filter((row) => !kind || row.kind === kind).map((row) => ({ ...row }));
}
export async function updateRequestStatus(id: string, status: Extract<RequestStatus, "approved" | "rejected">) {
  await delay();
  const index = requests.findIndex((row) => row.id === id);
  if (index < 0) throw new Error("Request could not be found.");
  requests[index] = { ...requests[index], status };
  return { ...requests[index] };
}
export async function fetchClients(): Promise<Client[]> { await delay(); return structuredClone(seedClients); }
