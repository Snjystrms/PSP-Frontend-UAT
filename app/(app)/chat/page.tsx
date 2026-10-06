import { MessageCircle } from "lucide-react";
import { SupportChat } from "@/components/chat/support-chat";

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <div>
        <h1 className="mt-1 flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <MessageCircle className="size-5" />
          </span>
          Support
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Find help with payment operations and request reviews.
        </p>
      </div>
      <SupportChat />
    </div>
  );
}
