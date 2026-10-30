/**
 * Scheduled check (every 10 minutes): when the Netlify account has a site or a
 * feedback submission that the deployed data/site-data.json does not know yet,
 * start a new build. The build runs scripts/sync-netlify.mjs, so the new
 * website shows up on the page without any manual step.
 */
const API = "https://api.netlify.com/api/v1";

const normalizeUrl = (value) => String(value ?? "").trim().replace(/\/+$/, "").toLowerCase();
const siteUrl = (site) => [site.ssl_url, site.url, site.deploy_url].find((value) => /^https?:\/\//.test(value ?? "")) ?? null;

export default async (_request, context) => {
  const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_PERSONAL_ACCESS_TOKEN;
  const siteId = context?.site?.id || process.env.SITE_ID;
  const siteOrigin = context?.site?.url || process.env.URL;
  if (!token || !siteId || !siteOrigin) {
    console.log("[auto-sync] Token, Site-ID oder URL fehlt – übersprungen.");
    return new Response("skipped", { status: 200 });
  }
  const headers = { Authorization: `Bearer ${token}` };
  const api = async (path, init) => {
    const response = await fetch(`${API}${path}`, { ...init, headers });
    if (!response.ok) throw new Error(`${path} -> ${response.status}`);
    return response.json();
  };

  const snapshot = await (await fetch(`${siteOrigin}/data/site-data.json?t=${Date.now()}`)).json();
  const known = new Set([...(snapshot.websites ?? []).map((site) => site.url), ...(snapshot.excludedUrls ?? [])].map(normalizeUrl));
  const knownSubmissions = new Set([
    ...(snapshot.feedback ?? []).map((item) => item.submissionId).filter(Boolean),
    ...(snapshot.excludedFeedbackSubmissions ?? []),
  ]);

  const sites = await api("/sites?filter=all&per_page=100");
  const newSites = sites.filter((site) => site.name && siteUrl(site) && !known.has(normalizeUrl(siteUrl(site))));
  const submissions = await api(`/sites/${siteId}/submissions?per_page=100`).catch(() => []);
  const newFeedback = submissions.filter((item) => item.form_name === "feedback" && !knownSubmissions.has(item.id));

  if (!newSites.length && !newFeedback.length) {
    console.log("[auto-sync] Nichts Neues.");
    return new Response("up to date", { status: 200 });
  }

  const [latest] = await api(`/sites/${siteId}/deploys?per_page=1`);
  if (latest && ["new", "enqueued", "building", "uploading", "preparing", "processing"].includes(latest.state)) {
    console.log("[auto-sync] Build läuft bereits.");
    return new Response("build running", { status: 200 });
  }

  await api(`/sites/${siteId}/builds`, { method: "POST" });
  console.log(`[auto-sync] Neuer Build gestartet: ${newSites.map((site) => site.name).join(", ") || "-"} / ${newFeedback.length} Feedback.`);
  return new Response("build triggered", { status: 200 });
};

export const config = { schedule: "*/10 * * * *" };
