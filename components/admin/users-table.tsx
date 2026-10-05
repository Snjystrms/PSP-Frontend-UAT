"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, LockKeyhole, Plus, ShieldCheck, UserRound, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreatePortalUser, usePortalUsers, useUpdatePortalUser } from "@/lib/queries/admin";
import { usePsps } from "@/lib/queries/psps";
import type { PortalUser } from "@/lib/api/backend";

export function UsersTable({ currentUserId }: { currentUserId: number }) {
  const psps = usePsps();
  const [filterPspCode, setFilterPspCode] = useState("");
  const users = usePortalUsers(filterPspCode || undefined);
  const create = useCreatePortalUser();
  const update = useUpdatePortalUser();
  const [creating, setCreating] = useState(false);
  const [newRole, setNewRole] = useState<"admin" | "psp">("psp");
  const [editing, setEditing] = useState<PortalUser | null>(null);
  const [passwordUser, setPasswordUser] = useState<PortalUser | null>(null);

  function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const role = newRole;
    create.mutate({
      email: String(form.get("email")).trim(),
      full_name: String(form.get("full_name")).trim(),
      password: String(form.get("password")),
      role,
      ...(role === "psp" ? { psp_code: String(form.get("psp_code")) } : {}),
    }, { onSuccess: () => setCreating(false) });
  }

  function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    update.mutate({ id: editing.id, payload: { full_name: String(form.get("full_name")).trim() } }, { onSuccess: () => setEditing(null) });
  }

  function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordUser) return;
    const form = new FormData(event.currentTarget);
    update.mutate({ id: passwordUser.id, payload: { password: String(form.get("password")) } }, { onSuccess: () => setPasswordUser(null) });
  }

  return <>
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Portal users</h2><p className="mt-1 text-sm text-muted-foreground">Manage admin and PSP logins, password resets, account access, and login lockouts.</p></div><div className="flex gap-2"><select aria-label="Filter users by PSP" value={filterPspCode} onChange={(event) => setFilterPspCode(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="">All users</option>{psps.data?.map((psp) => <option key={psp.psp_code} value={psp.psp_code}>{psp.psp_name}</option>)}</select><Button size="sm" onClick={() => setCreating(true)}><Plus className="mr-2 size-4" />Add user</Button></div></div>
      {users.isError ? <div className="p-8 text-center"><p className="font-medium">Couldn’t load portal users</p><p className="mt-1 text-sm text-muted-foreground">{users.error instanceof Error ? users.error.message : "Backend unavailable"}</p><Button variant="outline" size="sm" className="mt-3" onClick={() => void users.refetch()}>Retry</Button></div> : <div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left text-sm"><thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr>{["User", "Role", "PSP", "Access", "Last login", "Actions"].map((item) => <th key={item} className="px-4 py-3 font-medium">{item}</th>)}</tr></thead><tbody className="divide-y divide-border">{users.isLoading ? <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">Loading users…</td></tr> : users.data?.map((user) => <tr key={user.id} className="hover:bg-muted/20"><td className="px-4 py-4"><span className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><UserRound className="size-4" /></span><span><span className="block font-medium">{user.full_name}</span><span className="text-xs text-muted-foreground">{user.email}</span></span></span></td><td className="px-4 py-4 capitalize">{user.role}</td><td className="px-4 py-4 font-mono text-xs text-muted-foreground">{user.psp_code ?? "—"}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs ${user.is_active ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>{user.is_active ? "Active" : "Inactive"}</span>{user.locked_until && <span className="ml-2 inline-flex items-center gap-1 text-xs text-rose-600"><LockKeyhole className="size-3" />Locked</span>}</td><td className="px-4 py-4 text-xs text-muted-foreground">{user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Never"}</td><td className="px-4 py-4"><div className="flex gap-1"><Button size="icon-sm" variant="ghost" title="Edit display name" aria-label={`Edit ${user.email}`} onClick={() => setEditing(user)}><UserRound className="size-4" /></Button><Button size="icon-sm" variant="ghost" title="Reset password" aria-label={`Reset password for ${user.email}`} onClick={() => setPasswordUser(user)}><KeyRound className="size-4" /></Button>{user.locked_until && <Button size="icon-sm" variant="ghost" title="Unlock account" aria-label={`Unlock ${user.email}`} disabled={update.isPending} onClick={() => update.mutate({ id: user.id, payload: { unlock: true } })}><ShieldCheck className="size-4" /></Button>}<Button size="icon-sm" variant="ghost" title={user.is_active ? "Deactivate" : "Activate"} aria-label={`${user.is_active ? "Deactivate" : "Activate"} ${user.email}`} disabled={update.isPending || (user.id === currentUserId && user.is_active)} onClick={() => update.mutate({ id: user.id, payload: { is_active: !user.is_active } })}>{user.is_active ? <UserRoundX className="size-4 text-destructive" /> : <ShieldCheck className="size-4" />}</Button></div></td></tr>)}</tbody></table></div>}
      <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">{users.data?.length ?? 0} account{users.data?.length === 1 ? "" : "s"} · deactivate to revoke sign-in access</div>
    </section>

    <Dialog open={creating} onOpenChange={(open) => { setCreating(open); if (open) setNewRole("psp"); }}><DialogContent><DialogHeader><DialogTitle>Create portal user</DialogTitle><DialogDescription>PSP users can review transactions for the selected partner only.</DialogDescription></DialogHeader><form id="create-user" className="grid gap-4" onSubmit={createUser}><label className="grid gap-1.5 text-sm font-medium">Full name<Input name="full_name" required maxLength={200} /></label><label className="grid gap-1.5 text-sm font-medium">Email<Input name="email" type="email" required /></label><label className="grid gap-1.5 text-sm font-medium">Password<Input name="password" type="password" required minLength={10} maxLength={72} /></label><label className="grid gap-1.5 text-sm font-medium">Role<select name="role" value={newRole} onChange={(event) => setNewRole(event.target.value as "admin" | "psp")} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="psp">PSP user</option><option value="admin">Administrator</option></select></label>{newRole === "psp" && <label className="grid gap-1.5 text-sm font-medium">PSP code<select name="psp_code" required className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="">Select partner</option>{psps.data?.map((psp) => <option key={psp.psp_code} value={psp.psp_code}>{psp.psp_name} ({psp.psp_code})</option>)}</select></label>}</form><DialogFooter><Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button><Button type="submit" form="create-user" disabled={create.isPending}>{create.isPending ? "Creating…" : "Create user"}</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }}><DialogContent><DialogHeader><DialogTitle>Edit user name</DialogTitle><DialogDescription>{editing?.email}</DialogDescription></DialogHeader><form id="edit-user" onSubmit={saveName}><label className="grid gap-1.5 text-sm font-medium">Full name<Input name="full_name" required minLength={1} maxLength={200} defaultValue={editing?.full_name} /></label></form><DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" form="edit-user" disabled={update.isPending}>Save name</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={Boolean(passwordUser)} onOpenChange={(open) => { if (!open) setPasswordUser(null); }}><DialogContent><DialogHeader><DialogTitle>Reset password</DialogTitle><DialogDescription>Set a new password for {passwordUser?.email}. The backend requires at least 10 characters.</DialogDescription></DialogHeader><form id="reset-password" onSubmit={resetPassword}><label className="grid gap-1.5 text-sm font-medium">New password<Input name="password" type="password" required minLength={10} maxLength={72} /></label></form><DialogFooter><Button variant="outline" onClick={() => setPasswordUser(null)}>Cancel</Button><Button type="submit" form="reset-password" disabled={update.isPending}>Reset password</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
