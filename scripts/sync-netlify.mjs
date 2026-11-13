#!/usr/bin/env node
/**
 * Syncs the static project data with the Netlify account – no server, no database.
 *
 *   - adds every Netlify site that is not yet listed (new websites appear automatically)
 *   - refreshes screenshots / repository links of listed sites, keeps manual edits
 *   - imports new "feedback" submissions from Netlify Forms
 *   - renews every preview image once a week (new ?v= stamp), so a reworked
 *     website also gets a current picture on the dashboard
 *
 * Runs in the Netlify build and in the scheduled GitHub Actions. Without a token
 * only the images are renewed (sites without a Netlify screenshot get an
 * automatic capture of their live page). A build never fails because of it.
 *
 * Env: NETLIFY_AUTH_TOKEN or NETLIFY_PERSONAL_ACCESS_TOKEN (required for syncing)
 *      SITE_ID or NETLIFY_SITE_ID (optional, needed for importing feedback)
 *      REFRESH_IMAGES=1 (optional) renews all images right now instead of weekly
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

/** ISO week like "2026-W46" – the stamp changes once a week (on Monday). */
function isoWeek(date = new Date()) {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((day - yearStart) / 86400000 + 1) / 7);
  return `${day.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Fallback when Netlify has no screenshot for a site: a fresh capture of its live page. */
const AUTO_SCREENSHOT = "https://image.thum.io/get/width/1200/crop/750/noanimate/";

function withVersion(url, version) {
  if (url.startsWith(AUTO_SCREENSHOT)) {
    // thum.io caches per captured URL, so the stamp goes onto the page URL itself.
    const target = new URL(url.slice(AUTO_SCREENSHOT.length));
    target.searchParams.set("v", version);
    return AUTO_SCREENSHOT + target.toString();
  }
  const parsed = new URL(url);
  parsed.searchParams.set("v", version);
  return parsed.toString();
}

/** Only images we manage ourselves are replaced – a manually chosen image stays. */
const isManagedImage = (site) => !site.imageUrl || site.imageAuto === true;

/**
 * Gives every project a current preview image. The version stamp changes once a
 * week (or right away with REFRESH_IMAGES=1), so after a site was reworked the
 * browsers and image CDNs load the new screenshot instead of a cached old one.
 */
function refreshImages(data, screenshots, force) {
  const week = isoWeek();
  if (force || !String(data.imageVersion ?? "").startsWith(week)) {
    data.imageVersion = force ? `${week}-${Date.now().toString(36)}` : week;
  }
  let refreshed = 0;
  for (const site of data.websites) {
    if (!isHttpUrl(site.url) || !isManagedImage(site)) continue;
    const source = screenshots.get(normalizeUrl(site.url)) ?? `${AUTO_SCREENSHOT}${site.url.replace(/\/+$/, "")}/`;
    const next = withVersion(source, data.imageVersion);
    if (site.imageUrl !== next) {
      site.imageUrl = next;
      site.imageAuto = true;
      refreshed += 1;
    }
  }
  console.log(`[sync-netlify] Bilder-Version ${data.imageVersion}: ${refreshed} Vorschaubild(er) erneuert.`);
}

async function syncWithNetlify(data, screenshots) {
  const excluded = new Set(data.excludedUrls.map(normalizeUrl));
  const sites = await paged("/sites?filter=all");
  let added = 0;
  for (const site of sites) {
    const url = siteUrl(site);
    if (!url || !site.name || excluded.has(normalizeUrl(url))) continue;
    // Netlify creates a new screenshot with every deploy – remember the latest one.
    const screenshot = [site.screenshot_url, site.published_deploy?.screenshot_url].find(isHttpUrl);
    if (screenshot) screenshots.set(normalizeUrl(url), screenshot);
    const existing = data.websites.find((item) => normalizeUrl(item.url) === normalizeUrl(url));
    if (existing) {
      existing.githubUrl ??= githubUrl(site);
      continue;
    }
    data.websites.push({
      id: nextIdFor(data.websites),
      name: site.name,
      url,
      githubUrl: githubUrl(site),
      imageUrl: null, // set by refreshImages()
      description: null,
      status: "live",
      visits: 0,
      updatedAt: site.published_deploy?.published_at ?? site.updated_at ?? new Date().toISOString(),
      ownerName: "Netlify",
    });
    added += 1;
  }
  console.log(`[sync-netlify] ${sites.length} Netlify-Sites gefunden, ${added} neu hinzugefügt, ${screenshots.size} Netlify-Screenshots.`);

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
}

async function main() {
  const raw = await readFile(dataFile, "utf8");
  const data = JSON.parse(raw);
  data.websites ??= [];
  data.feedback ??= [];
  data.events ??= [];
  data.excludedUrls ??= [];
  data.excludedFeedbackSubmissions ??= [];
  const before = JSON.stringify({ ...data, updatedAt: null });
  const screenshots = new Map();

  if (token) {
    try {
      await syncWithNetlify(data, screenshots);
    } catch (error) {
      // Images are still refreshed below, even if Netlify's API had a hiccup.
      console.warn(`[sync-netlify] Netlify-Abgleich fehlgeschlagen: ${error.message}`);
    }
  } else {
    console.log("[sync-netlify] Kein NETLIFY_AUTH_TOKEN gesetzt – nur Vorschaubilder werden erneuert.");
  }
  refreshImages(data, screenshots, /^(1|true|yes)$/i.test(process.env.REFRESH_IMAGES ?? ""));

  if (JSON.stringify({ ...data, updatedAt: null }) === before) {
    console.log("[sync-netlify] Keine Änderungen.");
    return;
  }
  data.updatedAt = new Date().toISOString();
  await writeFile(dataFile, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`[sync-netlify] ${path.relative(root, dataFile)} aktualisiert.`);
}

main().catch((error) => {
  // Never break a deploy because of the sync.
  console.warn(`[sync-netlify] Sync fehlgeschlagen: ${error.message}`);
});
