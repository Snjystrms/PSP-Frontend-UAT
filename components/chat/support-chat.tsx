"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Check,
  CheckCheck,
  ChevronDown,
  File,
  FileText,
  Inbox,
  Loader2,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  X,
} from "lucide-react";
import { useAuthUser } from "@/components/auth/auth-user-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDirectChat,
  useDirectChats,
  useSendDirectChatMessage,
} from "@/lib/queries/chats";
import type { DirectChatMessage, DirectChatSummary } from "@/lib/api/backend";
import { cn } from "@/lib/utils";

const formatListStamp = (value: string) => {
  const date = new Date(value);
  const sameDay = date.toDateString() === new Date().toDateString();
  return new Intl.DateTimeFormat("en", sameDay
    ? { hour: "numeric", minute: "2-digit" }
    : { month: "short", day: "numeric" }).format(date);
};

const formatMessageTime = (value: string) =>
  new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(value));

const formatDayLabel = (value: string) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  }).format(date);
};

const formatBytes = (value: number | null | undefined) => {
  if (!value) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const previewText = (chat: DirectChatSummary) => {
  const last = chat.last_message;
  if (!last) return "No messages yet";
  if (last.message) return last.message;
  return last.attachment_name ? `Attachment: ${last.attachment_name}` : "Attachment";
};

function AttachmentCard({ message }: { message: DirectChatMessage }) {
  if (!message.attachment_url || !message.attachment_name) return null;
  const type = message.attachment_content_type ?? "";
  const isImage = type.startsWith("image/");
  const isPdf = type === "application/pdf";
  const size = formatBytes(message.attachment_size);
  return (
    <a
      href={message.attachment_url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-sm"
    >
      {isImage ? (
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={message.attachment_url}
            alt={message.attachment_name}
            fill
            unoptimized
            loading="lazy"
            className="object-cover"
          />
        </div>
      ) : (
        <span className="flex items-center gap-2.5 px-3 py-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
            {isPdf ? <FileText className="size-4" /> : <File className="size-4" />}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {message.attachment_name}
          </span>
          {size && (
            <span className="shrink-0 text-xs text-muted-foreground">{size}</span>
          )}
        </span>
      )}
      <span className="flex items-center justify-between gap-2 border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
        <span className="min-w-0 truncate">{message.attachment_name}</span>
        <span className="shrink-0 font-medium">{isImage ? "View" : isPdf ? "Open" : "Download"}</span>
      </span>
    </a>
  );
}

function MessageRow({
  message,
  own,
}: {
  message: DirectChatMessage;
  own: boolean;
}) {
  return (
    <div className={own ? "flex justify-end" : "flex justify-start"}>
      <div className={cn("max-w-[88%] sm:max-w-[72%]", own ? "items-end" : "items-start")}>
        {!own && (
          <p className="mb-1 px-1 text-[11px] text-muted-foreground">
            {message.sender_name}
            <span className="mx-1.5 text-muted-foreground/60">·</span>
            {formatMessageTime(message.created_at)}
          </p>
        )}
        <div
          className={cn(
            "overflow-hidden rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            own
              ? "rounded-tr-md bg-primary text-primary-foreground"
              : "rounded-tl-md border border-border bg-muted/60 text-foreground",
          )}
        >
          {message.message && (
            <p className="whitespace-pre-wrap break-words">{message.message}</p>
          )}
          <AttachmentCard message={message} />
        </div>
        {own && (
          <p className="mt-1 flex items-center justify-end gap-1 px-0.5 text-[11px] text-muted-foreground">
            {formatMessageTime(message.created_at)}
            <span
              className="inline-flex items-center text-primary/80"
              title={message.read_at ? "Read" : "Sent"}
            >
              {message.read_at ? (
                <CheckCheck className="size-3.5" />
              ) : (
                <Check className="size-3.5" />
              )}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

function ThreadLog({
  messages,
  isLoading,
  isError,
  partnerName,
  ownRole,
  onRetry,
}: {
  messages: DirectChatMessage[];
  isLoading: boolean;
  isError: boolean;
  partnerName: string;
  ownRole: "admin" | "psp";
  onRetry: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const [detached, setDetached] = useState(false);

  // Pin to the latest message when the user was already at the bottom.
  useEffect(() => {
    if (!isLoading && stickRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
    stickRef.current = nearBottom;
    setDetached(!nearBottom);
  };

  const jumpToLatest = () => {
    if (!scrollRef.current) return;
    stickRef.current = true;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    setDetached(false);
  };

  return (
    <div className="relative flex-1 overflow-hidden bg-background/40">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        role="log"
        aria-label={`Messages with ${partnerName}`}
        aria-live="polite"
        className="h-full overflow-y-auto"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-5 sm:px-6">
          {isLoading ? (
            <div className="space-y-4" aria-busy="true">
              <Skeleton className="h-12 w-2/3 rounded-2xl" />
              <Skeleton className="ml-auto h-16 w-1/2 rounded-2xl" />
              <Skeleton className="h-20 w-3/5 rounded-2xl" />
            </div>
          ) : isError ? (
            <div className="grid place-items-center gap-3 py-16 text-center">
              <p className="max-w-sm text-sm text-muted-foreground">
                Could not load this thread.
              </p>
              <Button variant="outline" size="sm" onClick={onRetry}>
                Try again
              </Button>
            </div>
          ) : messages.length ? (
            messages.map((message, index) => {
              const prev = messages[index - 1];
              const newDay = !prev ||
                new Date(message.created_at).toDateString() !==
                  new Date(prev.created_at).toDateString();
              return (
                <div key={message.id} className="grid gap-4">
                  {newDay && (
                    <p className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
                      <span className="h-px flex-1 bg-border" />
                      <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5">
                        {formatDayLabel(message.created_at)}
                      </span>
                      <span className="h-px flex-1 bg-border" />
                    </p>
                  )}
                  <MessageRow message={message} own={message.sender_role === ownRole} />
                </div>
              );
            })
          ) : (
            <div className="grid min-h-64 place-items-center text-center">
              <div className="max-w-sm">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                  <Building2 className="size-5" />
                </span>
                <p className="mt-3 font-medium">No messages yet</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Start the conversation with {partnerName}. Your first message
                  opens the thread.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {detached && (
        <button
          type="button"
          onClick={jumpToLatest}
          className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-muted"
        >
          <ChevronDown className="size-3.5" />
          Latest
        </button>
      )}
    </div>
  );
}

export function SupportChat() {
  const user = useAuthUser();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin";
  const ownRole = user?.role ?? "psp";
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [selection, setSelection] = useState<DirectChatSummary | null>(null);
  const [draft, setDraft] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const chatListFilters = useMemo(
    () => ({ unread: unreadOnly || undefined, limit: 200 }),
    [unreadOnly],
  );
  const chats = useDirectChats(chatListFilters);
  // A PSP login only ever has its own thread: fall back to it without storing.
  const activeThread = useMemo(() => {
    if (selection) return selection;
    if (isAdmin) return null;
    return chats.data?.items[0] ?? null;
  }, [selection, isAdmin, chats.data]);
  const activeChat = useDirectChat(activeThread?.psp_code ?? null);
  const sendMessage = useSendDirectChatMessage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const visibleChats = useMemo(() => {
    const query = chatSearch.trim().toLowerCase();
    if (!query) return chats.data?.items ?? [];
    return (chats.data?.items ?? []).filter(
      (chat) =>
        chat.psp_name.toLowerCase().includes(query) ||
        chat.psp_code.toLowerCase().includes(query),
    );
  }, [chats.data, chatSearch]);

  // Opening a thread marks it read server-side, so refresh inbox counts.
  useEffect(() => {
    const code = activeThread?.psp_code;
    if (code) void queryClient.invalidateQueries({ queryKey: ["direct-chats"] });
  }, [activeThread?.psp_code, queryClient]);

  function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setAttachmentFile(file);
    event.target.value = "";
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeThread) return;
    const message = draft.trim();
    if (!message && !attachmentFile) return;
    sendMessage.mutate(
      {
        pspCode: activeThread.psp_code,
        message: message || undefined,
        attachment: attachmentFile ?? undefined,
      },
      {
        onSuccess: () => {
          setDraft("");
          setAttachmentFile(null);
        },
      },
    );
  }

  const canSend = Boolean(activeThread) && !activeChat.isLoading && !activeChat.isError;

  return (
    <section className="grid min-h-[640px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid-cols-[340px_minmax(0,1fr)]">
      {/* -------- Inbox -------- */}
      <aside className="flex min-h-[440px] max-h-[70vh] flex-col border-b border-border lg:max-h-none lg:border-b-0 lg:border-r">
        <div className="space-y-3 border-b border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-semibold tracking-tight">Inbox</h2>
              <p className="text-xs text-muted-foreground">
                {chats.data?.total ?? 0} {unreadOnly ? "unread" : "conversations"}
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
              value={chatSearch}
              onChange={(event) => setChatSearch(event.target.value)}
              className="pl-9"
              placeholder="Search partners"
              aria-label="Search conversations"
            />
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/70 p-1">
            <button
              type="button"
              aria-pressed={!unreadOnly}
              onClick={() => setUnreadOnly(false)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                !unreadOnly
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              All
            </button>
            <button
              type="button"
              aria-pressed={unreadOnly}
              onClick={() => setUnreadOnly(true)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                unreadOnly
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Unread
            </button>
          </div>
        </div>

        <div className="min-h-40 flex-1 overflow-y-auto p-2">
          {chats.isLoading ? (
            <div className="space-y-2 p-1">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-[74px] w-full rounded-xl" />
              ))}
            </div>
          ) : chats.isError ? (
            <div className="grid place-items-center gap-3 p-8 text-center">
              <p className="text-sm text-muted-foreground">Could not load the inbox.</p>
              <Button variant="outline" size="sm" onClick={() => void chats.refetch()}>
                Try again
              </Button>
            </div>
          ) : visibleChats.length ? (
            <div className="space-y-1">
              {visibleChats.map((chat) => {
                const selected = activeThread?.psp_code === chat.psp_code;
                return (
                  <button
                    key={chat.psp_code}
                    type="button"
                    onClick={() => setSelection(chat)}
                    aria-pressed={selected}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors",
                      selected
                        ? "bg-primary/10 ring-1 ring-inset ring-primary/20"
                        : "hover:bg-muted/60",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl text-sm font-semibold",
                        selected
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {chat.psp_name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {chat.psp_name}
                        </span>
                        {chat.last_message && (
                          <time className="shrink-0 text-[11px] text-muted-foreground">
                            {formatListStamp(chat.last_message.created_at)}
                          </time>
                        )}
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate font-mono text-[11px] text-muted-foreground">
                          {chat.psp_code}
                        </span>
                        {chat.unread_count > 0 && (
                          <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                            {chat.unread_count}
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">
                        {previewText(chat)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid place-items-center gap-2 p-8 text-center">
              {chatSearch || unreadOnly ? (
                <p className="text-sm text-muted-foreground">
                  Nothing matches these filters.
                </p>
              ) : (
                <>
                  <Inbox className="size-7 text-muted-foreground/60" />
                  <p className="text-sm text-muted-foreground">No conversations yet.</p>
                </>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* -------- Conversation -------- */}
      <div className="flex min-h-[520px] min-w-0 flex-col">
        {activeThread ? (
          <>
            <header className="flex items-center gap-3 border-b border-border px-4 py-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                {activeThread.psp_name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-semibold tracking-tight">
                  {activeThread.psp_name}
                </h2>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {activeThread.psp_code}
                </p>
              </div>
              {/* <span className="ml-auto shrink-0 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                Direct chat
              </span> */}
            </header>

            <ThreadLog
              key={activeThread.psp_code}
              partnerName={activeThread.psp_name}
              ownRole={ownRole}
              messages={activeChat.data?.messages ?? []}
              isLoading={activeChat.isLoading}
              isError={activeChat.isError}
              onRetry={() => void activeChat.refetch()}
            />

            <form
              onSubmit={submitMessage}
              className="border-t border-border bg-card p-3 sm:p-4"
            >
              {attachmentFile && (
                <p className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                  <File className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium">
                    {attachmentFile.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatBytes(attachmentFile.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachmentFile(null)}
                    aria-label="Remove attachment"
                    className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </p>
              )}
              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={pickFile}
                  className="hidden"
                  aria-label="Choose a file to attach"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Attach a file"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="size-4" />
                </Button>
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
                  placeholder="Write a message…"
                  disabled={sendMessage.isPending}
                  aria-label="Message"
                  className="min-h-10 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Button
                  type="submit"
                  size="icon"
                  aria-label="Send message"
                  disabled={
                    sendMessage.isPending ||
                    (!draft.trim() && !attachmentFile) ||
                    !canSend
                  }
                >
                  {sendMessage.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </div>
              <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
                Enter to send, Shift + Enter for a new line.
              </p>
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center p-8 text-center">
            <div className="max-w-sm">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Building2 className="size-6" />
              </span>
              <h2 className="mt-4 text-lg font-semibold tracking-tight">
                {isAdmin ? "Partner direct chat" : "Your direct thread"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {isAdmin
                  ? "Choose a partner from the inbox to open the thread. Messages here are not tied to a single request."
                  : "Your message thread with the admin team sits in the inbox."}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}