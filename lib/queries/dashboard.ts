"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPortalDashboard } from "@/lib/api/backend";

export function usePortalDashboard() {
  return useQuery({
    queryKey: ["portal-dashboard"],
    queryFn: () => fetchPortalDashboard(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}
