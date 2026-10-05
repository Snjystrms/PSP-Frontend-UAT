"use client";

import { useState, type FormEvent } from "react";
import { toast } from "@/components/ui/toast";
import { Building2, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { useAuthUser } from "@/components/auth/auth-user-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useChangeCurrentPassword } from "@/lib/queries/profile";

export function ProfilePage() {
  const user = useAuthUser();
  const changePassword = useChangeCurrentPassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const initials = user?.name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "U";
  const profileItems = [
    { label: "Full name", value: user?.name, Icon: UserRound },
    { label: "Email", value: user?.email, Icon: KeyRound },
    { label: "Role", value: user?.role, Icon: ShieldCheck },
    ...(user?.pspCode ? [{ label: "PSP partner", value: user.pspCode, Icon: Building2 }] : []),
    { label: "Account ID", value: user?.id || "—", Icon: UserRound },
  ];

  function submitPasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("The new passwords do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      toast.error("Choose a new password that differs from your current password.");
      return;
    }
    changePassword.mutate({ current_password: currentPassword, new_password: newPassword }, {
      onSuccess: () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      setChangePasswordOpen(false);
      },
    });
  }

  return <div className="mx-auto w-full max-w-5xl space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-semibold tracking-tight">My profile</h1><p className="mt-1 text-sm text-muted-foreground">Your account details and security settings.</p></div><Button onClick={() => setChangePasswordOpen(true)}><KeyRound className="size-4" />Change password</Button></div>

    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border bg-gradient-to-r from-primary/[.08] via-transparent to-transparent p-6 sm:flex-row sm:items-center">
        <Avatar className="size-14 shrink-0"><AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">{initials}</AvatarFallback></Avatar>
        <div className="min-w-0 flex-1"><p className="truncate text-lg font-semibold">{user?.name}</p><p className="truncate text-sm text-muted-foreground">{user?.email}</p></div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold capitalize text-primary"><ShieldCheck className="size-3.5" />{user?.role} account</span>
      </div>
      <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
        {profileItems.map(({ label, value, Icon }) => <div key={label} className="min-w-0 rounded-xl border border-border bg-background/50 p-4"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Icon className="size-4 shrink-0" />{label}</div><p className={`mt-2 truncate text-sm font-medium ${label === "Role" ? "capitalize" : ""}`}>{value}</p></div>)}
      </div>
    </section>

    <Dialog open={changePasswordOpen} onOpenChange={(open) => { if (!changePassword.isPending) setChangePasswordOpen(open); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Change password</DialogTitle><DialogDescription>Enter your current password and choose a new one between 10 and 72 characters.</DialogDescription></DialogHeader>
        <form id="change-password" className="grid gap-4" onSubmit={submitPasswordChange}>
          <label className="grid gap-1.5 text-sm font-medium">Current password<Input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></label>
          <label className="grid gap-1.5 text-sm font-medium">New password<Input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={10} maxLength={72} required /></label>
          <label className="grid gap-1.5 text-sm font-medium">Confirm new password<Input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={10} maxLength={72} required /></label>
        </form>
        <DialogFooter><Button type="button" variant="outline" onClick={() => setChangePasswordOpen(false)} disabled={changePassword.isPending}>Cancel</Button><Button type="submit" form="change-password" disabled={changePassword.isPending}>{changePassword.isPending ? "Updating…" : "Update password"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
