"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { changeCurrentPassword } from "@/lib/api/backend";

export function useChangeCurrentPassword() {
  return useMutation({
    mutationFn: (payload: { current_password: string; new_password: string }) => changeCurrentPassword(payload),
    onSuccess: (result) => toast.success(result.message || "Password changed."),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not change your password."),
  });
}
