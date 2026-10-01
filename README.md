# Vaspan Payment Operations

A Next.js admin workspace scaffold for a payment service provider. It includes role-based demo sign-in, deposit and withdrawal queues, client bank-account details, a KPI dashboard, support chat, and bright/dark Vaspan themes.

## Local setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route forwards to the dashboard, and unauthenticated visitors are sent to `/login`.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@vaspan.dev` | `admin123` |
| PSP agent | `agent@vaspan.dev` | `agent123` |

The admin can browse client bank-account details. Both roles can review and approve or reject deposits and withdrawals.

## Scaffold boundaries

Requests, clients, chat replies, and dashboard chart series use local mock data. Request decisions are held in browser memory and reset on reload. No payment processor or production client database is connected. Set `AUTH_SECRET` to a private random value before deploying; the built-in fallback exists only to make this demo scaffold run locally.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint
