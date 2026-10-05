"use client";

import { useState, type FormEvent } from "react";
import { Building2, Clipboard, FileText, KeyRound, Pencil, Plus, RefreshCw, RotateCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreatePsp, useDeletePsp, usePspQuestionnaire, usePsps, useRotatePspCredentials, useUpdatePsp } from "@/lib/queries/psps";
import { fetchPsp, type BackendPsp, type PspCreated, type PspCredentials } from "@/lib/api/backend";

const listValue = (value: FormDataEntryValue | null) => String(value ?? "").split(/[\n,]/).map((part) => part.trim()).filter(Boolean);
const optional = (value: FormDataEntryValue | null) => String(value ?? "").trim() || undefined;

function CopyValue({ label, value }: { label: string; value: string }) {
  return <div className="space-y-1.5"><p className="text-xs font-medium text-muted-foreground">{label}</p><div className="flex items-center gap-2"><code className="min-w-0 flex-1 break-all rounded-lg border border-border bg-muted/60 p-3 text-xs">{value}</code><Button type="button" size="icon" variant="outline" aria-label={`Copy ${label}`} onClick={() => { void navigator.clipboard.writeText(value).then(() => toast.success(`${label} copied.`)).catch(() => toast.error("Clipboard access is unavailable.")); }}><Clipboard className="size-4" /></Button></div></div>;
}

export function PspDirectoryTable() {
  const { data = [], isLoading, isError, error, refetch } = usePsps();
  const create = useCreatePsp();
  const update = useUpdatePsp();
  const remove = useDeletePsp();
  const rotate = useRotatePspCredentials();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<BackendPsp | null>(null);
  const [credentials, setCredentials] = useState<{ owner: string; code: string; loginEmail?: string; values: PspCredentials } | null>(null);
  const [rotating, setRotating] = useState<BackendPsp | null>(null);
  const [questionnaireCode, setQuestionnaireCode] = useState<string | null>(null);
  const questionnaire = usePspQuestionnaire(questionnaireCode);

  function openCreate() { setEditing(null); setEditorOpen(true); }
  async function openEdit(psp: BackendPsp) {
    try { setEditing(await fetchPsp(psp.psp_code)); setEditorOpen(true); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Could not load PSP configuration."); }
  }

  function submitEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const bank_accounts = listValue(form.get("bank_accounts"));
    const allowed_currencies = listValue(form.get("allowed_currencies")).map((currency) => currency.toUpperCase());
    const keyText = String(form.get("client_public_key") ?? "").trim();
    const contacts = {
      technical: { email: optional(form.get("technical_email")), phone: optional(form.get("technical_phone")), hours: optional(form.get("technical_hours")) },
      business: { email: optional(form.get("business_email")), phone: optional(form.get("business_phone")), hours: optional(form.get("business_hours")) },
      customer_service: { email: optional(form.get("support_email")), phone: optional(form.get("support_phone")), hours: optional(form.get("support_hours")) },
    };
    const hasContacts = Object.values(contacts).some((contact) => Object.values(contact).some(Boolean));
    const payload = {
      psp_name: String(form.get("psp_name") ?? "").trim(),
      callback_url: String(form.get("callback_url") ?? "").trim(),
      callback_username: String(form.get("callback_username") ?? "").trim(),
      bank_accounts,
      allowed_currencies,
      ifsc_code: optional(form.get("ifsc_code")),
      account_number: optional(form.get("account_number")),
      contact_email: optional(form.get("contact_email")),
      callback_password: optional(form.get("callback_password")),
      client_public_key: keyText || (form.get("remove_client_public_key") ? "" : undefined),
      ...(hasContacts ? { contacts } : {}),
    };

    if (editing) {
      const status = String(form.get("status")) as "active" | "inactive";
      update.mutate({ code: editing.psp_code, payload: { ...payload, callback_password: payload.callback_password, client_public_key: payload.client_public_key, status } }, { onSuccess: () => setEditorOpen(false) });
      return;
    }

    const login_email = String(form.get("login_email") ?? "").trim();
    const login_password = String(form.get("login_password") ?? "");
    create.mutate({ ...payload, callback_password: payload.callback_password ?? "", login_email, login_password, ...(hasContacts ? { contacts } : {}) }, {
      onSuccess: (result: PspCreated) => { setCredentials({ owner: result.psp.psp_name, code: result.psp.psp_code, loginEmail: result.portal_login.email, values: result.credentials }); setEditorOpen(false); },
    });
  }

  function confirmDelete(psp: BackendPsp) {
    if (!window.confirm(`Delete ${psp.psp_name} (${psp.psp_code})? This cannot be undone.`)) return;
    remove.mutate(psp.psp_code);
  }

  function clearCredentials() {
    setCredentials(null);
    create.reset();
    rotate.reset();
  }

  return <>
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">PSP partners</h2><p className="mt-1 text-sm text-muted-foreground">Create partners, manage settlement configuration, and rotate integration credentials.</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => void refetch()}><RefreshCw className="mr-2 size-3.5" />Refresh</Button><Button size="sm" onClick={openCreate}><Plus className="mr-2 size-4" />Add PSP</Button></div></div>
      {isError ? <div className="p-10 text-center"><p className="font-medium">Couldn’t load PSPs</p><p className="mt-1 text-sm text-muted-foreground">{error instanceof Error ? error.message : "The backend is unavailable."}</p></div> :
        <div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-left text-sm"><thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr>{["Partner", "Status", "Currencies", "Bank accounts", "Callback", "Token expiry", "Actions"].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead><tbody className="divide-y divide-border">
          {isLoading ? <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">Loading partner accounts…</td></tr> : data.map((psp) => <tr key={psp.psp_code} className="hover:bg-muted/25"><td className="px-4 py-4"><span className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Building2 className="size-4" /></span><span><span className="block font-medium">{psp.psp_name}</span><span className="font-mono text-xs text-muted-foreground">{psp.psp_code}</span></span></span></td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${psp.status === "active" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>{psp.status}</span></td><td className="px-4 py-4">{psp.allowed_currencies.join(", ")}</td><td className="max-w-48 truncate px-4 py-4" title={psp.bank_accounts.join(", ")}>{psp.bank_accounts.join(", ")}</td><td className="max-w-48 truncate px-4 py-4 text-muted-foreground" title={psp.callback_url}>{psp.callback_url}</td><td className="px-4 py-4 text-muted-foreground">{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(psp.api_token_expires_at))}</td><td className="px-4 py-4"><div className="flex items-center gap-1"><Button variant="ghost" size="icon-sm" aria-label={`Edit ${psp.psp_name}`} title="Edit configuration" onClick={() => openEdit(psp)}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon-sm" aria-label={`Rotate credentials for ${psp.psp_name}`} title="Rotate API credentials" onClick={() => setRotating(psp)}><RotateCw className="size-4" /></Button><Button variant="ghost" size="icon-sm" aria-label={`View ${psp.psp_name} questionnaire`} title="Integration checklist" onClick={() => setQuestionnaireCode(psp.psp_code)}><FileText className="size-4" /></Button><Button variant="ghost" size="icon-sm" aria-label={`Delete ${psp.psp_name}`} title="Delete PSP" onClick={() => confirmDelete(psp)}><Trash2 className="size-4 text-destructive" /></Button></div></td></tr>)}
          {!isLoading && !isError && data.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No PSP partners have been configured.</td></tr>}
        </tbody></table></div>}
      <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">{data.length} partner{data.length === 1 ? "" : "s"}</div>
    </section>

    <Dialog open={editorOpen} onOpenChange={setEditorOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{editing ? `Edit ${editing.psp_name}` : "Create PSP partner"}</DialogTitle><DialogDescription>{editing ? "Update callback and settlement configuration." : "Creates the PSP, API credentials, and its first portal login."}</DialogDescription></DialogHeader>
      <form id="psp-editor" className="grid gap-4 sm:grid-cols-2" onSubmit={submitEditor}>
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">Partner name<Input name="psp_name" required minLength={1} defaultValue={editing?.psp_name} /></label>
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">Callback URL<Input name="callback_url" type="url" required defaultValue={editing?.callback_url} placeholder="https://partner.example/callback" /></label>
        <label className="grid gap-1.5 text-sm font-medium">Callback username<Input name="callback_username" required defaultValue={editing?.callback_username} /></label>
        <label className="grid gap-1.5 text-sm font-medium">Callback password<Input name="callback_password" type="password" required={!editing} minLength={8} placeholder={editing ? "Leave blank to keep current" : "At least 8 characters"} /></label>
        <label className="grid gap-1.5 text-sm font-medium">Bank account IDs<Input name="bank_accounts" required placeholder="Account IDs, comma separated" defaultValue={editing?.bank_accounts.join(", ")} /></label>
        <label className="grid gap-1.5 text-sm font-medium">Allowed currencies<Input name="allowed_currencies" required placeholder="INR, USD, EUR" defaultValue={editing?.allowed_currencies.join(", ")} /></label>
        <label className="grid gap-1.5 text-sm font-medium">Settlement IFSC<Input name="ifsc_code" defaultValue={editing?.ifsc_code ?? ""} /></label>
        <label className="grid gap-1.5 text-sm font-medium">Settlement account number<Input name="account_number" defaultValue={editing?.account_number ?? ""} /></label>
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">Contact email<Input name="contact_email" type="email" defaultValue={editing?.contact_email ?? ""} /></label>
        {!editing && <><label className="grid gap-1.5 text-sm font-medium">Portal login email<Input name="login_email" type="email" required /></label><label className="grid gap-1.5 text-sm font-medium">Portal login password<Input name="login_password" type="password" required minLength={10} maxLength={72} /></label><label className="grid gap-1.5 text-sm font-medium sm:col-span-2">CRM public key (optional PEM)<textarea name="client_public_key" rows={4} placeholder="Paste a 2048-bit or stronger RSA public key" className="rounded-md border border-input bg-background px-3 py-2 font-mono text-xs" /></label>
          <p className="text-xs text-muted-foreground sm:col-span-2">Technical/business/support contact details are optional and can be included in the setup checklist.</p>
          {(["technical", "business", "support"] as const).map((kind) => <div key={kind} className="grid gap-2 rounded-xl border border-border p-3 sm:col-span-2 sm:grid-cols-3"><p className="text-xs font-semibold capitalize text-muted-foreground sm:col-span-3">{kind === "support" ? "Customer service" : kind} contact</p><Input name={`${kind === "support" ? "support" : kind}_email`} type="email" placeholder="Email" /><Input name={`${kind === "support" ? "support" : kind}_phone`} placeholder="Phone" /><Input name={`${kind === "support" ? "support" : kind}_hours`} placeholder="Service hours" /></div>)}</>}
        {editing && <><label className="grid gap-1.5 text-sm font-medium">Status<select name="status" defaultValue={editing.status} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="active">Active</option><option value="inactive">Inactive</option></select></label><label className="grid gap-1.5 text-sm font-medium sm:col-span-2">CRM public key (PEM)<textarea name="client_public_key" rows={4} placeholder={editing.has_client_public_key ? "Leave empty to keep the current key" : "Paste a 2048-bit or stronger RSA public key"} className="rounded-md border border-input bg-background px-3 py-2 font-mono text-xs" /></label>{editing.has_client_public_key && <label className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-2"><input name="remove_client_public_key" type="checkbox" className="accent-[#00DDFF]" />Remove the registered CRM public key</label>}<p className="text-xs text-muted-foreground sm:col-span-2">Partner contacts (optional). Empty fields keep existing contact details.</p>{(["technical", "business", "support"] as const).map((kind) => { const key = kind === "support" ? "customer_service" : kind; const contact = editing.contacts?.[key] ?? {}; const prefix = kind === "support" ? "support" : kind; return <div key={kind} className="grid gap-2 rounded-xl border border-border p-3 sm:col-span-2 sm:grid-cols-3"><p className="text-xs font-semibold capitalize text-muted-foreground sm:col-span-3">{kind === "support" ? "Customer service" : kind} contact</p><Input name={`${prefix}_email`} type="email" placeholder="Email" defaultValue={contact.email ?? ""} /><Input name={`${prefix}_phone`} placeholder="Phone" defaultValue={contact.phone ?? ""} /><Input name={`${prefix}_hours`} placeholder="Service hours" defaultValue={contact.hours ?? ""} /></div>; })}</>}
      </form>
      <DialogFooter><Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button><Button type="submit" form="psp-editor" disabled={create.isPending || update.isPending}>{create.isPending || update.isPending ? "Saving…" : editing ? "Save changes" : "Create PSP"}</Button></DialogFooter>
    </DialogContent></Dialog>

    <Dialog open={Boolean(rotating)} onOpenChange={(open) => { if (!open && !rotate.isPending) setRotating(null); }}><DialogContent><DialogHeader><DialogTitle>Rotate API credentials</DialogTitle><DialogDescription>New token and secret are shown once. Replace the credentials in the partner integration and store them securely.</DialogDescription></DialogHeader><label className="grid gap-1.5 text-sm font-medium">Old credential grace period<Input id="grace-hours" type="number" min={0} max={720} placeholder="Backend default" /><span className="text-xs font-normal text-muted-foreground">Hours. Leave blank to use the backend’s configured default.</span></label><label className="flex items-center gap-2 text-sm"><input id="rotate-salt" type="checkbox" className="accent-[#00DDFF]" /> Rotate signature salt too (requires matching CRM update)</label><DialogFooter><Button variant="outline" onClick={() => setRotating(null)}>Cancel</Button><Button disabled={rotate.isPending} onClick={() => { if (!rotating) return; const rawGrace = (document.getElementById("grace-hours") as HTMLInputElement | null)?.value ?? ""; const grace_hours = rawGrace.trim() ? Number(rawGrace) : undefined; const rotate_salt = Boolean((document.getElementById("rotate-salt") as HTMLInputElement | null)?.checked); rotate.mutate({ code: rotating.psp_code, grace_hours, rotate_salt }, { onSuccess: (values) => { setCredentials({ owner: rotating.psp_name, code: rotating.psp_code, values }); setRotating(null); } }); }}>{rotate.isPending ? "Rotating…" : "Rotate credentials"}</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={Boolean(credentials)} onOpenChange={(open) => { if (!open) clearCredentials(); }}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Store credentials for {credentials?.owner}</DialogTitle><DialogDescription>Partner code: {credentials?.code}. {credentials?.loginEmail ? `Portal login: ${credentials.loginEmail}. ` : ""}These values cannot be retrieved after closing this dialog. Copy them to your secure credential store now.</DialogDescription></DialogHeader>{credentials && <div className="grid gap-3"><CopyValue label="API token" value={credentials.values.api_token} /><CopyValue label="API secret" value={credentials.values.api_secret} /><CopyValue label="Signature salt" value={credentials.values.signature_salt} /><p className="text-xs text-muted-foreground">Token expires {new Date(credentials.values.api_token_expires_at).toLocaleString()}. {credentials.values.note}</p></div>}<DialogFooter><Button onClick={clearCredentials}>Done</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={Boolean(questionnaireCode)} onOpenChange={(open) => { if (!open) setQuestionnaireCode(null); }}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{questionnaire.data?.psp_name ?? "PSP integration checklist"}</DialogTitle><DialogDescription>Current setup answers from the backend configuration.</DialogDescription></DialogHeader>{questionnaire.isLoading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading checklist…</p> : questionnaire.isError ? <p role="alert" className="text-sm text-destructive">{questionnaire.error instanceof Error ? questionnaire.error.message : "Could not load checklist."}</p> : <div className="divide-y divide-border">{questionnaire.data?.answers.map((answer) => <div key={answer.no} className="grid gap-1 py-3 sm:grid-cols-[90px_1fr]"><span className="font-mono text-xs text-muted-foreground">{answer.no}</span><div><p className="text-sm font-medium">{answer.question}</p><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{answer.answer}</p></div></div>)}</div>}<DialogFooter><Button variant="outline" onClick={() => window.print()}>Print checklist</Button><Button onClick={() => setQuestionnaireCode(null)}>Close</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
