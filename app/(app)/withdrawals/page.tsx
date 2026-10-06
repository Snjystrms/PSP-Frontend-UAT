import { ArrowUpFromLine } from "lucide-react";
import { RequestsTable } from "@/components/requests/requests-table";
export default function WithdrawalsPage() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div>
        <h1 className="mt-1 flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <ArrowUpFromLine className="size-5" />
          </span>
          Withdrawals
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review payout requests and confirm destination accounts.
        </p>
      </div>
      <RequestsTable kind="withdrawal" />
    </div>
  );
}
