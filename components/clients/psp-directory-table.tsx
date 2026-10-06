"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Building2,
  Clipboard,
  Pencil,
  Plus,
  RefreshCw,
  RotateCw,
  Trash2,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SerialNumberCell } from "@/components/ui/serial-number-cell";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSkeletonRows } from "@/components/ui/table-skeleton-rows";
import {
  useCreatePsp,
  useDeletePsp,
  usePsps,
  useRotatePspCredentials,
  useUpdatePsp,
} from "@/lib/queries/psps";
import {
  fetchPsp,
  type BackendPsp,
  type PspCreated,
  type PspCredentials,
} from "@/lib/api/backend";

const optional = (value: FormDataEntryValue | null) =>
  String(value ?? "").trim();
const dateValue = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "—";

function CopyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all rounded-lg border border-border bg-muted/60 p-3 text-xs">
          {value}
        </code>
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={`Copy ${label}`}
          onClick={() => {
            void navigator.clipboard
              .writeText(value)
              .then(() => toast.success(`${label} copied.`))
              .catch(() => toast.error("Clipboard access is unavailable."));
          }}
        >
          <Clipboard className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function PspDirectoryTable() {
  const { data = [], isLoading, isError, refetch } = usePsps();
  const create = useCreatePsp();
  const update = useUpdatePsp();
  const remove = useDeletePsp();
  const rotate = useRotatePspCredentials();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<BackendPsp | null>(null);
  const [credentials, setCredentials] = useState<{
    owner: string;
    code: string;
    loginEmail?: string;
    values: PspCredentials;
  } | null>(null);
  const [rotating, setRotating] = useState<BackendPsp | null>(null);
  const [deleting, setDeleting] = useState<BackendPsp | null>(null);
  const [graceHours, setGraceHours] = useState("");
  const [rotateSalt, setRotateSalt] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const visibleRows = useMemo(
    () => data.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [data, pageIndex, pageSize],
  );

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  async function openEdit(psp: BackendPsp) {
    try {
      setEditing(await fetchPsp(psp.psp_code));
      setEditorOpen(true);
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause
          : "Could not load PSP configuration.",
      );
    }
  }

  function submitEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const common = {
      psp_name: String(form.get("psp_name") ?? "").trim(),
      account_number: String(form.get("account_number") ?? "").trim(),
      ifsc_code: optional(form.get("ifsc_code")),
      contact_email: optional(form.get("contact_email")),
    };

    if (editing) {
      const status = String(form.get("status")) as "active" | "inactive";
      update.mutate(
        {
          code: editing.psp_code,
          payload: {
            psp_name: common.psp_name,
            account_number: common.account_number,
            ifsc_code: common.ifsc_code || null,
            contact_email: common.contact_email || null,
            status,
          },
        },
        { onSuccess: () => setEditorOpen(false) },
      );
      return;
    }

    create.mutate(
      {
        psp_name: common.psp_name,
        account_number: common.account_number,
        ...(common.ifsc_code ? { ifsc_code: common.ifsc_code } : {}),
        ...(common.contact_email
          ? { contact_email: common.contact_email }
          : {}),
        login_email: String(form.get("login_email") ?? "").trim(),
        login_password: String(form.get("login_password") ?? ""),
      },
      {
        onSuccess: (result: PspCreated) => {
          setCredentials({
            owner: result.psp.psp_name,
            code: result.psp.psp_code,
            loginEmail: result.portal_login.email,
            values: result.credentials,
          });
          setEditorOpen(false);
        },
      },
    );
  }

  function clearCredentials() {
    setCredentials(null);
    create.reset();
    rotate.reset();
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              <RefreshCw className="mr-2 size-3.5" />
              Refresh
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              Add PSP
            </Button>
          </div>
        </div>
        {isError ? (
          <div className="p-10 text-center">
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  {[
                    "Sr. No.",
                    "Partner",
                    "Status",
                    "Settlement account",
                    "IFSC",
                    "Contact",
                    "Token expires",
                    "Credentials rotated",
                    "Actions",
                  ].map((heading, index) => (
                    <th
                      key={heading}
                      className={
                        index === 0
                          ? "w-20 whitespace-nowrap px-4 py-3 font-medium"
                          : "px-4 py-3 font-medium"
                      }
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <TableSkeletonRows columns={9} />
                ) : (
                  visibleRows.map((psp, index) => (
                    <tr
                      key={psp.psp_code}
                      className="transition-colors hover:bg-muted/25"
                    >
                      <td className="px-4 py-4">
                        <SerialNumberCell
                          serialNumber={pageIndex * pageSize + index + 1}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <span className="flex items-center gap-3">
                          <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                            <Building2 className="size-4" />
                          </span>
                          <span>
                            <span className="block font-medium">
                              {psp.psp_name}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {psp.psp_code}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${psp.status === "active" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}
                        >
                          {psp.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs">
                        {psp.account_number || "—"}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs">
                        {psp.ifsc_code || "—"}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {psp.contact_email || "—"}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {dateValue(psp.api_token_expires_at)}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {dateValue(psp.credentials_rotated_at)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${psp.psp_name}`}
                            title="Edit configuration"
                            onClick={() => void openEdit(psp)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Rotate credentials for ${psp.psp_name}`}
                            title="Rotate API credentials"
                            onClick={() => {
                              setRotating(psp);
                              setGraceHours("");
                              setRotateSalt(false);
                            }}
                          >
                            <RotateCw className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${psp.psp_name}`}
                            title="Delete PSP"
                            disabled={remove.isPending}
                            onClick={() => setDeleting(psp)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {!isLoading && data.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-12 text-center text-muted-foreground"
                    >
                      No PSP partners have been configured.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <TablePagination
          total={data.length}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageChange={setPageIndex}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPageIndex(0);
          }}
        />
      </section>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${editing.psp_name}` : "Create PSP partner"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the partner profile and settlement account."
                : "Creates the partner, API credentials, and its first portal login."}
            </DialogDescription>
          </DialogHeader>
          <form
            id="psp-editor"
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={submitEditor}
          >
            <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
              Partner name
              <Input
                name="psp_name"
                required
                minLength={1}
                maxLength={200}
                defaultValue={editing?.psp_name}
                placeholder="e.g. Acme Payments"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
              Settlement account number
              <Input
                name="account_number"
                required
                minLength={6}
                maxLength={34}
                pattern="[A-Za-z0-9]+"
                title="Use 6–34 letters or numbers without spaces."
                defaultValue={editing?.account_number ?? ""}
                placeholder="Settlement account number"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              IFSC code (optional)
              <Input
                name="ifsc_code"
                maxLength={11}
                placeholder="HDFC0001234"
                defaultValue={editing?.ifsc_code ?? ""}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Contact email (optional)
              <Input
                name="contact_email"
                type="email"
                defaultValue={editing?.contact_email ?? ""}
                placeholder="ops@company.com"
              />
            </label>
            {!editing && (
              <>
                <label className="grid gap-1.5 text-sm font-medium">
                  Portal login email
                  <Input name="login_email" type="email" placeholder="admin@partner.com" required />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  Portal login password
                  <PasswordInput
                    name="login_password"
                    required
                    minLength={10}
                    maxLength={72}
                    placeholder="At least 10 characters"
                  />
                </label>
              </>
            )}
            {editing && (
              <label className="grid gap-1.5 text-sm font-medium">
                Status
                <Select
                  name="status"
                  defaultValue={editing.status}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            )}
          </form>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditorOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="psp-editor"
              disabled={create.isPending || update.isPending}
            >
              {create.isPending || update.isPending
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : "Create PSP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(rotating)}
        onOpenChange={(open) => {
          if (!open && !rotate.isPending) setRotating(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rotate API credentials</DialogTitle>
            <DialogDescription>
              New token and secret are shown once. Store them securely; the old
              pair remains valid during the grace period.
            </DialogDescription>
          </DialogHeader>
          <label className="grid gap-1.5 text-sm font-medium">
            Old credential grace period
            <Input
              type="number"
              min={0}
              max={720}
              value={graceHours}
              onChange={(event) => setGraceHours(event.target.value)}
              placeholder="Backend default"
            />
            <span className="text-xs font-normal text-muted-foreground">
              Hours. Leave blank to use the backend’s configured default.
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={rotateSalt}
              onChange={(event) => setRotateSalt(event.target.checked)}
            />
            Rotate signature salt too
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRotating(null)}>
              Cancel
            </Button>
            <Button
              disabled={rotate.isPending}
              onClick={() => {
                if (!rotating) return;
                rotate.mutate(
                  {
                    code: rotating.psp_code,
                    grace_hours: graceHours.trim()
                      ? Number(graceHours)
                      : undefined,
                    rotate_salt: rotateSalt,
                  },
                  {
                    onSuccess: (values) => {
                      setCredentials({
                        owner: rotating.psp_name,
                        code: rotating.psp_code,
                        values,
                      });
                      setRotating(null);
                    },
                  },
                );
              }}
            >
              {rotate.isPending ? "Rotating…" : "Rotate credentials"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(credentials)}
        onOpenChange={(open) => {
          if (!open) clearCredentials();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Store credentials for {credentials?.owner}
            </DialogTitle>
            <DialogDescription>
              Partner code: {credentials?.code}.{" "}
              {credentials?.loginEmail
                ? `Portal login: ${credentials.loginEmail}. `
                : ""}
              These values cannot be retrieved after closing this dialog. Copy
              them to your secure credential store now.
            </DialogDescription>
          </DialogHeader>
          {credentials && (
            <div className="grid gap-3">
              <CopyValue
                label="API token"
                value={credentials.values.api_token}
              />
              <CopyValue
                label="API secret"
                value={credentials.values.api_secret}
              />
              <CopyValue
                label="Signature salt"
                value={credentials.values.signature_salt}
              />
              <p className="text-xs text-muted-foreground">
                Token expires{" "}
                {new Date(
                  credentials.values.api_token_expires_at,
                ).toLocaleString()}
                . {credentials.values.note}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={clearCredentials}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setDeleting(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete PSP partner?</DialogTitle>
            <DialogDescription>
              This will permanently delete {deleting?.psp_name} ({deleting?.psp_code}).
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={remove.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!deleting || remove.isPending}
              onClick={() => {
                if (!deleting) return;
                remove.mutate(deleting.psp_code, {
                  onSuccess: () => setDeleting(null),
                });
              }}
            >
              {remove.isPending ? "Deleting…" : "Delete partner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
