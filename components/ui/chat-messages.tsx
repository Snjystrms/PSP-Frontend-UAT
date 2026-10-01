"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { Send, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface ChatMessagesProps {
  messages?: ChatMessage[];
  autoPlay?: boolean;
  autoPlayDelay?: number;
  typingDuration?: number;
  showReplay?: boolean;
  interactive?: boolean;
  className?: string;
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  { id: "1", sender: "assistant", content: "Welcome to Vaspan support. How can I help with your payment operations today?" },
  { id: "2", sender: "user", content: "A client’s withdrawal is taking longer than expected." },
  { id: "3", sender: "assistant", content: "I can help with that. Check the request status and destination account verification first. Bank transfers can take 1–2 business days after approval." },
];

function TypingIndicator({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "inline-flex items-center gap-1 rounded-2xl rounded-tl-md border border-border bg-muted px-4 py-3",
        className,
      )}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-primary/70"
          animate={{ opacity: [0.4, 1, 0.4], y: [0, -4, 0] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  );
}

function MessageBubble({
  message,
  isLast,
}: {
  message: ChatMessage;
  isLast?: boolean;
}) {
  const isUser = message.sender === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div className={cn("flex items-end gap-2", isUser && "flex-row-reverse")}>
        {!isUser && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
            <Sparkles className="size-4 text-primary" />
          </div>
        )}
        <motion.div
          layout
          className={cn(
            "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-md bg-primary text-primary-foreground shadow-[0_8px_24px_-4px_color-mix(in_srgb,var(--primary)_35%,transparent)]"
              : "rounded-tl-md border border-border bg-muted/70 text-foreground shadow-sm",
          )}
          whileHover={{ scale: 1.01, y: -1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {message.content}
        </motion.div>
      </div>
    </motion.div>
  );
}

export function ChatMessages({
  messages = DEFAULT_MESSAGES,
  autoPlay = true,
  autoPlayDelay = 1800,
  typingDuration = 1400,
  showReplay = true,
  interactive = false,
  className,
}: ChatMessagesProps) {
  const [visibleCount, setVisibleCount] = useState(autoPlay ? 0 : messages.length);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(messages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAutoPlaying = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  const revealNext = useCallback(
    async (index: number) => {
      if (index >= chatMessages.length) {
        isAutoPlaying.current = false;
        return;
      }

      const message = chatMessages[index];

      if (message.sender === "assistant") {
        setIsTyping(true);
        await new Promise((r) => setTimeout(r, typingDuration));
        setIsTyping(false);
      }

      setVisibleCount(index + 1);
      await new Promise((r) => setTimeout(r, 100));
      scrollToBottom();

      await new Promise((r) => setTimeout(r, autoPlayDelay - (message.sender === "assistant" ? typingDuration : 0) - 100));

      if (isAutoPlaying.current) {
        revealNext(index + 1);
      }
    },
    [chatMessages, autoPlayDelay, typingDuration, scrollToBottom],
  );

  const replay = useCallback(() => {
    setVisibleCount(0);
    setChatMessages(messages);
    isAutoPlaying.current = true;
    setTimeout(() => revealNext(0), 100);
  }, [messages, revealNext]);

  useEffect(() => {
    setChatMessages(messages);
    if (autoPlay) {
      setVisibleCount(0);
      isAutoPlaying.current = true;
      const timer = setTimeout(() => revealNext(0), 500);
      return () => {
        clearTimeout(timer);
        isAutoPlaying.current = false;
      };
    } else {
      setVisibleCount(messages.length);
    }
  }, [messages, autoPlay, revealNext]);

  useEffect(() => {
    scrollToBottom();
  }, [visibleCount, isTyping, scrollToBottom]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || !interactive) return;

    const newMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      content: inputValue.trim(),
    };

    setChatMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setVisibleCount((prev) => prev + 1);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const assistantReply: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        content: newMessage.content.toLowerCase().includes("withdraw")
          ? "Open Withdrawals to review the request status and verified destination account. After approval, bank transfers usually take 1–2 business days to settle."
          : newMessage.content.toLowerCase().includes("deposit")
            ? "Open Deposits to check the reference and review the incoming payment. Pending requests can be approved or rejected from the request row."
            : "I can help with that. Check the request queue for its latest status, reference, and any account verification notes.",
      };
      setChatMessages((prev) => [...prev, assistantReply]);
      setVisibleCount((prev) => prev + 1);
    }, typingDuration + 500);
  }, [inputValue, interactive, typingDuration]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
      <div
        className={cn(
        "ib-portal-metric relative flex min-h-0 flex-col overflow-hidden rounded-2xl bg-card shadow-sm",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Vaspan support</h3>
            <p className="text-xs text-muted-foreground">Payment operations assistant</p>
          </div>
        </div>
        {showReplay && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={replay}
            aria-label="Replay conversation"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <RotateCcw className="size-3.5" />
            Replay
          </motion.button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        className="flex-1 space-y-3 overflow-y-auto bg-background/45 p-4"
      >
        {chatMessages.slice(0, visibleCount).map((message, i) => (
          <MessageBubble
            key={message.id}
            message={message}
            isLast={i === visibleCount - 1}
          />
        ))}

        <AnimatePresence>
          {isTyping && <TypingIndicator />}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!interactive}
            placeholder={interactive ? "Ask Vaspan support..." : "Demo mode - replay to watch again"}
            aria-label={interactive ? "Type your message" : "Chat input (demo mode)"}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleSend}
            disabled={!interactive || !inputValue.trim()}
            aria-label="Send message"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              interactive && inputValue.trim()
                ? "bg-primary text-primary-foreground hover:brightness-110"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Send className="size-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
