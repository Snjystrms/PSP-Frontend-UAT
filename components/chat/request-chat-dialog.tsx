"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageCircle, Send } from "lucide-react";
import { useAuthUser } from "@/components/auth/auth-user-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePortalChat,
  useSendPortalChatMessage,
  useUpdatePortalChatStatus,
} from "@/lib/queries/chats";
import type { PaymentRequest, RequestKind } from "@/lib/types";

function formatMessageDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function RequestChatDialog({
  request,
  kind,
  open,
  onOpenChange,
}: {
  request: PaymentRequest | null;
  kind: RequestKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const user = useAuthUser();
  const [draft, setDraft] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);
  const chat = usePortalChat(open ? kind : null, open ? request?.id ?? null : null);
  const sendMessage = useSendPortalChatMessage();
  const updateStatus = useUpdatePortalChatStatus();
  const status = chat.data?.status ?? null;
  const canSend = status !== "closed" && Boolean(request) && !chat.isError;

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.data?.messages.length]);

  useEffect(() => {
    if (!open) setDraft("");
  }, [open]);

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!request || !message || !canSend) return;
    sendMessage.mutate(
      { kind, id: request.id, message },
      { onSuccess: () => setDraft("") },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border p-5 pr-12 text-left">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <MessageCircle className="size-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate">Request chat</DialogTitle>
              <DialogDescription className="mt-1 truncate">
                {request?.id} · {request?.clientName} · {request?.pspCode ?? "PSP"}
              </DialogDescription>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${status === "closed" ? "bg-muted text-muted-foreground" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"}`}>
                {status ?? "new"}
              </span>
              {user?.role === "admin" && status && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updateStatus.isPending}
                  onClick={() =>
                    updateStatus.mutate({
                      kind,
                      id: request!.id,
                      action: status === "closed" ? "reopen" : "close",
                    })
                  }
                >
                  {status === "closed" ? "Reopen" : "Close"}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {chat.isLoading ? (
            <div className="space-y-4" aria-busy="true">
              <Skeleton className="h-16 w-3/4 rounded-2xl" />
              <Skeleton className="ml-auto h-14 w-2/3 rounded-2xl" />
              <Skeleton className="h-20 w-3/4 rounded-2xl" />
            </div>
          ) : chat.isError ? (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              Could not open this request conversation. Try again in a moment.
            </p>
          ) : chat.data?.messages.length ? (
            chat.data.messages.map((message) => {
              const ownMessage = message.sender_role === user?.role;
              return (
                <div key={message.id} className={`flex ${ownMessage ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[85%] sm:max-w-[75%]">
                    <p className={`mb-1 text-[11px] text-muted-foreground ${ownMessage ? "text-right" : ""}`}>
                      {message.sender_name} · {formatMessageDate(message.created_at)}
                    </p>
                    <p className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${ownMessage ? "rounded-tr-md bg-primary text-primary-foreground" : "rounded-tl-md border border-border bg-muted/70 text-foreground"}`}>
                      {message.message}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="grid min-h-64 place-items-center text-center">
              <div>
                <MessageCircle className="mx-auto size-8 text-muted-foreground/60" />
                <p className="mt-3 font-medium">Start the conversation</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your first message will be shared with the other party.
                </p>
              </div>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>

        {status === "closed" && (
          <p className="border-t border-border bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
            This conversation is closed. An administrator can reopen it.
          </p>
        )}
        <form onSubmit={submitMessage} className="flex items-end gap-2 border-t border-border p-4">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            maxLength={4000}
            rows={2}
            placeholder={canSend ? "Write a message…" : "Conversation is closed"}
            disabled={!canSend || sendMessage.isPending || chat.isLoading || chat.isError}
            aria-label="Message"
            className="min-h-10 flex-1 resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button type="submit" size="icon" aria-label="Send message" disabled={!canSend || !draft.trim() || sendMessage.isPending || chat.isLoading || chat.isError}>
            <Send className="size-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
