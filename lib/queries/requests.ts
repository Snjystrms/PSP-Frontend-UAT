"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchRequests, markRequestProcessing, resendRequestCallback, updateRequestStatus } from "@/lib/api/backend";
import type { RequestKind, RequestStatus } from "@/lib/types";

export function useRequests(kind?: RequestKind) {
  return useQuery({ queryKey: ["requests", kind ?? "all"], queryFn: () => fetchRequests(kind), refetchInterval: 30_000, refetchOnWindowFocus: true });
}
export function useUpdateRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, kind, status, reason }: { id: string; kind: RequestKind; status: Extract<RequestStatus, "approved" | "rejected">; reason: string }) => updateRequestStatus(id, kind, status, reason),
    onSuccess: (_, variables) => { void client.invalidateQueries({ queryKey: ["requests"] }); toast.success(`${variables.id} ${variables.status}`); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not update this request."),
  });
}

export function useResendRequestCallback() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: RequestKind }) => resendRequestCallback(id, kind),
    onSuccess: (result) => { void client.invalidateQueries({ queryKey: ["requests"] }); toast.success(result.message); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not queue the callback retry."),
  });
}

export function useMarkRequestProcessing() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: RequestKind }) => markRequestProcessing(id, kind),
    onSuccess: (_, variables) => { void client.invalidateQueries({ queryKey: ["requests"] }); toast.success(`${variables.id} is now being reviewed.`); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not claim this request."),
  });
}
