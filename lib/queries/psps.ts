"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPsps } from "@/lib/api/backend";

export function usePsps() {
  return useQuery({ queryKey: ["psps"], queryFn: fetchPsps });
}
