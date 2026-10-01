import { LoginForm } from "@/app/(auth)/login/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  return (
    <main className="vaspan-login-pattern relative grid min-h-screen place-items-center p-4 sm:p-8">
      <span aria-hidden="true" className="vaspan-login-stars vaspan-login-stars-small" />
      <span aria-hidden="true" className="vaspan-login-stars vaspan-login-stars-medium" />
      <span aria-hidden="true" className="vaspan-login-stars vaspan-login-stars-large" />
      <header className="absolute right-4 top-4 z-20 sm:right-8 sm:top-8">
        <ThemeToggle />
      </header>
      <LoginForm />
    </main>
  );
}
