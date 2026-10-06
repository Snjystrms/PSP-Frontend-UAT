"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchPortalChat,
  fetchPortalChats,
  sendPortalChatMessage,
  updatePortalChatStatus,
} from "@/lib/api/backend";
import type { RequestKind } from "@/lib/types";
import { toast } from "@/components/ui/toast";

export function usePortalChats(filters: {
  status?: "open" | "closed";
  kind?: RequestKind;
  unread?: boolean;
} = {}) {
  return useQuery({
    queryKey: ["portal-chats", filters],
    queryFn: () => fetchPortalChats({ ...filters, limit: 100, offset: 0 }),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function usePortalChat(kind: RequestKind | null, id: string | null) {
  return useQuery({
    queryKey: ["portal-chat", kind, id],
    queryFn: () => fetchPortalChat(kind!, id!),
    enabled: Boolean(kind && id),
    refetchInterval: 5_000,
  });
}

export function useSendPortalChatMessage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      kind,
      id,
      message,
    }: {
      kind: RequestKind;
      id: string;
      message: string;
    }) => sendPortalChatMessage(kind, id, message),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["portal-chat"] });
      void client.invalidateQueries({ queryKey: ["portal-chats"] });
      toast.success("Message sent.");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error : "Could not send this message."),
  });
}

export function useUpdatePortalChatStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      kind,
      id,
      action,
    }: {
      kind: RequestKind;
      id: string;
      action: "close" | "reopen";
    }) => updatePortalChatStatus(kind, id, action),
    onSuccess: (_, { action }) => {
      void client.invalidateQueries({ queryKey: ["portal-chat"] });
      void client.invalidateQueries({ queryKey: ["portal-chats"] });
      toast.success(action === "close" ? "Conversation closed." : "Conversation reopened.");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error : "Could not update this conversation."),
  });
}
