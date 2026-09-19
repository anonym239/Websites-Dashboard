# Netlify Deployment

Die Anwendung ist für einen Netlify-Deploy als Vite-SPA mit einer serverless Express-API vorbereitet.

## Netlify-Projekt

Das Repository-Root bleibt das Netlify-Base-Verzeichnis. `netlify.toml` setzt automatisch:

- Build: `pnpm --filter @workspace/website-admin-dashboard run build`
- Publish directory: `artifacts/website-admin-dashboard/dist/public`
- Functions directory: `netlify/functions`
- SPA-Fallback auf `index.html`
- `/api/*` als Rewrite auf die serverless API-Funktion

## Benötigte Netlify-Variablen

Die Werte werden im Netlify-Dashboard unter den Environment Variables hinterlegt. Keine dieser Variablen in die ZIP-Datei oder in den Frontend-Code schreiben.

### Frontend

- `VITE_CLERK_PUBLISHABLE_KEY`

### Serverless API

- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- `ADMIN_EMAIL`
- `NETLIFY_PERSONAL_ACCESS_TOKEN` für die Funktion zum Importieren von Netlify-Websites

`CLERK_SECRET_KEY`, `DATABASE_URL`, `ADMIN_EMAIL` und `NETLIFY_PERSONAL_ACCESS_TOKEN` dürfen nicht als `VITE_*`-Variable angelegt werden, weil Vite diese Werte in den Browser-Build übernehmen würde.

## Clerk und Google-Anmeldung

Für Netlify muss die tatsächliche Netlify-Domain in der Clerk-Produktionsumgebung als erlaubte Anwendungs- und Redirect-Domain hinterlegt werden. Die Produktion verwendet einen getrennten Clerk-Benutzerbestand; Entwicklungskonten werden nicht automatisch übernommen.

Google Sign-in muss in der Clerk-Produktionsumgebung aktiviert sein. Danach testen:

1. `/sign-in` öffnen
2. mit Google anmelden
3. prüfen, ob `/api/session/me` mit `200` antwortet
4. mit der in `ADMIN_EMAIL` hinterlegten Adresse die Admin-Rechte prüfen

## Datenbank

`DATABASE_URL` muss auf eine von Netlify erreichbare PostgreSQL-Datenbank zeigen. Vor dem ersten produktiven Aufruf das Drizzle-Schema in dieser Datenbank anwenden:

```bash
pnpm --filter @workspace/db run push
```

Der Befehl darf nur mit der vorgesehenen Produktionsdatenbank ausgeführt werden. Keine Produktions-URL in Dateien committen.

## Funktionsprüfung nach dem Deploy

```text
GET /
GET /api/healthz
GET /api/websites
GET /api/feedback
```

Danach zusätzlich den geschützten Pfad ohne Anmeldung prüfen: Er muss bei `/api/session/me` mit `401` antworten. Die öffentliche Website darf nur sichtbare Bewertungen anzeigen; Admin-Funktionen müssen eine echte Clerk-Sitzung verwenden.