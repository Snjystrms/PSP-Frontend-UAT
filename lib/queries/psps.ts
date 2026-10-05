"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createPsp, deletePsp, fetchPsps, rotatePspCredentials, updatePsp, type PspCreatePayload, type PspCredentials, type PspUpdatePayload } from "@/lib/api/backend";

export function usePsps(enabled = true) {
  return useQuery({ queryKey: ["psps"], queryFn: fetchPsps, enabled });
}

export function useCreatePsp() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (payload: PspCreatePayload) => createPsp(payload), onSuccess: () => { void client.invalidateQueries({ queryKey: ["psps"] }); toast.success("PSP partner created."); }, onError: (error) => toast.error(error instanceof Error ? error.message : "Could not create PSP.") });
}

export function useUpdatePsp() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ code, payload }: { code: string; payload: PspUpdatePayload }) => updatePsp(code, payload), onSuccess: () => { void client.invalidateQueries({ queryKey: ["psps"] }); toast.success("PSP settings updated."); }, onError: (error) => toast.error(error instanceof Error ? error.message : "Could not update PSP.") });
}

export function useDeletePsp() {
  const client = useQueryClient();
  return useMutation({ mutationFn: deletePsp, onSuccess: (result) => { void client.invalidateQueries({ queryKey: ["psps"] }); toast.success(result.message); }, onError: (error) => toast.error(error instanceof Error ? error.message : "Could not delete PSP.") });
}

export function useRotatePspCredentials() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ code, grace_hours, rotate_salt }: { code: string; grace_hours?: number; rotate_salt?: boolean }) => rotatePspCredentials(code, { grace_hours, rotate_salt }), onSuccess: () => { void client.invalidateQueries({ queryKey: ["psps"] }); toast.success("New credentials issued. Copy and store them now."); }, onError: (error) => toast.error(error instanceof Error ? error.message : "Could not rotate credentials.") });
}
