import { redirect } from "next/navigation";
import { Activity } from "lucide-react";
import { auth } from "@/lib/auth";
import { AuditSystemPanel } from "@/components/admin/audit-system-panel";

export default async function AuditPage() {
  const session = await auth();
  if (session?.user.role !== "admin") redirect("/dashboard");
  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          <span className="mr-3 inline-grid size-10 place-items-center rounded-xl bg-primary/10 align-middle text-primary">
            <Activity className="size-5" />
          </span>
          Audit & system
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Service readiness, callback delivery, signed callback verification,
          and audit history.
        </p>
      </div>
      <AuditSystemPanel />
    </div>
  );
}
