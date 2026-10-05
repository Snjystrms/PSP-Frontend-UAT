import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuditSystemPanel } from "@/components/admin/audit-system-panel";

export default async function AuditPage() {
  const session = await auth();
  if (session?.user.role !== "admin") redirect("/dashboard");
  return <div className="mx-auto max-w-[1440px] space-y-6"><div><p className="text-sm text-muted-foreground">Operations and compliance</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Audit & system</h1><p className="mt-2 text-sm text-muted-foreground">Service readiness, callback delivery, signed callback verification, and audit history.</p></div><AuditSystemPanel /></div>;
}
