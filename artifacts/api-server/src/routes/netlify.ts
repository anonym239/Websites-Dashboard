import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, activitiesTable, websitesTable } from "@workspace/db";
import { ImportNetlifyWebsitesResponse } from "@workspace/api-zod";
import { getCurrentUser, hasRole, requireUser } from "../lib/auth";

const router: IRouter = Router();
const NETLIFY_API_URL = "https://api.netlify.com/api/v1/sites";
const PAGE_SIZE = 100;

type NetlifyRepo = {
  provider?: string;
  repo_path?: string;
  repo_url?: string;
  url?: string;
};

type NetlifySite = {
  name?: string;
  url?: string;
  ssl_url?: string;
  deploy_url?: string;
  screenshot_url?: string;
  description?: string;
  state?: string;
  repo?: NetlifyRepo | null;
  build_settings?: { repo_url?: string } | null;
};

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "").toLowerCase();
}

function getSiteUrl(site: NetlifySite) {
  const candidate = [site.ssl_url, site.url, site.deploy_url].find(isHttpUrl);
  return candidate ?? null;
}

function getGithubUrl(site: NetlifySite) {
  const repo = site.repo;
  if (isHttpUrl(repo?.repo_url)) return repo.repo_url;
  if (isHttpUrl(repo?.url)) return repo.url;
  if (repo?.provider === "github" && repo.repo_path) {
    return `https://github.com/${repo.repo_path.replace(/^\/+/, "")}`;
  }
  if (isHttpUrl(site.build_settings?.repo_url)) return site.build_settings.repo_url;
  return null;
}

async function fetchNetlifySites(token: string): Promise<NetlifySite[]> {
  const sites: NetlifySite[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const response = await fetch(`${NETLIFY_API_URL}?per_page=${PAGE_SIZE}&page=${page}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Netlify API returned ${response.status}`);
    }
    const pageSites = (await response.json()) as unknown;
    if (!Array.isArray(pageSites)) throw new Error("Netlify API returned an unexpected response");
    sites.push(...(pageSites as NetlifySite[]));
    if (pageSites.length < PAGE_SIZE) break;
  }
  return sites;
}

router.post("/netlify/import", requireUser, async (req, res): Promise<void> => {
  const user = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!user || !hasRole(user, ["admin", "moderator"])) {
    res.status(403).json({ error: "Admin or moderator role required" });
    return;
  }

  const token = process.env.NETLIFY_PERSONAL_ACCESS_TOKEN;
  if (!token) {
    res.status(503).json({ error: "Netlify token is not configured" });
    return;
  }

  try {
    const sites = await fetchNetlifySites(token);
    const existing = await db.select().from(websitesTable);
    const existingByUrl = new Map(existing.map((website) => [normalizeUrl(website.url), website]));
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const site of sites) {
      const url = getSiteUrl(site);
      if (!url || !site.name?.trim()) {
        skipped += 1;
        continue;
      }

      const normalizedUrl = normalizeUrl(url);
      const current = existingByUrl.get(normalizedUrl);
      const values = {
        name: site.name.trim(),
        url,
        githubUrl: getGithubUrl(site),
        imageUrl: isHttpUrl(site.screenshot_url) ? site.screenshot_url : null,
        description: site.description?.trim() || null,
        status: site.state === "ready" ? "live" : "draft",
        ownerId: user.id,
        ownerName: user.name,
        updatedAt: new Date(),
      } as const;

      if (current) {
        await db
          .update(websitesTable)
          .set(values)
          .where(and(eq(websitesTable.id, current.id), eq(websitesTable.url, current.url)));
        updated += 1;
      } else {
        const [created] = await db
          .insert(websitesTable)
          .values({ ...values, visits: 0 })
          .returning();
        existingByUrl.set(normalizedUrl, created);
        imported += 1;
      }
    }

    await db.insert(activitiesTable).values({
      type: "netlify_imported",
      message: `${imported + updated} Netlify-Projekte synchronisiert`,
      actorName: user.name,
    });

    res.json(ImportNetlifyWebsitesResponse.parse({ imported, updated, skipped, total: sites.length }));
  } catch (error) {
    req.log.error({ error }, "Netlify import failed");
    res.status(502).json({ error: "Netlify-Projekte konnten nicht geladen werden." });
  }
});

export default router;