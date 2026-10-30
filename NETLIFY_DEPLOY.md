# Netlify Deployment (ohne Server, ohne Datenbank)

Die Seite ist eine reine statische Vite-SPA. Es gibt keine API-Funktion und keine Datenbank mehr auf Netlify.

## Wo liegen die Daten?

- **Öffentliche Daten** (Websites, Events, Feedback): `artifacts/website-admin-dashboard/public/data/site-data.json`.
  Diese Datei wird mit ausgeliefert und beim Laden der Seite gelesen.
- **Änderungen im Dashboard** werden sofort im Browser (localStorage) gespeichert.
  Mit **„Veröffentlichen“** (Websites/Events/Feedback-Seite) werden sie per GitHub-API in `site-data.json` committet.
  Netlify baut danach automatisch neu – nach 1–2 Minuten ist alles live.
- **Feedback, Meldungen und Anfragen** von Besuchern gehen zusätzlich an **Netlify Forms**
  (Netlify → Site → Forms). Neues Feedback wird beim nächsten Sync automatisch in die Seite übernommen.

Läuft lokal noch der alte Express-Server, nutzt die App ihn automatisch; ist er nicht erreichbar, läuft alles im Browser weiter.

## Automatischer Netlify-Sync

`scripts/sync-netlify.mjs` holt alle Sites aus deinem Netlify-Account und neue Feedback-Einträge aus Netlify Forms.

1. **Bei jedem Netlify-Build** (Build-Command in `netlify.toml`).
2. **Alle 15 Minuten per GitHub Action** (`.github/workflows/sync-netlify.yml`). Gibt es eine neue Website,
   committet die Action `site-data.json` → Netlify deployt neu → die neue Website steht auf der Seite.

### Einmalig einrichten

| Wo | Name | Wert |
| --- | --- | --- |
| Netlify → Site configuration → Environment variables | `NETLIFY_AUTH_TOKEN` | Netlify Personal Access Token (User settings → Applications) |
| GitHub → Repo → Settings → Secrets and variables → Actions | `NETLIFY_AUTH_TOKEN` | derselbe Token |
| GitHub → Repo → Settings → Secrets and variables → Actions | `NETLIFY_SITE_ID` | Site ID dieser Seite (Netlify → Site configuration → General) |
| GitHub → Repo → Settings → Actions → General | Workflow permissions | „Read and write permissions“ |

Die Action kann unter **Actions → „Netlify-Projekte synchronisieren“ → Run workflow** auch sofort gestartet werden.

### Veröffentlichen aus dem Dashboard

Im Dashboard unter **Websites → Einstellungen** einen GitHub **Fine-grained Token** eintragen,
der nur auf dieses Repository zugreift und die Berechtigung **Contents: Read and write** hat.
Der Token wird nur in deinem Browser gespeichert. Optional kann dort auch der Netlify-Token
hinterlegt werden, dann synchronisiert „Von Netlify synchronisieren“ direkt im Browser.

## Anmeldung

Ist `VITE_CLERK_PUBLISHABLE_KEY` gesetzt, wird Clerk verwendet. Ohne Schlüssel gibt es eine lokale Anmeldung
(Name + E-Mail) direkt im Browser. Sie schaltet nur die eigene Browser-Kopie frei – öffentlich ändern kann die
Seite nur, wer den GitHub-Token hat.
