import { ArrowDownToLine } from "lucide-react";
import { RequestsTable } from "@/components/requests/requests-table";
export default function DepositsPage() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div>
        <h1 className="mt-1 flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <ArrowDownToLine className="size-5" />
          </span>
          Deposits
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review client funding requests and confirm incoming payments.
        </p>
      </div>
      <RequestsTable kind="deposit" />
    </div>
  );
}
