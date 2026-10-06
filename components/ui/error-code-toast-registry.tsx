"use client";

import { useEffect } from "react";
import { useErrorCodes } from "@/lib/queries/admin";
import { toast } from "@/components/ui/toast";

export function ErrorCodeToastRegistry() {
  const { data } = useErrorCodes();

  useEffect(() => {
    toast.setErrorCodeCatalog(data?.error_codes ?? []);
  }, [data]);

  return null;
}
