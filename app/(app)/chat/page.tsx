import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <section className="grid min-h-[420px] place-items-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="max-w-md">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <MessageCircle className="size-6" />
          </span>
          <h2 className="mt-5 text-xl font-semibold">
            Support chat isn’t connected yet
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The payment backend does not currently provide a chat endpoint, so
            this workspace won’t show sample conversations as if they were live.
            You can review the latest payment requests below.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/deposits">
                <ArrowDownToLine className="mr-2 size-4" />
                Review deposits
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/withdrawals">
                <ArrowUpFromLine className="mr-2 size-4" />
                Review withdrawals
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
