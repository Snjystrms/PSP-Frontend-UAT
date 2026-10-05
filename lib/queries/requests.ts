"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { createPortalRequest, fetchRequestDetail, fetchRequestPage, fetchRequests, markRequestProcessing, resendRequestCallback, reverseRequest, updateRequestStatus, type PortalRequestFilters } from "@/lib/api/backend";
import type { RequestKind, RequestStatus } from "@/lib/types";

export function useRequests(kind?: RequestKind) {
  return useQuery({ queryKey: ["requests", kind ?? "all"], queryFn: () => fetchRequests(kind), refetchInterval: 30_000, refetchOnWindowFocus: true });
}
export function useRequestPage(kind: RequestKind, filters: PortalRequestFilters) {
  return useQuery({ queryKey: ["request-page", kind, filters], queryFn: () => fetchRequestPage(kind, filters), placeholderData: (previous) => previous, refetchInterval: 30_000, refetchOnWindowFocus: true });
}
export function useCreatePortalRequest(kind: RequestKind) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => createPortalRequest(kind, formData),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["requests"] });
      void client.invalidateQueries({ queryKey: ["request-page", kind] });
      toast.success(`${kind === "deposit" ? "Deposit" : "Withdrawal"} request created.`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not create this request."),
  });
}

export function useRequestDetail(id: string | null, kind: RequestKind) {
  return useQuery({ queryKey: ["request-detail", kind, id], queryFn: () => fetchRequestDetail(id!, kind), enabled: Boolean(id) });
}
export function useUpdateRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, kind, status, reason }: { id: string; kind: RequestKind; status: Extract<RequestStatus, "approved" | "rejected">; reason: string }) => updateRequestStatus(id, kind, status, reason),
    onSuccess: (_, variables) => { void client.invalidateQueries({ queryKey: ["requests"] }); void client.invalidateQueries({ queryKey: ["request-page"] }); void client.invalidateQueries({ queryKey: ["request-detail"] }); toast.success(`${variables.id} ${variables.status}`); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not update this request."),
  });
}

export function useReverseRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, kind, reason }: { id: string; kind: RequestKind; reason: string }) => reverseRequest(id, kind, reason),
    onSuccess: (_, variables) => {
      void client.invalidateQueries({ queryKey: ["requests"] });
      void client.invalidateQueries({ queryKey: ["request-page"] });
      void client.invalidateQueries({ queryKey: ["request-detail"] });
      toast.success(`${variables.id} reversed.`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not reverse this request."),
  });
}

export function useResendRequestCallback() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: RequestKind }) => resendRequestCallback(id, kind),
    onSuccess: (result) => { void client.invalidateQueries({ queryKey: ["requests"] }); void client.invalidateQueries({ queryKey: ["request-page"] }); void client.invalidateQueries({ queryKey: ["request-detail"] }); toast.success(result.message); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not queue the callback retry."),
  });
}

export function useMarkRequestProcessing() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: RequestKind }) => markRequestProcessing(id, kind),
    onSuccess: (_, variables) => { void client.invalidateQueries({ queryKey: ["requests"] }); void client.invalidateQueries({ queryKey: ["request-page"] }); void client.invalidateQueries({ queryKey: ["request-detail"] }); toast.success(`${variables.id} is now being reviewed.`); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not claim this request."),
  });
}
