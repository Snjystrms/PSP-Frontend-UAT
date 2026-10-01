"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClients } from "@/lib/api/mock";
export function useClients() { return useQuery({ queryKey: ["clients"], queryFn: fetchClients }); }
