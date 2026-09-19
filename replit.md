# Website Admin Dashboard

Webspace ist eine deutsche, standardmäßig dunkle Projektübersicht. Der Besitzer verknüpft Websites, damit Lehrer die veröffentlichten Projekte ohne Login ansehen können.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required auth env: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, and `ADMIN_EMAIL`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/website-admin-dashboard/src/App.tsx` — deutsche öffentliche Projektübersicht, geschütztes Dashboard, Websites-CRUD, Auth-Routen, Personen- und Rollenverwaltung
- `artifacts/api-server/src/routes/` — Express API routes for websites, dashboard metrics/activity, current user, and role changes
- `artifacts/api-server/src/lib/auth.ts` — Clerk-backed user sync and server-side role checks
- `lib/db/src/schema/` — PostgreSQL tables for websites, app users, and activity records
- `lib/api-spec/openapi.yaml` — source of truth for the typed API contract

## Architecture decisions

- Clerk owns browser authentication; API requests use same-origin session cookies rather than client-managed bearer tokens.
- The bootstrap admin is selected server-side by the `ADMIN_EMAIL` environment variable; the password is never stored in application code.
- Public website browsing is available without an account, while mutations and workspace data require a signed-in user.
- Website metadata is stored in PostgreSQL, with admin-only deletion and admin/moderator editing.
- The public home view is intentionally simple: teachers see published project links without signing in; account holders get the protected management views.
- German is the product language and dark mode is the default theme, including the Clerk sign-in UI.

## Product

- Public dashboard of live websites for teachers
- Authenticated overview with website totals, visits, availability, and activity
- Add, edit, delete, search, filter, and status-toggle website records
- Optional GitHub repository links for each website
- Admin-only user list and role assignment for admin, moderator, and member access

## User preferences

- The user wants the project to run on Netlify.

## Gotchas

- Google login is managed through the Clerk Auth pane; the sign-in UI is already wired for the Google provider.
- The `@clerk/localizations` `deDE` resource keeps the authentication screens in German.
- Real binary website uploads are not enabled until App Storage is provisioned; the current first version manages URLs and GitHub links without pretending files were stored.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
