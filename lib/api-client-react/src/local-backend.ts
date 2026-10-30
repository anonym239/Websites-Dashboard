/**
 * Browser-only backend.
 *
 * Answers every `/api/*` request of the generated client without a server or
 * database. Data lives in localStorage and is seeded from the static snapshot
 * `data/site-data.json`, which the Netlify build and the GitHub Action keep in
 * sync with the Netlify account. Admins can publish local changes back to that
 * snapshot through the GitHub Contents API, which triggers a Netlify redeploy.
 */

export type ApiMode = "auto" | "server" | "local";

export type LocalIdentity = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

type Role = "admin" | "moderator" | "member";
type WebsiteStatus = "live" | "draft" | "paused";

type WebsiteRecord = {
  id: number;
  name: string;
  url: string;
  githubUrl: string | null;
  imageUrl: string | null;
  description: string | null;
  status: WebsiteStatus;
  visits: number;
  updatedAt: string;
  ownerName: string;
};

type EventRecord = {
  id: number;
  title: string;
  message: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type FeedbackRecord = {
  id: number;
  teacherName: string;
  feedback: string;
  rating: number;
  createdAt: string;
  isVisible: boolean;
  submissionId?: string | null;
  /** Submitted in this browser and not yet part of the published snapshot. */
  local?: boolean;
};

type ReportRecord = {
  id: number;
  feedbackId: number;
  reason: string;
  details: string | null;
  status: "open" | "reviewed" | "dismissed";
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

type FeedbackHistoryRecord = {
  id: number;
  feedbackId: number;
  action: "published" | "hidden" | "deleted";
  reason: string | null;
  actorId: string;
  actorName: string;
  createdAt: string;
};

type ActivityRecord = { id: number; type: string; message: string; actorName: string; createdAt: string };

type UserRecord = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: Role;
  joinedAt: string;
  lastActiveAt: string;
  profileVisibility: "private" | "public";
};

type RequestRecord = {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  message: string;
  status: "open" | "in_progress" | "closed" | "withdrawn";
  createdAt: string;
  updatedAt: string;
};

type RequestHistoryRecord = {
  id: number;
  requestId: number;
  status: RequestRecord["status"];
  message: string;
  actorId: string;
  actorName: string;
  createdAt: string;
};

type NotificationRecord = { id: number; userId: string; title: string; message: string; isRead: boolean; createdAt: string };

export type SiteSnapshot = {
  version: 1;
  updatedAt: string;
  websites: WebsiteRecord[];
  events: EventRecord[];
  feedback: FeedbackRecord[];
  excludedUrls: string[];
  excludedFeedbackSubmissions: string[];
};

type LocalState = {
  snapshotUpdatedAt: string | null;
  /** True while the admin has changes that are not yet published. */
  dirty: boolean;
  nextId: number;
  websites: WebsiteRecord[];
  events: EventRecord[];
  feedback: FeedbackRecord[];
  excludedUrls: string[];
  excludedFeedbackSubmissions: string[];
  reports: ReportRecord[];
  feedbackHistory: FeedbackHistoryRecord[];
  activities: ActivityRecord[];
  users: UserRecord[];
  favorites: Record<string, number[]>;
  requests: RequestRecord[];
  requestHistory: RequestHistoryRecord[];
  notifications: NotificationRecord[];
};

export type PublishSettings = {
  githubToken: string;
  githubRepo: string;
  githubBranch: string;
  snapshotPath: string;
  netlifyToken: string;
};

export type LocalBackendConfig = {
  mode: ApiMode;
  snapshotUrl: string;
  adminEmails: string[];
  defaultRepo: string;
  defaultBranch: string;
  defaultSnapshotPath: string;
};

const STATE_KEY = "webspace.local-db.v1";
const SETTINGS_KEY = "webspace.publish-settings.v1";
const NETLIFY_API = "https://api.netlify.com/api/v1";

let config: LocalBackendConfig = {
  mode: "auto",
  snapshotUrl: "/data/site-data.json",
  adminEmails: [],
  defaultRepo: "",
  defaultBranch: "main",
  defaultSnapshotPath: "",
};
let identityGetter: () => LocalIdentity | null = () => null;
let resolvedMode: Promise<"server" | "local"> | null = null;
let statePromise: Promise<LocalState> | null = null;
const listeners = new Set<() => void>();

export function configureLocalBackend(next: Partial<LocalBackendConfig>): void {
  config = { ...config, ...next, adminEmails: (next.adminEmails ?? config.adminEmails).map(normalizeEmail) };
  resolvedMode = null;
}

export function setLocalIdentityGetter(getter: () => LocalIdentity | null): void {
  identityGetter = getter;
}

/** Notifies when the local data or its publish state changes. */
export function subscribeLocalBackend(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  listeners.forEach((listener) => listener());
}

// ---------------------------------------------------------------------------
// Mode detection
// ---------------------------------------------------------------------------

export function resolveApiMode(): Promise<"server" | "local"> {
  if (config.mode === "local") return Promise.resolve("local");
  if (config.mode === "server") return Promise.resolve("server");
  resolvedMode ??= probeServer();
  return resolvedMode;
}

/** Switches the rest of the session to the browser backend. */
export function markServerUnavailable(): void {
  if (config.mode === "server") return;
  resolvedMode = Promise.resolve("local");
  emit();
}

export async function getActiveApiMode(): Promise<"server" | "local"> {
  return resolveApiMode();
}

async function probeServer(): Promise<"server" | "local"> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch("/api/healthz", { signal: controller.signal, headers: { accept: "application/json" } });
    if (!response.ok || !(response.headers.get("content-type") ?? "").includes("json")) return "local";
    const body = (await response.json()) as { status?: string };
    return body?.status === "ok" ? "server" : "local";
  } catch {
    return "local";
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

function emptyState(): LocalState {
  return {
    snapshotUpdatedAt: null,
    dirty: false,
    nextId: 1,
    websites: [],
    events: [],
    feedback: [],
    excludedUrls: [],
    excludedFeedbackSubmissions: [],
    reports: [],
    feedbackHistory: [],
    activities: [],
    users: [],
    favorites: {},
    requests: [],
    requestHistory: [],
    notifications: [],
  };
}

function readStoredState(): LocalState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? { ...emptyState(), ...(JSON.parse(raw) as Partial<LocalState>) } : null;
  } catch {
    return null;
  }
}

let memoryState: LocalState | null = null;

function persist(state: LocalState) {
  memoryState = state;
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked (private mode); the in-memory copy still works.
  }
  emit();
}

async function fetchSnapshot(): Promise<SiteSnapshot | null> {
  try {
    const response = await fetch(`${config.snapshotUrl}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<SiteSnapshot>;
    return {
      version: 1,
      updatedAt: data.updatedAt ?? new Date(0).toISOString(),
      websites: data.websites ?? [],
      events: data.events ?? [],
      feedback: (data.feedback ?? []).map((item) => ({ ...item, isVisible: item.isVisible ?? true })),
      excludedUrls: data.excludedUrls ?? [],
      excludedFeedbackSubmissions: data.excludedFeedbackSubmissions ?? [],
    };
  } catch {
    return null;
  }
}

function maxId(state: LocalState) {
  const ids = [
    ...state.websites, ...state.events, ...state.feedback, ...state.reports, ...state.feedbackHistory,
    ...state.activities, ...state.requests, ...state.requestHistory, ...state.notifications,
  ].map((item) => item.id);
  return ids.length ? Math.max(...ids) : 0;
}

/** Merges the published snapshot into the local copy without losing unpublished work. */
function mergeSnapshot(state: LocalState, snapshot: SiteSnapshot): LocalState {
  const next = { ...state };
  const excluded = new Set([...state.excludedUrls, ...snapshot.excludedUrls].map(normalizeUrl));
  const visibleSites = snapshot.websites.filter((site) => !excluded.has(normalizeUrl(site.url)));
  if (state.dirty) {
    // Keep the admin's unpublished edits, but still pick up newly deployed sites and feedback.
    const published = new Map(visibleSites.map((site) => [normalizeUrl(site.url), site]));
    const knownFeedback = new Set(state.feedback.map(feedbackKey));
    // Screenshots and repository links come from Netlify, so refresh them even on edited entries.
    const refreshed = state.websites.map((site) => {
      const source = published.get(normalizeUrl(site.url));
      return source ? { ...site, imageUrl: source.imageUrl ?? site.imageUrl, githubUrl: site.githubUrl ?? source.githubUrl } : site;
    });
    const knownUrls = new Set(state.websites.map((site) => normalizeUrl(site.url)));
    next.websites = [...refreshed, ...visibleSites.filter((site) => !knownUrls.has(normalizeUrl(site.url)))];
    next.feedback = [...state.feedback, ...snapshot.feedback.filter((item) => !knownFeedback.has(feedbackKey(item)))];
  } else {
    const published = new Set(snapshot.feedback.map(feedbackKey));
    next.websites = visibleSites;
    next.events = snapshot.events;
    next.feedback = [...snapshot.feedback, ...state.feedback.filter((item) => item.local && !published.has(feedbackKey(item)))];
    next.excludedUrls = [...excluded];
    next.excludedFeedbackSubmissions = snapshot.excludedFeedbackSubmissions;
  }
  next.websites = withUniqueIds(next.websites, state.nextId);
  next.feedback = withUniqueIds(next.feedback, state.nextId + next.websites.length);
  next.snapshotUpdatedAt = snapshot.updatedAt;
  next.nextId = Math.max(state.nextId, maxId(next) + 1);
  return next;
}

/** Snapshot and local records come from different id sequences; re-number collisions. */
function withUniqueIds<T extends { id: number }>(items: T[], floor: number): T[] {
  const seen = new Set<number>();
  let fresh = Math.max(floor, ...items.map((item) => item.id), 0) + 1;
  return items.map((item) => {
    if (item.id > 0 && !seen.has(item.id)) {
      seen.add(item.id);
      return item;
    }
    const id = fresh++;
    seen.add(id);
    return { ...item, id };
  });
}

async function loadState(): Promise<LocalState> {
  const stored = memoryState ?? readStoredState() ?? emptyState();
  const snapshot = await fetchSnapshot();
  const state = snapshot && snapshot.updatedAt !== stored.snapshotUpdatedAt ? mergeSnapshot(stored, snapshot) : stored;
  state.nextId = Math.max(state.nextId, maxId(state) + 1);
  persist(state);
  return state;
}

function getState(): Promise<LocalState> {
  statePromise ??= loadState();
  return statePromise.then(() => memoryState ?? emptyState());
}

function update(mutator: (state: LocalState) => void, publicChange = false): LocalState {
  const state = structuredClone(memoryState ?? emptyState());
  mutator(state);
  if (publicChange) state.dirty = true;
  persist(state);
  return state;
}

function nextId(state: LocalState) {
  const id = state.nextId;
  state.nextId += 1;
  return id;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeUrl(value: string) {
  return value.trim().replace(/\/+$/, "").toLowerCase();
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function feedbackKey(item: Pick<FeedbackRecord, "teacherName" | "feedback" | "submissionId">) {
  return item.submissionId ?? `${normalizeText(item.teacherName)}|${normalizeText(item.feedback)}`;
}

function now() {
  return new Date().toISOString();
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function currentUser(state: LocalState): UserRecord | null {
  const identity = identityGetter();
  if (!identity) return null;
  const email = normalizeEmail(identity.email);
  return state.users.find((user) => user.id === identity.id) ?? state.users.find((user) => normalizeEmail(user.email) === email) ?? null;
}

function requireUser(): UserRecord {
  const identity = identityGetter();
  if (!identity) throw new HttpError(401, "Bitte melde dich an.");
  let user: UserRecord | null = null;
  update((state) => {
    const existing = currentUser(state);
    const isBootstrapAdmin = config.adminEmails.includes(normalizeEmail(identity.email));
    if (existing) {
      existing.name = identity.name || existing.name;
      existing.email = identity.email;
      existing.avatarUrl = identity.avatarUrl ?? existing.avatarUrl;
      existing.lastActiveAt = now();
      if (isBootstrapAdmin) existing.role = "admin";
      user = existing;
      return;
    }
    const created: UserRecord = {
      id: identity.id,
      name: identity.name || identity.email,
      email: identity.email,
      avatarUrl: identity.avatarUrl ?? null,
      role: isBootstrapAdmin ? "admin" : "member",
      joinedAt: now(),
      lastActiveAt: now(),
      profileVisibility: "private",
    };
    state.users.push(created);
    state.activities.unshift({ id: nextId(state), type: "user_joined", message: `${created.name} ist beigetreten`, actorName: created.name, createdAt: now() });
    user = created;
  });
  return user!;
}

function requireRole(roles: Role[]): UserRecord {
  const user = requireUser();
  if (!roles.includes(user.role)) throw new HttpError(403, "Keine Berechtigung für diese Aktion.");
  return user;
}

function logActivity(state: LocalState, type: string, message: string, actorName: string) {
  state.activities.unshift({ id: nextId(state), type, message, actorName, createdAt: now() });
  state.activities = state.activities.slice(0, 300);
}

function notify(state: LocalState, userId: string, title: string, message: string) {
  state.notifications.unshift({ id: nextId(state), userId, title, message, isRead: false, createdAt: now() });
}

function publicFeedback(item: FeedbackRecord) {
  return { id: item.id, teacherName: item.teacherName, feedback: item.feedback, rating: item.rating, createdAt: item.createdAt };
}

function publicUser(user: UserRecord) {
  return { ...user };
}

/** Sends a copy to Netlify Forms so the submission reaches the admin without a server. */
function submitNetlifyForm(formName: string, fields: Record<string, string | number | null | undefined>) {
  if (typeof window === "undefined" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)) return;
  const body = new URLSearchParams({ "form-name": formName });
  Object.entries(fields).forEach(([key, value]) => body.set(key, value == null ? "" : String(value)));
  fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Netlify sync (browser)
// ---------------------------------------------------------------------------

type NetlifySite = {
  name?: string;
  url?: string;
  ssl_url?: string;
  deploy_url?: string;
  screenshot_url?: string;
  state?: string;
  repo?: { provider?: string; repo_path?: string; repo_url?: string; url?: string } | null;
  build_settings?: { repo_url?: string; repo_path?: string; provider?: string } | null;
};

function netlifySiteUrl(site: NetlifySite) {
  return [site.ssl_url, site.url, site.deploy_url].find(isHttpUrl) ?? null;
}

function netlifyGithubUrl(site: NetlifySite) {
  const repo = site.repo ?? site.build_settings;
  if (isHttpUrl(site.repo?.repo_url)) return site.repo!.repo_url!;
  if (isHttpUrl(site.repo?.url)) return site.repo!.url!;
  if (isHttpUrl(site.build_settings?.repo_url)) return site.build_settings!.repo_url!;
  if (repo?.provider === "github" && repo.repo_path) return `https://github.com/${repo.repo_path.replace(/^\/+/, "")}`;
  return null;
}

async function fetchNetlifySites(token: string): Promise<NetlifySite[]> {
  const sites: NetlifySite[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const response = await fetch(`${NETLIFY_API}/sites?per_page=100&page=${page}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new HttpError(502, `Netlify antwortet mit ${response.status}.`);
    const pageSites = (await response.json()) as NetlifySite[];
    sites.push(...pageSites);
    if (pageSites.length < 100) break;
  }
  return sites;
}

function mergeNetlifySites(state: LocalState, sites: NetlifySite[], actorName: string) {
  const excluded = new Set(state.excludedUrls.map(normalizeUrl));
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  for (const site of sites) {
    const url = netlifySiteUrl(site);
    if (!url || !site.name?.trim() || excluded.has(normalizeUrl(url))) {
      skipped += 1;
      continue;
    }
    const existing = state.websites.find((item) => normalizeUrl(item.url) === normalizeUrl(url));
    if (existing) {
      existing.imageUrl = isHttpUrl(site.screenshot_url) ? site.screenshot_url : existing.imageUrl;
      existing.githubUrl = existing.githubUrl ?? netlifyGithubUrl(site);
      existing.updatedAt = now();
      updated += 1;
    } else {
      state.websites.push({
        id: nextId(state),
        name: site.name.trim(),
        url,
        githubUrl: netlifyGithubUrl(site),
        imageUrl: isHttpUrl(site.screenshot_url) ? site.screenshot_url : null,
        description: null,
        status: site.state === "ready" || site.state === "current" ? "live" : "draft",
        visits: 0,
        updatedAt: now(),
        ownerName: actorName,
      });
      imported += 1;
    }
  }
  logActivity(state, "netlify_imported", `${imported + updated} Netlify-Projekte synchronisiert`, actorName);
  return { imported, updated, skipped, total: sites.length };
}

async function importFromNetlify(user: UserRecord) {
  const { netlifyToken } = getPublishSettings();
  if (netlifyToken) {
    const sites = await fetchNetlifySites(netlifyToken);
    let result = { imported: 0, updated: 0, skipped: 0, total: 0 };
    update((state) => { result = mergeNetlifySites(state, sites, user.name); }, true);
    return result;
  }
  // Without a token the latest deployed snapshot is the source of truth: it is
  // refreshed by every Netlify build and by the scheduled GitHub Action.
  const before = new Set((memoryState?.websites ?? []).map((site) => normalizeUrl(site.url)));
  const snapshot = await fetchSnapshot();
  if (!snapshot) throw new HttpError(502, "Die veröffentlichten Projektdaten konnten nicht geladen werden.");
  let imported = 0;
  update((state) => {
    const merged = mergeSnapshot({ ...state, dirty: true }, snapshot);
    Object.assign(state, merged, { dirty: state.dirty });
    imported = state.websites.filter((site) => !before.has(normalizeUrl(site.url))).length;
    logActivity(state, "netlify_imported", `${imported} neue Netlify-Projekte übernommen`, user.name);
  });
  return { imported, updated: snapshot.websites.length - imported, skipped: 0, total: snapshot.websites.length };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

type Body = Record<string, unknown>;

async function route(method: string, path: string, body: Body): Promise<unknown> {
  const state = await getState();
  const segments = path.replace(/^\/api\/?/, "").replace(/\?.*$/, "").split("/").filter(Boolean);
  const pattern = segments.map((part, index) => (/^\d+$/.test(part) || (segments[0] === "users" && index === 1) ? ":id" : part));
  const key = `${method} /${pattern.join("/")}`;
  const id = Number(segments.find((part) => /^\d+$/.test(part)));

  switch (key) {
    case "GET /healthz":
      return { status: "ok" };

    // ---- Websites --------------------------------------------------------
    case "GET /websites":
      return [...state.websites].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case "POST /websites": {
      const user = requireRole(["admin"]);
      const name = String(body.name ?? "").trim();
      const url = String(body.url ?? "").trim();
      if (!name || !isHttpUrl(url)) throw new HttpError(400, "Bitte Name und gültige URL angeben.");
      let created: WebsiteRecord | null = null;
      update((s) => {
        created = {
          id: nextId(s), name, url,
          githubUrl: isHttpUrl(body.githubUrl) ? body.githubUrl : null,
          imageUrl: isHttpUrl(body.imageUrl) ? body.imageUrl : null,
          description: typeof body.description === "string" && body.description.trim() ? body.description.trim() : null,
          status: (body.status as WebsiteStatus) ?? "draft",
          visits: 0, updatedAt: now(), ownerName: user.name,
        };
        s.websites.push(created);
        s.excludedUrls = s.excludedUrls.filter((item) => normalizeUrl(item) !== normalizeUrl(url));
        logActivity(s, "website_added", `${name} wurde verknüpft`, user.name);
      }, true);
      return created;
    }
    case "PATCH /websites/:id": {
      const user = requireRole(["admin"]);
      let result: WebsiteRecord | undefined;
      update((s) => {
        result = s.websites.find((site) => site.id === id);
        if (!result) return;
        for (const field of ["name", "url", "githubUrl", "imageUrl", "description", "status"] as const) {
          if (field in body) (result as Record<string, unknown>)[field] = body[field] === "" ? null : body[field];
        }
        result.updatedAt = now();
        logActivity(s, "website_updated", `${result.name} wurde aktualisiert`, user.name);
      }, true);
      if (!result) throw new HttpError(404, "Website nicht gefunden.");
      return result;
    }
    case "DELETE /websites/:id": {
      const user = requireRole(["admin"]);
      const site = state.websites.find((item) => item.id === id);
      if (!site) throw new HttpError(404, "Website nicht gefunden.");
      update((s) => {
        s.websites = s.websites.filter((item) => item.id !== id);
        s.excludedUrls = [...new Set([...s.excludedUrls, site.url])];
        Object.keys(s.favorites).forEach((userId) => { s.favorites[userId] = s.favorites[userId].filter((item) => item !== id); });
        logActivity(s, "website_deleted", `${site.name} wurde entfernt`, user.name);
      }, true);
      return null;
    }
    case "POST /netlify/import":
      return importFromNetlify(requireRole(["admin"]));

    // ---- Events ----------------------------------------------------------
    case "GET /events/active":
      return state.events.filter((event) => event.isActive).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "GET /events/manage":
      requireRole(["admin"]);
      return [...state.events].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "POST /events": {
      const user = requireRole(["admin"]);
      let created: EventRecord | null = null;
      update((s) => {
        created = {
          id: nextId(s), title: String(body.title ?? "").trim(), message: String(body.message ?? "").trim(),
          imageUrl: isHttpUrl(body.imageUrl) ? body.imageUrl : null, isActive: body.isActive !== false,
          createdAt: now(), updatedAt: now(),
        };
        s.events.push(created);
        logActivity(s, "event_created", `Event „${created.title}“ erstellt`, user.name);
      }, true);
      return created;
    }
    case "PATCH /events/:id": {
      requireRole(["admin"]);
      let result: EventRecord | undefined;
      update((s) => {
        result = s.events.find((event) => event.id === id);
        if (!result) return;
        for (const field of ["title", "message", "imageUrl", "isActive"] as const) {
          if (field in body) (result as Record<string, unknown>)[field] = body[field];
        }
        result.updatedAt = now();
      }, true);
      if (!result) throw new HttpError(404, "Event nicht gefunden.");
      return result;
    }
    case "DELETE /events/:id":
      requireRole(["admin"]);
      update((s) => { s.events = s.events.filter((event) => event.id !== id); }, true);
      return null;

    // ---- Feedback --------------------------------------------------------
    case "GET /feedback":
      return state.feedback.filter((item) => item.isVisible).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(publicFeedback);
    case "GET /feedback/stats": {
      const visible = state.feedback.filter((item) => item.isVisible);
      const countOf = (rating: number) => visible.filter((item) => item.rating === rating).length;
      return {
        averageRating: visible.length ? Math.round((visible.reduce((sum, item) => sum + item.rating, 0) / visible.length) * 10) / 10 : 0,
        totalCount: visible.length,
        distribution: { fiveStars: countOf(5), fourStars: countOf(4), threeStars: countOf(3), twoStars: countOf(2), oneStar: countOf(1) },
      };
    }
    case "POST /feedback": {
      const teacherName = String(body.teacherName ?? "").trim();
      const feedback = String(body.feedback ?? "").trim();
      const rating = Number(body.rating);
      if (teacherName.length < 2 || feedback.length < 3 || !(rating >= 1 && rating <= 5)) {
        throw new HttpError(400, "Bitte Name, Feedback und eine Bewertung von 1 bis 5 Sternen angeben.");
      }
      const recentOwn = state.feedback.filter((item) => item.local && Date.now() - Date.parse(item.createdAt) < 10 * 60_000);
      if (recentOwn.length >= 3) throw new HttpError(429, "Du hast gerade mehrere Rückmeldungen gesendet. Bitte versuche es in ein paar Minuten erneut.");
      if (state.feedback.some((item) => normalizeText(item.feedback) === normalizeText(feedback))) {
        throw new HttpError(409, "Diese Rückmeldung wurde bereits sehr ähnlich eingereicht. Bitte sende nur eine Version davon.");
      }
      let created: FeedbackRecord | null = null;
      update((s) => {
        created = { id: nextId(s), teacherName, feedback, rating, createdAt: now(), isVisible: true, local: true };
        s.feedback.push(created);
      });
      submitNetlifyForm("feedback", { teacherName, feedback, rating });
      return publicFeedback(created!);
    }
    case "GET /feedback/manage":
      requireRole(["admin", "moderator"]);
      return [...state.feedback].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((item) => ({ ...publicFeedback(item), isVisible: item.isVisible }));
    case "PATCH /feedback/:id": {
      const user = requireRole(["admin", "moderator"]);
      let result: FeedbackRecord | undefined;
      update((s) => {
        result = s.feedback.find((item) => item.id === id);
        if (!result) return;
        result.isVisible = Boolean(body.isVisible);
        const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : null;
        s.feedbackHistory.unshift({ id: nextId(s), feedbackId: id, action: result.isVisible ? "published" : "hidden", reason, actorId: user.id, actorName: user.name, createdAt: now() });
        logActivity(s, result.isVisible ? "feedback_published" : "feedback_hidden", `${user.name} hat Feedback von ${result.teacherName} ${result.isVisible ? "veröffentlicht" : "ausgeblendet"}`, user.name);
      }, true);
      if (!result) throw new HttpError(404, "Feedback nicht gefunden.");
      return { ...publicFeedback(result), isVisible: result.isVisible };
    }
    case "DELETE /feedback/:id": {
      const user = requireRole(["admin"]);
      update((s) => {
        const item = s.feedback.find((entry) => entry.id === id);
        if (!item) return;
        s.feedback = s.feedback.filter((entry) => entry.id !== id);
        if (item.submissionId) s.excludedFeedbackSubmissions = [...new Set([...s.excludedFeedbackSubmissions, item.submissionId])];
        s.feedbackHistory.unshift({ id: nextId(s), feedbackId: id, action: "deleted", reason: null, actorId: user.id, actorName: user.name, createdAt: now() });
        logActivity(s, "feedback_deleted", `Feedback von ${item.teacherName} gelöscht`, user.name);
      }, true);
      return null;
    }
    case "GET /feedback/:id/history":
      requireRole(["admin", "moderator"]);
      return state.feedbackHistory.filter((entry) => entry.feedbackId === id);
    case "POST /feedback/:id/report": {
      if (!state.feedback.some((item) => item.id === id && item.isVisible)) throw new HttpError(404, "Feedback nicht gefunden.");
      if (state.reports.some((report) => report.feedbackId === id && report.status === "open")) throw new HttpError(409, "Diese Meldung liegt bereits vor.");
      let created: ReportRecord | null = null;
      update((s) => {
        created = {
          id: nextId(s), feedbackId: id, reason: String(body.reason ?? "other"),
          details: typeof body.details === "string" ? body.details : null,
          status: "open", reviewedBy: null, reviewedAt: null, createdAt: now(),
        };
        s.reports.unshift(created);
        logActivity(s, "feedback_reported", `Feedback #${id} wurde gemeldet`, "Besucher");
      });
      submitNetlifyForm("feedback-report", { feedbackId: id, reason: created!.reason, details: created!.details });
      return created;
    }
    case "GET /feedback/reports":
      requireRole(["admin", "moderator"]);
      return state.reports;
    case "PATCH /feedback/reports/:id": {
      const user = requireRole(["admin", "moderator"]);
      let result: ReportRecord | undefined;
      update((s) => {
        result = s.reports.find((report) => report.id === id);
        if (!result) return;
        result.status = body.status as ReportRecord["status"];
        result.reviewedBy = user.name;
        result.reviewedAt = now();
        logActivity(s, "feedback_report_resolved", `Meldung #${id} wurde bearbeitet`, user.name);
      });
      if (!result) throw new HttpError(404, "Meldung nicht gefunden.");
      return result;
    }

    // ---- Dashboard & users ----------------------------------------------
    case "GET /session/me":
      return publicUser(requireUser());
    case "GET /dashboard/summary": {
      requireUser();
      const s = memoryState!;
      const monthAgo = Date.now() - 30 * 86_400_000;
      return {
        totalWebsites: s.websites.length,
        liveWebsites: s.websites.filter((site) => site.status === "live").length,
        totalVisits: s.websites.reduce((sum, site) => sum + (site.visits ?? 0), 0),
        registeredUsers: s.users.length,
        openRequests: s.requests.filter((request) => request.status === "open").length,
        pendingFeedback: s.feedback.filter((item) => !item.isVisible).length,
        activeEvents: s.events.filter((event) => event.isActive).length,
        newMembers: s.users.filter((user) => Date.parse(user.joinedAt) > monthAgo).length,
        uptime: "100%",
      };
    }
    case "GET /dashboard/activity":
      requireUser();
      return memoryState!.activities.slice(0, 20);
    case "GET /admin/activity":
      requireRole(["admin"]);
      return state.activities;
    case "GET /users":
      requireRole(["admin"]);
      return memoryState!.users.map(publicUser);
    case "PATCH /users/:id/role": {
      const actor = requireRole(["admin"]);
      const userId = decodeURIComponent(segments[1] ?? "");
      let result: UserRecord | undefined;
      update((s) => {
        result = s.users.find((user) => user.id === userId);
        if (!result || result.id === actor.id || config.adminEmails.includes(normalizeEmail(result.email))) return;
        result.role = body.role as Role;
        logActivity(s, "role_changed", `${result.name} ist jetzt ${result.role}`, actor.name);
      });
      if (!result) throw new HttpError(404, "Person nicht gefunden.");
      return publicUser(result);
    }

    // ---- Member area ----------------------------------------------------
    case "GET /member/favorites": {
      const user = requireUser();
      const ids = memoryState!.favorites[user.id] ?? [];
      return memoryState!.websites.filter((site) => ids.includes(site.id));
    }
    case "POST /member/favorites/:id": {
      const user = requireUser();
      update((s) => { s.favorites[user.id] = [...new Set([...(s.favorites[user.id] ?? []), id])]; });
      return memoryState!.websites.find((site) => site.id === id) ?? null;
    }
    case "DELETE /member/favorites/:id": {
      const user = requireUser();
      update((s) => { s.favorites[user.id] = (s.favorites[user.id] ?? []).filter((item) => item !== id); });
      return null;
    }
    case "GET /member/requests": {
      const user = requireUser();
      return memoryState!.requests.filter((request) => request.userId === user.id);
    }
    case "POST /member/requests": {
      const user = requireUser();
      const message = String(body.message ?? "").trim();
      if (message.length < 3) throw new HttpError(400, "Bitte mindestens drei Zeichen eingeben.");
      let created: RequestRecord | null = null;
      update((s) => {
        created = { id: nextId(s), userId: user.id, userName: user.name, userEmail: user.email, message, status: "open", createdAt: now(), updatedAt: now() };
        s.requests.unshift(created);
        s.requestHistory.unshift({ id: nextId(s), requestId: created.id, status: "open", message: "Anfrage erstellt", actorId: user.id, actorName: user.name, createdAt: now() });
        logActivity(s, "member_request_created", `${user.name} hat eine Anfrage gesendet`, user.name);
      });
      submitNetlifyForm("member-request", { name: user.name, email: user.email, message });
      return created;
    }
    case "GET /member/requests/:id/history":
      requireUser();
      return state.requestHistory.filter((entry) => entry.requestId === id);
    case "PATCH /member/requests/:id":
    case "DELETE /member/requests/:id": {
      const user = requireUser();
      let result: RequestRecord | undefined;
      update((s) => {
        result = s.requests.find((request) => request.id === id && request.userId === user.id);
        if (!result) return;
        if (method === "PATCH" && typeof body.message === "string") result.message = body.message.trim();
        else {
          result.status = "withdrawn";
          s.requestHistory.unshift({ id: nextId(s), requestId: id, status: "withdrawn", message: "Anfrage zurückgezogen", actorId: user.id, actorName: user.name, createdAt: now() });
          logActivity(s, "member_request_withdrawn", `${user.name} hat eine Anfrage zurückgezogen`, user.name);
        }
        result.updatedAt = now();
      });
      if (!result) throw new HttpError(404, "Anfrage nicht gefunden.");
      return result;
    }
    case "GET /member/notifications": {
      const user = requireUser();
      return memoryState!.notifications.filter((item) => item.userId === user.id);
    }
    case "PATCH /member/notifications/:id/read": {
      const user = requireUser();
      let result: NotificationRecord | undefined;
      update((s) => {
        result = s.notifications.find((item) => item.id === id && item.userId === user.id);
        if (result) result.isRead = true;
      });
      if (!result) throw new HttpError(404, "Benachrichtigung nicht gefunden.");
      return result;
    }
    case "GET /member/profile": {
      const user = requireUser();
      return { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, role: user.role, profileVisibility: user.profileVisibility };
    }
    case "PATCH /member/profile": {
      const user = requireUser();
      let result: UserRecord | undefined;
      update((s) => {
        result = s.users.find((item) => item.id === user.id);
        if (result && (body.profileVisibility === "private" || body.profileVisibility === "public")) result.profileVisibility = body.profileVisibility;
        if (result) logActivity(s, "profile_updated", `${result.name} hat das Profil aktualisiert`, result.name);
      });
      return { id: result!.id, name: result!.name, email: result!.email, avatarUrl: result!.avatarUrl, role: result!.role, profileVisibility: result!.profileVisibility };
    }
    case "GET /requests/manage":
      requireRole(["admin"]);
      return state.requests;
    case "PATCH /requests/:id/status": {
      const user = requireRole(["admin"]);
      let result: RequestRecord | undefined;
      update((s) => {
        result = s.requests.find((request) => request.id === id);
        if (!result) return;
        result.status = body.status as RequestRecord["status"];
        result.updatedAt = now();
        const label = result.status === "in_progress" ? "in Bearbeitung" : result.status === "closed" ? "erledigt" : "offen";
        s.requestHistory.unshift({ id: nextId(s), requestId: id, status: result.status, message: `Status: ${label}`, actorId: user.id, actorName: user.name, createdAt: now() });
        notify(s, result.userId, "Anfrage aktualisiert", `Deine Anfrage ist jetzt ${label}.`);
        logActivity(s, "member_request_updated", `Anfrage von ${result.userName} ist jetzt ${label}`, user.name);
      });
      if (!result) throw new HttpError(404, "Anfrage nicht gefunden.");
      return result;
    }
    case "DELETE /requests/:id":
      requireRole(["admin"]);
      update((s) => { s.requests = s.requests.filter((request) => request.id !== id); });
      return null;
  }

  throw new HttpError(404, `Unbekannter Endpunkt: ${method} ${path}`);
}

/** Handles an `/api/*` request locally and returns a regular `Response`. */
export async function handleLocalRequest(method: string, url: string, body: BodyInit | null | undefined): Promise<Response> {
  let parsed: Body = {};
  if (typeof body === "string" && body.trim()) {
    try {
      parsed = JSON.parse(body) as Body;
    } catch {
      parsed = {};
    }
  }
  const path = url.replace(/^https?:\/\/[^/]+/, "");
  try {
    const data = await route(method.toUpperCase(), path, parsed);
    if (data === null || data === undefined) return new Response(null, { status: 204 });
    return new Response(JSON.stringify(data), { status: method === "POST" ? 201 : 200, headers: { "content-type": "application/json" } });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    return new Response(JSON.stringify({ error: message }), { status, headers: { "content-type": "application/json" } });
  }
}

// ---------------------------------------------------------------------------
// Publishing
// ---------------------------------------------------------------------------

export function getPublishSettings(): PublishSettings {
  const defaults: PublishSettings = {
    githubToken: "",
    githubRepo: config.defaultRepo,
    githubBranch: config.defaultBranch,
    snapshotPath: config.defaultSnapshotPath,
    netlifyToken: "",
  };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<PublishSettings>) } : defaults;
  } catch {
    return defaults;
  }
}

export function savePublishSettings(settings: Partial<PublishSettings>): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...getPublishSettings(), ...settings }));
  } catch {
    // Ignore blocked storage; the settings then only last for this call.
  }
  emit();
}

export type LocalStatus = { dirty: boolean; snapshotUpdatedAt: string | null; websites: number };

export function getLocalStatus(): LocalStatus {
  const state = memoryState ?? readStoredState() ?? emptyState();
  return { dirty: state.dirty, snapshotUpdatedAt: state.snapshotUpdatedAt, websites: state.websites.length };
}

export function buildSnapshot(): SiteSnapshot {
  const state = memoryState ?? emptyState();
  return {
    version: 1,
    updatedAt: now(),
    websites: state.websites,
    events: state.events,
    feedback: state.feedback.filter((item) => item.isVisible).map(({ local: _local, ...item }) => item),
    excludedUrls: state.excludedUrls,
    excludedFeedbackSubmissions: state.excludedFeedbackSubmissions,
  };
}

/** Downloads the current data as JSON so it can be committed by hand. */
export function exportSnapshotJson(): string {
  return `${JSON.stringify(buildSnapshot(), null, 2)}\n`;
}

function toBase64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

/**
 * Commits the current data to GitHub. Netlify rebuilds on every push, so the
 * public site shows the change after the next deploy (usually 1–2 minutes).
 */
export async function publishToGitHub(): Promise<{ commitUrl: string | null }> {
  await getState();
  const settings = getPublishSettings();
  if (!settings.githubToken) throw new Error("Bitte zuerst einen GitHub-Token hinterlegen.");
  if (!/^[\w.-]+\/[\w.-]+$/.test(settings.githubRepo)) throw new Error("Das Repository muss die Form besitzer/name haben.");
  const endpoint = `https://api.github.com/repos/${settings.githubRepo}/contents/${settings.snapshotPath}`;
  const headers = { Authorization: `Bearer ${settings.githubToken}`, Accept: "application/vnd.github+json" };
  const existing = await fetch(`${endpoint}?ref=${encodeURIComponent(settings.githubBranch)}`, { headers });
  if (existing.status === 401 || existing.status === 403) throw new Error("GitHub hat den Token abgelehnt. Prüfe die Berechtigung „Contents: Read and write“.");
  const sha = existing.ok ? ((await existing.json()) as { sha?: string }).sha : undefined;
  const snapshot = buildSnapshot();
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `Projektdaten aktualisiert (${snapshot.websites.length} Websites)`,
      content: toBase64(`${JSON.stringify(snapshot, null, 2)}\n`),
      branch: settings.githubBranch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!response.ok) {
    const detail = ((await response.json().catch(() => ({}))) as { message?: string }).message;
    throw new Error(`GitHub-Upload fehlgeschlagen (${response.status}${detail ? `: ${detail}` : ""}).`);
  }
  const result = (await response.json()) as { commit?: { html_url?: string } };
  update((s) => {
    s.dirty = false;
    s.snapshotUpdatedAt = snapshot.updatedAt;
    s.feedback = s.feedback.map((item) => ({ ...item, local: false }));
  });
  return { commitUrl: result.commit?.html_url ?? null };
}

/** Drops unpublished local changes and reloads the deployed snapshot. */
export async function resetLocalData(): Promise<void> {
  memoryState = null;
  try {
    localStorage.removeItem(STATE_KEY);
  } catch {
    // Nothing stored.
  }
  statePromise = loadState();
  await statePromise;
}
