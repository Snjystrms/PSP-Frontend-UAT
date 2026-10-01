"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useClients } from "@/lib/queries/clients";

export function BankAccountsTable() {
  const { data = [], isLoading } = useClients();
  const [search, setSearch] = useState("");
  const query = search.toLowerCase();
  const clients = data.filter((client) =>
    `${client.name} ${client.email} ${client.country} ${client.bankAccounts
      .map((account) => account.bankName)
      .join(" ")}`
      .toLowerCase()
      .includes(query),
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Client directory</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verified profiles and their registered payout accounts.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search clients…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <button
            aria-label="Filter clients"
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-border"
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] text-left text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              {["Client", "Country", "Bank", "Account", "IBAN / SWIFT", "KYC", "Account status"].map((item) => (
                <th key={item} className="px-5 py-3 font-medium">{item}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-muted-foreground">
                  Loading client accounts…
                </td>
              </tr>
            ) : (
              clients.flatMap((client) =>
                client.bankAccounts.map((bank) => (
                  <tr key={bank.id} className="hover:bg-muted/25">
                    <td className="px-5 py-4">
                      <span className="block font-medium">{client.name}</span>
                      <span className="text-xs text-muted-foreground">{client.email}</span>
                    </td>
                    <td className="px-5 py-4">{client.country}</td>
                    <td className="px-5 py-4 font-medium">{bank.bankName}</td>
                    <td className="px-5 py-4">
                      <span className="block">{bank.accountNumber}</span>
                      <span className="text-xs text-muted-foreground">{bank.accountName}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="block font-mono text-xs">{bank.iban}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{bank.swift}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${client.kycStatus === "verified" ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}`}>
                        {client.kycStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs capitalize ${bank.status === "verified" ? "text-emerald-700" : bank.status === "pending" ? "text-amber-700" : "text-rose-700"}`}>
                        <span className="size-1.5 rounded-full bg-current" />
                        {bank.status}
                      </span>
                    </td>
                  </tr>
                )),
              )
            )}
          </tbody>
        </table>
        {!isLoading && clients.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">
            No clients match your search.
          </p>
        )}
      </div>
      <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
        {clients.reduce((count, client) => count + client.bankAccounts.length, 0)} client accounts
      </div>
    </section>
  );
}
