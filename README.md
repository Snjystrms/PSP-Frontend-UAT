# Vaspan Payment Operations

Next.js portal for the PSP payment operations backend. It provides authenticated deposit and withdrawal review queues, a transaction dashboard, and an admin PSP directory.

## Local setupp

1. Start the FastAPI backend from the `traze_psp_backend` project and make sure it is reachable from the Next.js server.
2. Copy `.env.example` to `.env.local` and set `PSP_API_BASE_URL` to the backend API prefix (for local development: `http://localhost:8000/api/v1/`).
3. Run `npm install` and `npm run dev`.
4. Open [http://localhost:3000](http://localhost:3000) and sign in with the portal credentials created by the backend administrator.

The browser signs in through `POST /api/backend/auth/login`. The Next.js route forwards the request to backend `/auth/login`, loads `/auth/me`, and stores the backend bearer token in an HttpOnly cookie. Subsequent browser API requests go through visible same-origin `/api/backend/...` routes; the backend bearer token is never exposed to client JavaScript. No Auth.js session, CSRF, or provider requests are used.

## Backend integration

- Deposit and withdrawal queues use the backend portal listing endpoints and display the real status, customer, PSP, and payout/deposit-account fields.
- PSP users can review their own requests; admins can review across PSPs. Rejections and reversals require a reason, while approvals can include an optional review comment. An approved request can be reversed once, and the backend sends that decision to the CRM callback.
- The admin PSP directory reads `/api/v1/psps`. User and audit-log API helpers are available for additional admin screens.
- The backend owns CRM submission, request signatures, idempotency, audit trails, and callback delivery. The browser portal does not handle CRM API credentials or signing keys.

The backend currently has no client-directory or support-chat endpoints. Those screens cannot display backend records until those APIs are added; do not use the former demo fixtures as live data.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint
