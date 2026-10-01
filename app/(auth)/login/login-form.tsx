"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@vaspan.dev");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (result?.error) { setError("Those credentials did not match a demo account."); return; }
    router.push("/dashboard"); router.refresh();
  }
  return (
    <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#071f2a] p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-20 size-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative flex items-center gap-3"><Image src="/vaspan-logo.svg" alt="" width={42} height={42} priority className="size-11 object-contain" /><span className="text-lg font-semibold tracking-wide">Vaspan<span className="text-cyan-300">.</span></span></div>
        <div className="relative max-w-md"><p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Payment operations</p><h1 className="text-4xl font-semibold leading-tight">Move money with clarity and control.</h1><p className="mt-5 text-sm leading-6 text-slate-300">A single workspace for deposits, withdrawals, client accounts, and the people who keep every transaction moving.</p></div>
        <p className="relative text-xs text-slate-400">Secure workspace · Demo environment</p>
      </div>
      <div className="p-7 sm:p-12">
        <div className="mb-9 flex items-center gap-2 lg:hidden"><Image src="/vaspan-logo.svg" alt="" width={36} height={36} className="size-9 object-contain" /><span className="text-lg font-semibold">Vaspan<span className="text-primary">.</span></span></div>
        <div className="mb-8"><span className="mb-4 grid size-11 place-items-center rounded-xl bg-muted"><LockKeyhole className="size-5 text-primary" /></span><h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2><p className="mt-2 text-sm text-muted-foreground">Sign in to your payment operations workspace.</p></div>
        <form className="space-y-5" onSubmit={submit}>
          <label className="block space-y-2 text-sm font-medium">Work email<Input autoComplete="username" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label className="block space-y-2 text-sm font-medium">Password<Input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" size="lg" disabled={busy}>{busy ? "Signing in…" : "Sign in"}<ArrowRight className="size-4" /></Button>
        </form>
        <div className="mt-8 rounded-xl border border-border bg-muted/30 p-4 text-xs leading-5 text-muted-foreground"><p className="mb-1 font-medium text-foreground">Demo accounts</p><p>Admin: admin@vaspan.dev / admin123</p><p>PSP agent: agent@vaspan.dev / agent123</p><p className="mt-2">Select an account above by changing the email and password.</p></div>
      </div>
    </div>
  );
}
