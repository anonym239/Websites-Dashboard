---
name: Netlify Functions and serverless-http
description: Netlify's esbuild bundling needs a CommonJS entry when wrapping the existing Express app with serverless-http.
---

Use a `.cjs` Netlify function entry and bundle the existing Express app through `serverless-http`. An ESM bundle can fail at runtime because serverless-http dynamically requires Node's `http` module.

**Why:** The workspace uses `"type": "module"`, while serverless-http's framework adapter relies on dynamic CommonJS requires. A CJS function entry keeps the Netlify runtime compatible without changing the Express routes.

**How to apply:** Keep `/api/*` rewrites pointed at the function, use `node_bundler = "esbuild"`, and verify `/api/healthz` through the bundled function before deployment.