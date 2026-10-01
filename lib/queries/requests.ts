"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchRequests, updateRequestStatus } from "@/lib/api/mock";
import type { RequestKind, RequestStatus } from "@/lib/types";

export function useRequests(kind?: RequestKind) {
  return useQuery({ queryKey: ["requests", kind ?? "all"], queryFn: () => fetchRequests(kind) });
}
export function useUpdateRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Extract<RequestStatus, "approved" | "rejected"> }) => updateRequestStatus(id, status),
    onSuccess: (row) => { void client.invalidateQueries({ queryKey: ["requests"] }); toast.success(`${row.id} ${row.status}`); },
    onError: () => toast.error("Could not update this request."),
  });
}
