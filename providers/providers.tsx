"use client";

import { useEffect, useState } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/sonner";

function ThemeBridge() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    document.documentElement.dataset.themeId = resolvedTheme === "dark" ? "vaspan-dark" : "vaspan-bright";
    document.body.classList.add("theme-loaded");
  }, [resolvedTheme]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    queryCache: new QueryCache({ onError: (error) => toast.error(error instanceof Error ? error.message : "Something went wrong while loading data.") }),
    defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
  }));
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <ThemeBridge />
        {children}
        <Toaster position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
