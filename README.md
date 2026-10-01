# Vaspan Payment Operations

Next.js portal for the PSP payment operations backend. It provides authenticated deposit and withdrawal review queues, a transaction dashboard, and an admin PSP directory.

## Local setup

1. Start the FastAPI backend from the `traze_psp_backend` project and make sure it is reachable from the Next.js server.
2. Copy `.env.example` to `.env.local`, set `PSP_API_BASE_URL` to the backend API prefix (for local development: `http://localhost:8000/api/v1/`), and set a private random `AUTH_SECRET`.
3. Run `npm install` and `npm run dev`.
4. Open [http://localhost:3000](http://localhost:3000) and sign in with the portal credentials created by the backend administrator.

The frontend authenticates with `POST /api/v1/auth/login`, loads the profile from `/api/v1/auth/me`, and stores the backend bearer token in the encrypted Auth.js JWT cookie. Authenticated requests pass through a same-origin Next.js route handler; the bearer token is not included in the browser session response.

## Backend integration

- Deposit and withdrawal queues use the backend portal listing endpoints and display the real status, customer, PSP, and payout/deposit-account fields.
- PSP users can approve or reject their own requests. Rejections require a reason and approvals can include a review comment. Admin users have read-only access to all queues.
- The admin PSP directory reads `/api/v1/psps`. User and audit-log API helpers are available for additional admin screens.
- The backend owns CRM submission, request signatures, idempotency, audit trails, and callback delivery. The browser portal does not handle CRM API credentials or signing keys.

The backend currently has no client-directory or support-chat endpoints. Those screens cannot display backend records until those APIs are added; do not use the former demo fixtures as live data.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint
