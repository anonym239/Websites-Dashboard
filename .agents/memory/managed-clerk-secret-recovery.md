---
name: Managed Clerk secret recovery
description: Replit-managed Clerk can have an invalid Development server key even while the browser session still appears signed in.
---

When a managed Clerk API returns `secret-key-invalid`, restore the managed Clerk configuration through the official setup flow rather than changing `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, or `VITE_CLERK_PUBLISHABLE_KEY` manually.

**Why:** The frontend can continue to show an existing Clerk session while the API process has a stale or invalid server key, producing misleading 401s that look like cookie or role bugs.

**How to apply:** Confirm the management status is `managed`, run the managed Clerk setup/recovery callback, restart both API and web workflows so the refreshed secrets are loaded, then verify `/api/session/me` returns 200 for an authenticated preview session.