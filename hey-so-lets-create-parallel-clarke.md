# PSP Frontend — Boilerplate Scaffold Plan

## Context
Empty repo. Goal: scaffold a Next.js + Tailwind + shadcn boilerplate for a Payment
Service Provider (PSP) admin app. Two roles — **admin** and **psp agent** — who receive
deposit/withdrawal requests and approve/reject them, view KPI/stats dashboards, chat, and
browse client bank-account details.

This pass builds **structure + boilerplate only**: real layout, routing, role gating,
themed UI, mock data. No real payment backend.

Decisions (confirmed with user):
- Auth/roles: **NextAuth + mock users** (credentials provider, hardcoded admin/agent).
- Data: **TanStack Query + mock async fetchers** (swap for real API later).
- Sidebar: **port the reference** `animated-sidebar.tsx`.
- Charts + chat: **reuse the reference files** in `reference files/`.
- Theme: **Vaspan bright + dark** from the provided `global.css`.

## Reference files (source of truth)
- `reference files/global.css` → becomes `app/globals.css` verbatim (Tailwind v4 syntax:
  `@import "tailwindcss"`, `@theme inline`, `data-theme-id="vaspan-bright|vaspan-dark"`).
- `reference files/components/motion/animated-sidebar.tsx` → ported as-is.
- `reference files/components/previews/motion/animated-sidebar.preview.tsx` → composition
  reference for our real sidebar (not copied).
- `reference files/Chat Messages.tsx` → `components/ui/chat-messages.tsx`.
- `reference files/progress-metric-card/component.tsx` + `Usage.tsx` → KPI card.

### Missing dependencies in references (must be authored)
These are imported by the references but **not present** in the folder — we create them:
1. `@/lib/utils` → `cn()` (standard shadcn util).
2. `@/lib/ease` → `EASE_DRAWER, EASE_OUT, SPRING_LAYOUT, SPRING_PRESS` (motion constants;
   sidebar imports them).
3. `@/components/motion/shared-layout-bg` → `SharedLayoutBg` (shared-layout pill bg used by
   `AnimatedSidebarMenu`). Author a small `motion` `layoutId`-based component.
4. `progress-metric-card/metric-chart` (`MetricChart`, `ACCENTS`, `SERIES_COLORS`,
   `formatCompact`, types) and `metric-controls` (`PeriodSelect`, `ViewToggle`,
   `PeriodOption`) → author with **Recharts**, matching the interfaces used in
   `component.tsx`.

## Tech / dependencies
- next (App Router, TS), react, react-dom
- tailwindcss v4 + `@tailwindcss/postcss`, `tw-animate-css`
- `motion` (provides `motion/react`; **change `Chat Messages.tsx` import from
  `framer-motion` → `motion/react`** so we ship one animation lib)
- lucide-react, recharts
- next-auth (v5/beta), `@tanstack/react-query`, next-themes
- shadcn CLI to add: button, card, table, badge, dropdown-menu, dialog, input, label,
  avatar, tabs, select, separator, sonner, skeleton

## Directory layout
```
app/
  globals.css                     # from reference global.css
  layout.tsx                      # fonts + providers, sets data-theme-id + class
  page.tsx                        # redirect -> /dashboard (or /login)
  (auth)/login/page.tsx           # credentials form
  (app)/
    layout.tsx                    # AnimatedSidebar shell + topbar + role guard
    dashboard/page.tsx            # KPI cards + charts + stats
    deposits/page.tsx             # requests table + approve/reject
    withdrawals/page.tsx          # requests table + approve/reject
    clients/page.tsx              # client bank-account list
    chat/page.tsx                 # support chat
  api/auth/[...nextauth]/route.ts
components/
  motion/animated-sidebar.tsx     # ported
  motion/shared-layout-bg.tsx     # authored
  layout/app-sidebar.tsx          # nav config (role-filtered) using AnimatedSidebar parts
  layout/topbar.tsx               # trigger + theme toggle + user menu + role badge
  dashboard/kpi-cards.tsx, stats.tsx, charts.tsx
  requests/requests-table.tsx     # shared by deposits + withdrawals, approve/reject actions
  clients/bank-accounts-table.tsx
  ui/                             # shadcn + progress-metric-card + metric-chart +
                                  #   metric-controls + chat-messages
  theme-toggle.tsx
lib/
  utils.ts                        # cn
  ease.ts                         # motion constants
  auth.ts                         # NextAuth config + MOCK_USERS (admin, agent)
  types.ts                        # Role, DepositRequest, WithdrawalRequest, Client, BankAccount
  mock-data.ts                    # seed arrays
  api/mock.ts                     # async fetchers (simulate latency) + mutate helpers
  queries/*.ts                    # useDeposits, useWithdrawals, useClients, useApprove...
providers/
  providers.tsx                   # SessionProvider + QueryClientProvider + ThemeProvider
```

## Key implementation notes

### Theme (Vaspan bright + dark)
- `globals.css` needs BOTH the `.dark` class (base dark tokens) AND
  `:root[data-theme-id="vaspan-dark"]` overrides. Bright = light tokens +
  `data-theme-id="vaspan-bright"`.
- Use **next-themes** with `attribute="class"` for dark/light, plus a small effect (or
  custom provider) that sets `document.documentElement.dataset.themeId` to
  `vaspan-dark`/`vaspan-bright` in sync. Add `body` `theme-loaded` class after mount
  (the css disables transitions until then).
- `theme-toggle.tsx` flips bright/dark.
- Image-backed overlays in the css (`/client_dashboard_header.svg`, etc.) are optional;
  reference them as-is — missing images degrade to background color, fine for boilerplate.

### Auth + roles (NextAuth mock)
- `lib/auth.ts`: Credentials provider; `MOCK_USERS = [{email, password, role:"admin"},
  {email, password, role:"agent"}]`. Put `role` in the JWT + session callbacks.
- `(app)/layout.tsx` server component: `auth()` → redirect to `/login` if no session;
  pass `role` down.
- `components/layout/app-sidebar.tsx`: nav items tagged with `roles: Role[]`; filter by
  current role. Approve/reject buttons gated by role (both can act in boilerplate;
  keep the gate wired so it's trivial to restrict later).

### Data (TanStack Query + mock)
- `lib/api/mock.ts`: in-memory arrays + `fetchDeposits()`, `approveDeposit(id)` etc. with
  `await sleep()`; mutations update the array and return updated row.
- `lib/queries/*`: `useQuery`/`useMutation` hooks; `onSuccess` invalidates + toast (sonner).
- Deposits/withdrawals share one `requests-table.tsx` (status badges: pending/approved/
  rejected; row actions). Withdrawals also show client bank account.

### Dashboard
- KPI cards via ported `ProgressMetricCard` (needs authored `metric-chart` +
  `metric-controls` on Recharts). Show: total deposits, total withdrawals, pending
  requests, approval rate.
- `charts.tsx`: 1–2 Recharts area/bar charts (volume over time, deposits vs withdrawals).
- `stats.tsx`: small stat tiles (counts by status).

### Chat
- `components/ui/chat-messages.tsx` from reference (import fix noted above). Seed with
  PSP-flavored messages; render on `/chat/page.tsx` with `interactive`. Dark-styled card
  is self-contained (fine as an embedded support widget).

### Clients / bank accounts
- `clients/page.tsx`: table of clients with bank account details (bank name, account no.
  masked, IBAN/routing, status). Mock seed in `mock-data.ts`.

## Verification
1. `npm install` then `npm run dev` — app boots, no console errors.
2. `npm run build` + `npm run lint` pass.
3. `/login` with mock admin and mock agent → lands on `/dashboard`; unauthenticated hits
   redirect to `/login`.
4. Sidebar: expand/collapse (⌘/Ctrl-B), active highlight, role-filtered items differ
   between admin and agent, mobile sheet works.
5. Theme toggle flips vaspan bright ↔ dark; `data-theme-id` + `.dark` update together;
   no FOUC.
6. Deposits + withdrawals: approve/reject updates status + badge, toast fires, KPI/stats
   reflect change (query invalidation).
7. Chat page sends a message and gets a mock reply.
8. Clients page renders bank-account rows.
