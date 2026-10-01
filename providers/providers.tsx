"use client";

import { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider, useTheme } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

function ThemeBridge() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    document.documentElement.dataset.themeId = resolvedTheme === "dark" ? "vaspan-dark" : "vaspan-bright";
    document.body.classList.add("theme-loaded");
  }, [resolvedTheme]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } }));
  return (
    <SessionProvider>
      <QueryClientProvider client={client}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ThemeBridge />
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
