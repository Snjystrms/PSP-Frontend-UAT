"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";
import { useAuthUser } from "@/components/auth/auth-user-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePortalChat,
  usePortalChats,
  useSendPortalChatMessage,
  useUpdatePortalChatStatus,
} from "@/lib/queries/chats";
import type { RequestKind } from "@/lib/types";

type ChatSelection = {
  id: string;
  kind: RequestKind;
  pspCode: string | null;
  status?: "open" | "closed" | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "No messages yet";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

export function SupportChat() {
  const user = useAuthUser();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("open");
  const [kindFilter, setKindFilter] = useState<"all" | RequestKind>("all");
  const [chatSearch, setChatSearch] = useState("");
  const [selection, setSelection] = useState<ChatSelection | null>(null);
  const [requestKind, setRequestKind] = useState<RequestKind>("deposit");
  const [requestId, setRequestId] = useState("");
  const [draft, setDraft] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  const filters = useMemo(
    () => ({
      ...(statusFilter === "all" ? {} : { status: statusFilter }),
      ...(kindFilter === "all" ? {} : { kind: kindFilter }),
    }),
    [statusFilter, kindFilter],
  );
  const chats = usePortalChats(filters);
  const activeChat = usePortalChat(selection?.kind ?? null, selection?.id ?? null);
  const sendMessage = useSendPortalChatMessage();
  const updateStatus = useUpdatePortalChatStatus();
  const visibleChats = (chats.data?.items ?? []).filter((chat) => {
    const search = chatSearch.trim().toLowerCase();
    return (
      !search ||
      chat.transaction_id.toLowerCase().includes(search) ||
      chat.psp_code?.toLowerCase().includes(search)
    );
  });
  const conversationStatus = activeChat.data?.status ?? selection?.status ?? null;
  const isAdmin = user?.role === "admin";
  const canSend =
    conversationStatus !== "closed" &&
    Boolean(selection) &&
    !activeChat.isLoading &&
    !activeChat.isError;

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat.data?.messages.length]);

  useEffect(() => {
    if (activeChat.data?.transaction_id) {
      void queryClient.invalidateQueries({ queryKey: ["portal-chats"] });
    }
  }, [activeChat.data?.transaction_id, queryClient]);

  function startConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = requestId.trim();
    if (!id) return;
    setSelection({ id, kind: requestKind, pspCode: null });
    setRequestId("");
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!selection || !message || !canSend) return;
    sendMessage.mutate(
      { ...selection, message },
      { onSuccess: () => setDraft("") },
    );
  }

  return (
    <section className="grid min-h-[620px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="flex min-h-[420px] flex-col border-b border-border lg:border-b-0 lg:border-r">
        <div className="space-y-3 border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Conversations</h2>
              <p className="text-xs text-muted-foreground">
                {chats.data?.total ?? 0} conversations
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh conversations"
              onClick={() => void chats.refetch()}
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search request or PSP"
              value={chatSearch}
              onChange={(event) => setChatSearch(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as typeof statusFilter)
              }
            >
              <SelectTrigger aria-label="Filter conversations by status" className="min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open chats</SelectItem>
                <SelectItem value="closed">Closed chats</SelectItem>
                <SelectItem value="all">All chats</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={kindFilter}
              onValueChange={(value) =>
                setKindFilter(value as typeof kindFilter)
              }
            >
              <SelectTrigger aria-label="Filter conversations by request type" className="min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All requests</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="min-h-32 flex-1 overflow-y-auto p-2">
          {chats.isLoading ? (
            <div className="space-y-2 p-1">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-[72px] w-full rounded-xl" />
              ))}
            </div>
          ) : chats.isError ? (
            <div className="p-5 text-center text-sm text-muted-foreground">
              Could not load conversations.
            </div>
          ) : visibleChats.length ? (
            <div className="space-y-1">
              {visibleChats.map((chat) => {
                const selected =
                  selection?.id === chat.transaction_id &&
                  selection.kind === chat.kind;
                const Icon =
                  chat.kind === "deposit" ? ArrowDownToLine : ArrowUpFromLine;
                return (
                  <button
                    key={`${chat.kind}:${chat.transaction_id}`}
                    type="button"
                    onClick={() =>
                      setSelection({
                        id: chat.transaction_id,
                        kind: chat.kind,
                        pspCode: chat.psp_code,
                      })
                    }
                    className={`w-full rounded-xl p-3 text-left transition-colors ${selected ? "bg-primary/10" : "hover:bg-muted/70"}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold">
                            {chat.transaction_id}
                          </span>
                          {chat.unread_count > 0 && (
                            <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                              {chat.unread_count}
                            </span>
                          )}
                        </span>
                        <span className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span className="truncate">
                            {chat.psp_code ?? chat.kind}
                          </span>
                          <span className="shrink-0">
                            {formatDate(chat.last_message_at)}
                          </span>
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="p-5 text-center text-sm text-muted-foreground">
              No conversations match these filters.
            </p>
          )}
        </div>

        <form onSubmit={startConversation} className="space-y-2 border-t border-border p-4">
          <p className="text-xs font-semibold">Open a request conversation</p>
          <div className="flex gap-2">
            <Select
              value={requestKind}
              onValueChange={(value) => setRequestKind(value as RequestKind)}
            >
              <SelectTrigger aria-label="Request type" className="w-[130px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
              </SelectContent>
            </Select>
            <Input
              required
              value={requestId}
              onChange={(event) => setRequestId(event.target.value)}
              placeholder="Request ID"
              aria-label="Request ID to open"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="w-full">
            <MessageCircle className="mr-2 size-3.5" />
            Open conversation
          </Button>
        </form>
      </aside>

      <div className="flex min-h-[520px] min-w-0 flex-col">
        {selection ? (
          <>
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <MessageCircle className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{selection.id}</h2>
                  <p className="text-xs capitalize text-muted-foreground">
                    {selection.kind}
                    {activeChat.data?.psp_code ?? selection.pspCode
                      ? ` · ${activeChat.data?.psp_code ?? selection.pspCode}`
                      : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${conversationStatus === "closed" ? "bg-muted text-muted-foreground" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"}`}
                >
                  {conversationStatus ?? "new"}
                </span>
                {isAdmin && conversationStatus && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updateStatus.isPending}
                    onClick={() =>
                      updateStatus.mutate({
                        kind: selection.kind,
                        id: selection.id,
                        action: conversationStatus === "closed" ? "reopen" : "close",
                      })
                    }
                  >
                    {conversationStatus === "closed" ? "Reopen" : "Close chat"}
                  </Button>
                )}
              </div>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              {activeChat.isLoading ? (
                <div className="space-y-4" aria-busy="true">
                  <Skeleton className="h-16 w-3/4" />
                  <Skeleton className="ml-auto h-14 w-2/3" />
                  <Skeleton className="h-20 w-3/4" />
                </div>
              ) : activeChat.isError ? (
                <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                  Could not open this request conversation. Check the request
                  ID and type, then try again.
                </p>
              ) : activeChat.data?.messages.length ? (
                activeChat.data.messages.map((message) => {
                  const ownMessage = message.sender_role === user?.role;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${ownMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[85%] sm:max-w-[75%]">
                        <p
                          className={`mb-1 text-[11px] text-muted-foreground ${ownMessage ? "text-right" : ""}`}
                        >
                          {message.sender_name} · {formatDate(message.created_at)}
                        </p>
                        <p
                          className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${ownMessage ? "rounded-tr-md bg-primary text-primary-foreground" : "rounded-tl-md border border-border bg-muted/70 text-foreground"}`}
                        >
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
                      Your first message will open this request’s chat.
                    </p>
                  </div>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            {conversationStatus === "closed" && (
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
                disabled={!canSend || sendMessage.isPending || activeChat.isError}
                aria-label="Message"
                className="min-h-10 flex-1 resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Send message"
                disabled={!canSend || !draft.trim() || sendMessage.isPending || activeChat.isError}
              >
                <Send className="size-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center p-8 text-center">
            <div className="max-w-sm">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <MessageCircle className="size-6" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">Request support</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Choose a conversation or enter a deposit or withdrawal ID to
                message its PSP team.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
