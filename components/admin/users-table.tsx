"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  KeyRound,
  LockKeyhole,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserRound,
  UserRoundX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SerialNumberCell } from "@/components/ui/serial-number-cell";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCreatePortalUser,
  usePortalUsers,
  useUpdatePortalUser,
} from "@/lib/queries/admin";
import { usePsps } from "@/lib/queries/psps";
import type { PortalUser } from "@/lib/api/backend";

export function UsersTable({ currentUserId }: { currentUserId: number }) {
  const psps = usePsps();
  const [filterPspCode, setFilterPspCode] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const users = usePortalUsers(filterPspCode || undefined);
  const visibleUsers = useMemo(
    () =>
      (users.data ?? []).slice(
        pageIndex * pageSize,
        (pageIndex + 1) * pageSize,
      ),
    [users.data, pageIndex, pageSize],
  );
  const create = useCreatePortalUser();
  const update = useUpdatePortalUser();
  const [creating, setCreating] = useState(false);
  const [newRole, setNewRole] = useState<"admin" | "psp">("psp");
  const [newPspCode, setNewPspCode] = useState("");
  const [editing, setEditing] = useState<PortalUser | null>(null);
  const [passwordUser, setPasswordUser] = useState<PortalUser | null>(null);

  function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const role = newRole;
    create.mutate(
      {
        email: String(form.get("email")).trim(),
        full_name: String(form.get("full_name")).trim(),
        password: String(form.get("password")),
        role,
        ...(role === "psp" ? { psp_code: newPspCode } : {}),
      },
      { onSuccess: () => setCreating(false) },
    );
  }

  function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    update.mutate(
      {
        id: editing.id,
        payload: {
          full_name: String(form.get("full_name")).trim(),
          is_active: form.get("is_active") === "on",
          unlock: form.get("unlock") === "on",
          ...(password ? { password } : {}),
        },
      },
      { onSuccess: () => setEditing(null) },
    );
  }

  function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordUser) return;
    const form = new FormData(event.currentTarget);
    update.mutate(
      {
        id: passwordUser.id,
        payload: { password: String(form.get("password")) },
      },
      { onSuccess: () => setPasswordUser(null) },
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Select
              value={filterPspCode || "all"}
              onValueChange={(value) => {
                setFilterPspCode(value === "all" ? "" : value);
                setPageIndex(0);
              }}
            >
              <SelectTrigger aria-label="Filter users by PSP" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {psps.data?.map((psp) => (
                <SelectItem key={psp.psp_code} value={psp.psp_code}>
                  {psp.psp_name}
                </SelectItem>
              ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void Promise.all([users.refetch(), psps.refetch()])}
            >
              <RefreshCw className="mr-2 size-3.5" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="mr-2 size-4" />
              Add user
            </Button>
          </div>
        </div>
        {users.isError ? (
          <div className="p-8 text-center">
            <p className="font-medium">Couldn’t load portal users</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {users.error instanceof Error
                ? users.error.message
                : "Backend unavailable"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void users.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  {[
                    "Sr. No.",
                    "User",
                    "Role",
                    "PSP",
                    "Access",
                    "Last login",
                    "Actions",
                  ].map((item, index) => (
                    <th
                      key={item}
                      className={
                        index === 0
                          ? "w-20 whitespace-nowrap px-4 py-3 font-medium"
                          : "px-4 py-3 font-medium"
                      }
                    >
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.isLoading ? (
                  <TableSkeletonRows columns={7} />
                ) : (
                  visibleUsers.map((user, index) => (
                    <tr key={user.id} className="hover:bg-muted/20">
                      <td className="px-4 py-4">
                        <SerialNumberCell
                          serialNumber={pageIndex * pageSize + index + 1}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <span className="flex items-center gap-3">
                          <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                            <UserRound className="size-4" />
                          </span>
                          <span>
                            <span className="block font-medium">
                              {user.full_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-4 capitalize">{user.role}</td>
                      <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                        {user.psp_code ?? "—"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs ${user.is_active ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                        {user.locked_until && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-rose-600">
                            <LockKeyhole className="size-3" />
                            Locked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        {user.last_login_at
                          ? new Date(user.last_login_at).toLocaleString()
                          : "Never"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            title="Edit display name"
                            aria-label={`Edit ${user.email}`}
                            onClick={() => setEditing(user)}
                          >
                            <UserRound className="size-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            title="Reset password"
                            aria-label={`Reset password for ${user.email}`}
                            onClick={() => setPasswordUser(user)}
                          >
                            <KeyRound className="size-4" />
                          </Button>
                          {user.locked_until && (
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              title="Unlock account"
                              aria-label={`Unlock ${user.email}`}
                              disabled={update.isPending}
                              onClick={() =>
                                update.mutate({
                                  id: user.id,
                                  payload: { unlock: true },
                                })
                              }
                            >
                              <ShieldCheck className="size-4" />
                            </Button>
                          )}
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            title={user.is_active ? "Deactivate" : "Activate"}
                            aria-label={`${user.is_active ? "Deactivate" : "Activate"} ${user.email}`}
                            disabled={
                              update.isPending ||
                              (user.id === currentUserId && user.is_active)
                            }
                            onClick={() =>
                              update.mutate({
                                id: user.id,
                                payload: { is_active: !user.is_active },
                              })
                            }
                          >
                            {user.is_active ? (
                              <UserRoundX className="size-4 text-destructive" />
                            ) : (
                              <ShieldCheck className="size-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <TablePagination
          total={users.data?.length ?? 0}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageChange={setPageIndex}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPageIndex(0);
          }}
        />
      </section>

      <Dialog
        open={creating}
        onOpenChange={(open) => {
          setCreating(open);
          if (open) {
            setNewRole("psp");
            setNewPspCode("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create portal user</DialogTitle>
            <DialogDescription>
              PSP users can review transactions for the selected partner only.
            </DialogDescription>
          </DialogHeader>
          <form id="create-user" className="grid gap-4" onSubmit={createUser}>
            <label className="grid gap-1.5 text-sm font-medium">
              Full name
              <Input name="full_name" placeholder="e.g. Asha Sharma" required maxLength={200} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Email
              <Input name="email" type="email" placeholder="name@company.com" required />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Password
              <PasswordInput
                name="password"
                required
                minLength={10}
                maxLength={72}
                placeholder="At least 10 characters"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Role
              <Select
                value={newRole}
                onValueChange={(value) =>
                  setNewRole(value as "admin" | "psp")
                }
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="psp">PSP user</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </label>
            {newRole === "psp" && (
              <label className="grid gap-1.5 text-sm font-medium">
                PSP code
                <Select
                  name="psp_code"
                  required
                  value={newPspCode}
                  onValueChange={setNewPspCode}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select partner" /></SelectTrigger>
                  <SelectContent>
                  {psps.data?.map((psp) => (
                    <SelectItem key={psp.psp_code} value={psp.psp_code}>
                      {psp.psp_name} ({psp.psp_code})
                    </SelectItem>
                  ))}
                  </SelectContent>
                </Select>
              </label>
            )}
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-user"
              disabled={create.isPending}
            >
              {create.isPending ? "Creating…" : "Create user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit portal user</DialogTitle>
            <DialogDescription>
              {editing?.email} · Update profile, access, password, or sign-in
              lockout.
            </DialogDescription>
          </DialogHeader>
          <form
            key={editing?.id}
            id="edit-user"
            className="grid gap-4"
            onSubmit={saveUser}
          >
            <label className="grid gap-1.5 text-sm font-medium">
              Full name
              <Input
                name="full_name"
                required
                minLength={1}
                maxLength={200}
                defaultValue={editing?.full_name}
                placeholder="Enter the user's full name"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              New password{" "}
              <span className="font-normal text-muted-foreground">
                (leave blank to keep current password)
              </span>
              <PasswordInput
                name="password"
                minLength={10}
                maxLength={72}
                autoComplete="new-password"
                placeholder="Leave blank to keep the current password"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                name="is_active"
                type="checkbox"
                defaultChecked={editing?.is_active}
                disabled={
                  editing?.id === currentUserId && editing?.is_active === true
                }
                className="size-4 accent-primary"
              />
              Account active
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                name="unlock"
                type="checkbox"
                className="size-4 accent-primary"
              />
              Clear failed-login lockout
            </label>
          </form>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditing(null)}
              disabled={update.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" form="edit-user" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(passwordUser)}
        onOpenChange={(open) => {
          if (!open) setPasswordUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Set a new password for {passwordUser?.email}. The backend requires
              at least 10 characters.
            </DialogDescription>
          </DialogHeader>
          <form id="reset-password" onSubmit={resetPassword}>
            <label className="grid gap-1.5 text-sm font-medium">
              New password
              <PasswordInput
                name="password"
                required
                minLength={10}
                maxLength={72}
                placeholder="At least 10 characters"
              />
            </label>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordUser(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="reset-password"
              disabled={update.isPending}
            >
              Reset password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
