---
name: API client DOM iterable requirement
description: Generated browser clients use Headers.entries and need the iterable DOM library in their TypeScript project.
---

Generated API client code can call `Headers.entries()`, which TypeScript does not expose with the `dom` library alone. Keep `dom.iterable` in the API client library's `compilerOptions.lib` when regenerating the client.

**Why:** Orval generation succeeded but the workspace typecheck failed until the iterable DOM declarations were included.

**How to apply:** If generated API clients report missing `Headers.entries`, check the package-specific TypeScript `lib` list before changing generated code.