#!/usr/bin/env node
/**
 * Syncs the static project data with the Netlify account – no server, no database.
 *
 *   - adds every Netlify site that is not yet listed (new websites appear automatically)
 *   - refreshes screenshots / repository links of listed sites, keeps manual edits
 *   - imports new "feedback" submissions from Netlify Forms
 *
 * Runs in the Netlify build and in the scheduled GitHub Action. Without a token
 * it only logs a hint and exits successfully, so a build never fails because of it.
 *
 * Env: NETLIFY_AUTH_TOKEN or NETLIFY_PERSONAL_ACCESS_TOKEN (required for syncing)
 *      SITE_ID or NETLIFY_SITE_ID (optional, needed for importing feedback)
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataFile = path.join(root, "artifacts/website-admin-dashboard/public/data/site-data.json");
const API = "https://api.netlify.com/api/v1";
const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_PERSONAL_ACCESS_TOKEN;
const siteId = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;

const normalizeUrl = (value) => String(value ?? "").trim().replace(/\/+$/, "").toLowerCase();
const normalizeText = (value) => String(value ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const isHttpUrl = (value) => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

async function netlify(pathname) {
  const response = await fetch(`${API}${pathname}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Netlify API ${pathname} -> ${response.status}`);
  return response.json();
}

async function paged(pathname) {
  const items = [];
  for (let page = 1; page <= 20; page += 1) {
    const batch = await netlify(`${pathname}${pathname.includes("?") ? "&" : "?"}per_page=100&page=${page}`);
    items.push(...batch);
    if (batch.length < 100) break;
  }
  return items;
}

function siteUrl(site) {
  return [site.ssl_url, site.url, site.deploy_url].find(isHttpUrl) ?? null;
}

function githubUrl(site) {
  const repo = site.repo ?? site.build_settings ?? {};
  if (isHttpUrl(site.repo?.repo_url)) return site.repo.repo_url;
  if (isHttpUrl(site.build_settings?.repo_url)) return site.build_settings.repo_url;
  if (repo.provider === "github" && repo.repo_path) return `https://github.com/${repo.repo_path.replace(/^\/+/, "")}`;
  return null;
}

function nextIdFor(items) {
  return Math.max(0, ...items.map((item) => Number(item.id) || 0)) + 1;
}

async function main() {
  if (!token) {
    console.log("[sync-netlify] Kein NETLIFY_AUTH_TOKEN gesetzt – Sync übersprungen.");
    return;
  }

  const raw = await readFile(dataFile, "utf8");
  const data = JSON.parse(raw);
  data.websites ??= [];
  data.feedback ??= [];
  data.events ??= [];
  data.excludedUrls ??= [];
  data.excludedFeedbackSubmissions ??= [];
  const before = JSON.stringify({ ...data, updatedAt: null });

  const excluded = new Set(data.excludedUrls.map(normalizeUrl));
  const sites = await paged("/sites?filter=all");
  let added = 0;
  for (const site of sites) {
    const url = siteUrl(site);
    if (!url || !site.name || excluded.has(normalizeUrl(url))) continue;
    const existing = data.websites.find((item) => normalizeUrl(item.url) === normalizeUrl(url));
    const screenshot = isHttpUrl(site.screenshot_url) ? site.screenshot_url : null;
    if (existing) {
      if (screenshot) existing.imageUrl = screenshot;
      existing.githubUrl ??= githubUrl(site);
      continue;
    }
    data.websites.push({
      id: nextIdFor(data.websites),
      name: site.name,
      url,
      githubUrl: githubUrl(site),
      imageUrl: screenshot,
      description: null,
      status: "live",
      visits: 0,
      updatedAt: site.published_deploy?.published_at ?? site.updated_at ?? new Date().toISOString(),
      ownerName: "Netlify",
    });
    added += 1;
  }
  console.log(`[sync-netlify] ${sites.length} Netlify-Sites gefunden, ${added} neu hinzugefügt.`);

  if (siteId) {
    try {
      const submissions = await paged(`/sites/${siteId}/submissions`);
      const known = new Set(data.feedback.map((item) => item.submissionId).filter(Boolean));
      const knownText = new Set(data.feedback.map((item) => normalizeText(item.feedback)));
      const skipped = new Set(data.excludedFeedbackSubmissions);
      let imported = 0;
      for (const submission of submissions) {
        if (submission.form_name !== "feedback" || known.has(submission.id) || skipped.has(submission.id)) continue;
        const { teacherName = "", feedback = "", rating } = submission.data ?? {};
        const stars = Number(rating);
        if (String(teacherName).trim().length < 2 || String(feedback).trim().length < 3 || !(stars >= 1 && stars <= 5)) continue;
        if (knownText.has(normalizeText(feedback))) continue;
        data.feedback.push({
          id: nextIdFor(data.feedback),
          teacherName: String(teacherName).trim().slice(0, 80),
          feedback: String(feedback).trim().slice(0, 500),
          rating: stars,
          createdAt: submission.created_at,
          isVisible: true,
          submissionId: submission.id,
        });
        knownText.add(normalizeText(feedback));
        imported += 1;
      }
      console.log(`[sync-netlify] ${imported} neue Feedbacks aus Netlify Forms übernommen.`);
    } catch (error) {
      console.warn(`[sync-netlify] Feedback-Import übersprungen: ${error.message}`);
    }
  }

  if (JSON.stringify({ ...data, updatedAt: null }) === before) {
    console.log("[sync-netlify] Keine Änderungen.");
    return;
  }
  data.updatedAt = new Date().toISOString();
  await writeFile(dataFile, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`[sync-netlify] ${path.relative(root, dataFile)} aktualisiert.`);
}

main().catch((error) => {
  // Never break a deploy because Netlify's API had a hiccup.
  console.warn(`[sync-netlify] Sync fehlgeschlagen: ${error.message}`);
});
