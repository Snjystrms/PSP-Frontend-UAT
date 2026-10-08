"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LogIn, Lock, Mail } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { LogoCube } from "@/components/ui/logo-cube";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);

    try {
      // This browser request intentionally keeps the backend login visible in DevTools.
      console.info("[Vaspan login] POST /api/backend/auth/login");
      const response = await fetch("/api/backend/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
        cache: "no-store",
      });
      console.info("[Vaspan login] response", {
        status: response.status,
        ok: response.ok,
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setIsBusy(false);
        toast.error(
          Object.assign(
            new Error(
              payload?.message ||
                "We couldn’t sign you in. Check your email and password, and confirm the payment service is available.",
            ),
            {
              errorCode: payload?.error_code,
              httpStatus: response.status,
              details: payload?.details,
            },
          ),
        );
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      setIsBusy(false);
      console.error(
        "[Vaspan login] request failed",
        cause instanceof Error ? cause.message : "Unknown error",
      );
      toast.error("Couldn’t reach the payment service. Please try again.");
    }
  }

  return (
    <>
      {isBusy && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/85 px-4 backdrop-blur-md"
          role="status"
          aria-live="polite"
        >
          <LogoCube size={76} duration={2.4} />
          <p className="-mt-3 text-sm font-medium text-foreground">
            Signing you in…
          </p>
        </div>
      )}
      <section className="relative z-10 grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-[2rem] border border-border bg-card p-2 text-card-foreground shadow-[0_32px_100px_-36px_rgba(3,31,39,.42)] lg:grid-cols-[1.02fr_.98fr]">
        <aside className="vaspan-login-pattern vaspan-login-artwork relative hidden min-h-[560px] flex-col justify-between overflow-hidden rounded-[1.55rem] p-8 text-white lg:flex xl:p-12">
          <span
            aria-hidden="true"
            className="vaspan-login-stars vaspan-login-stars-small"
          />
          <span
            aria-hidden="true"
            className="vaspan-login-stars vaspan-login-stars-medium"
          />
          <span
            aria-hidden="true"
            className="vaspan-login-stars vaspan-login-stars-large"
          />
          <div className="relative z-10">
            <Image
              src="/vaspan_full_dark.svg"
              alt="Vaspan"
              width={184}
              height={58}
              className="h-auto w-40 xl:w-44"
              priority
            />
          </div>
          <div className="relative z-10 max-w-md pb-3">
            <h2 className="max-w-sm text-4xl font-semibold leading-[1.08] tracking-[-.045em] xl:text-[3.25rem]">
              Payments, clearly in control.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-200/75">
              One workspace for your payment operations.
            </p>
          </div>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -right-24 size-80 rounded-full border border-[#00DDFF]/10 bg-[#00DDFF]/[.04] shadow-[0_0_100px_20px_rgba(0,221,255,.08)]"
          />
        </aside>

        <div className="relative flex min-h-[590px] items-center justify-center px-5 py-10 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <Image
                src="/vaspan_full_bright.svg"
                alt="Vaspan"
                width={150}
                height={47}
                className="h-auto w-36 dark:hidden"
                priority
              />
              <Image
                src="/vaspan_full_dark.svg"
                alt="Vaspan"
                width={150}
                height={47}
                className="hidden h-auto w-36 dark:block"
                priority
              />
            </div>
            <h1 className="text-3xl font-semibold tracking-[-.035em] text-foreground">
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Sign in to your payment operations workspace.
            </p>

            <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <div className="group relative">
                  <Mail
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted-foreground transition group-focus-within:text-[#00DDFF]"
                  />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="h-12 rounded-xl border-border bg-muted/50 pl-11 pr-4 text-sm text-foreground shadow-none transition placeholder:text-muted-foreground focus-visible:border-[#00DDFF] focus-visible:ring-4 focus-visible:ring-[#00DDFF]/15"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <div className="group relative">
                  <Lock
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted-foreground transition group-focus-within:text-[#00DDFF]"
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="h-12 rounded-xl border-border bg-muted/50 pl-11 pr-12 text-sm text-foreground shadow-none transition placeholder:text-muted-foreground focus-visible:border-[#00DDFF] focus-visible:ring-4 focus-visible:ring-[#00DDFF]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center rounded-r-xl text-muted-foreground transition hover:text-[#00DDFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#00DDFF]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isBusy}
                className="ib-portal-metric [--ib-portal-metric-fill:var(--muted)] inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-[#00DDFF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#00DDFF]/30 disabled:cursor-wait disabled:opacity-70"
              >
                {isBusy ? (
                  "Signing in…"
                ) : (
                  <>
                    Sign in <LogIn size={17} />
                  </>
                )}
              </button>
            </form>
            <p className="mt-7 text-center text-xs leading-5 text-muted-foreground">
              Access is provided by your organization administrator.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
