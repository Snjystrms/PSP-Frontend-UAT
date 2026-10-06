"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { createPortalUser, fetchAuditLogs, fetchErrorCodes, fetchPortalPublicKey, fetchSystemHealth, fetchUsers, updatePortalUser } from "@/lib/api/backend";

export function usePortalUsers(pspCode?: string) {
  return useQuery({ queryKey: ["portal-users", pspCode ?? "all"], queryFn: () => fetchUsers(pspCode) });
}

export function useCreatePortalUser() {
  const client = useQueryClient();
  return useMutation({ mutationFn: createPortalUser, onSuccess: () => { void client.invalidateQueries({ queryKey: ["portal-users"] }); toast.success("Portal user created."); }, onError: (error) => toast.error(error instanceof Error ? error : "Could not create user.") });
}

export function useUpdatePortalUser() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }: { id: number; payload: { full_name?: string; is_active?: boolean; password?: string; unlock?: boolean } }) => updatePortalUser(id, payload), onSuccess: () => { void client.invalidateQueries({ queryKey: ["portal-users"] }); toast.success("Portal user updated."); }, onError: (error) => toast.error(error instanceof Error ? error : "Could not update user.") });
}

export function useAuditLogs(filters: { action?: string; target?: string; offset?: number; limit?: number } = {}) {
  return useQuery({ queryKey: ["audit-logs", filters], queryFn: () => fetchAuditLogs({ ...filters, limit: filters.limit ?? 200 }) });
}

export function useSystemHealth() {
  return useQuery({ queryKey: ["system-health"], queryFn: fetchSystemHealth, refetchInterval: 60_000 });
}

export function useErrorCodes() {
  return useQuery({ queryKey: ["error-codes"], queryFn: fetchErrorCodes });
}

export function usePortalPublicKey() {
  return useQuery({ queryKey: ["portal-public-key"], queryFn: fetchPortalPublicKey });
}
