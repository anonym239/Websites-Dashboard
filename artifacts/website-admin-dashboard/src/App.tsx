import { useEffect, useMemo, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, UserProfile, useClerk, useUser } from "@clerk/react";
import { deDE } from "@clerk/localizations";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import {
  Activity as ActivityIcon,
  ArrowDown,
  ArrowUpRight,
  Bell,
  Check,
  CircleAlert,
  CircleGauge,
  CirclePlus,
  CloudDownload,
  Eye,
  EyeOff,
  ExternalLink,
  Github,
  Globe2,
  Heart,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MoreHorizontal,
  MessageSquareText,
  Pencil,
  RefreshCw,
  Search,
  Send,
  Server,
  ShieldCheck,
  Star,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  AppUserRole,
  type Activity,
  type AppUser,
  type Event,
  type FeedbackModerationHistory,
  type FeedbackReport,
  type FeedbackStats,
  type ManagedFeedback,
  type MemberRequestHistory,
  getListManagedEventsQueryKey,
  getListManagedFeedbackQueryKey,
  getListManagedMemberRequestsQueryKey,
  getListAdminActivityQueryKey,
  getListFeedbackHistoryQueryKey,
  getListFeedbackReportsQueryKey,
  getGetMemberProfileQueryKey,
  getListMemberRequestHistoryQueryKey,
  getListMemberFavoritesQueryKey,
  getListMemberNotificationsQueryKey,
  getListMemberRequestsQueryKey,
  type Website,
  useCreateEvent,
  useDeleteFeedback,
  useDeleteEvent,
  useDeleteManagedMemberRequest,
  getListFeedbackQueryKey,
  useCreateWebsite,
  useDeleteWebsite,
  useGetCurrentUser,
  useGetDashboardSummary,
  getGetFeedbackStatsQueryKey,
  useImportNetlifyWebsites,
  useListActivity,
  useListAdminActivity,
  useListActiveEvents,
  useListFeedback,
  useListManagedEvents,
  useListManagedFeedback,
  useListUsers,
  useListWebsites,
  useCreateFeedback,
  useCreateFeedbackReport,
  useGetFeedbackStats,
  useCreateMemberFavorite,
  useCreateMemberRequest,
  useDeleteMemberFavorite,
  useListManagedMemberRequests,
  useListMemberFavorites,
  useListMemberNotifications,
  useListMemberRequests,
  useMarkMemberNotificationRead,
  useGetMemberProfile,
  useUpdateMemberProfile,
  useListMemberRequestHistory,
  useUpdateMemberRequest,
  useWithdrawMemberRequest,
  useUpdateMemberRequestStatus,
  useUpdateFeedback,
  useListFeedbackHistory,
  useListFeedbackReports,
  useUpdateFeedbackReport,
  useUpdateEvent,
  useUpdateUserRole,
  useUpdateWebsite,
  getGetDashboardSummaryQueryKey,
  getListActivityQueryKey,
  getListUsersQueryKey,
  getListWebsitesQueryKey,
} from "@workspace/api-client-react";
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation, useRoute } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";
import NotFound from "@/pages/not-found";
import "./index.css";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const bootstrapAdminEmail = "alexanderfuchs304@gmail.com";

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#1cae85",
    colorForeground: "#eef2f7",
    colorMutedForeground: "#667487",
    colorBackground: "#151c29",
    colorInput: "#1f2a3d",
    colorInputForeground: "#eef2f7",
    colorDanger: "#d84b43",
    colorNeutral: "#344257",
    fontFamily: "Manrope, sans-serif",
    borderRadius: "0.7rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#151c29] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#eef2f7] font-extrabold",
    headerSubtitle: "text-[#aab6c6]",
    socialButtonsBlockButtonText: "!text-[#182433] font-semibold",
    formFieldLabel: "text-[#eef2f7] font-semibold",
    footerActionLink: "text-[#63dbb4] font-bold",
    footerActionText: "text-[#aab6c6]",
    dividerText: "text-[#aab6c6]",
    formButtonPrimary: "bg-[#1cae85] hover:bg-[#158363] text-[#14231f] font-bold",
    formFieldInput: "bg-[#1f2a3d] border-[#344257] text-[#eef2f7]",
    socialButtonsBlockButton: "!border-[#dce4e9] !bg-white hover:!bg-[#f3f6f8]",
    footerAction: "border-t border-[#344257]",
    dividerLine: "bg-[#344257]",
    alert: "border-[#6d373e] bg-[#321f27]",
    alertText: "text-[#ffaaa9]",
    logoBox: "h-10",
    logoImage: "h-10",
    otpCodeFieldInput: "bg-[#1f2a3d] border-[#344257]",
    formFieldRow: "gap-2",
    main: "gap-5",
  },
};

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" data-testid="brand-mark">
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_20px_hsl(var(--primary)/.22)]">
        <span className="absolute h-3 w-3 rounded-[4px] bg-current opacity-90" />
        <span className="absolute h-3 w-3 translate-x-2 translate-y-2 rounded-[4px] bg-current opacity-60" />
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="text-[15px] font-extrabold tracking-[-.03em] text-sidebar-accent-foreground">Webspace</div>
          <div className="mono-label mt-1 text-[9px] text-sidebar-foreground/60">projektübersicht</div>
        </div>
      )}
    </div>
  );
}

function Home() {
  const queryClient = useQueryClient();
  const { isSignedIn, isLoaded } = useUser();
  const websites = useListWebsites();
  const teacherFeedback = useListFeedback();
  const feedbackStats = useGetFeedbackStats();
  const activeEvents = useListActiveEvents();
  const createFeedback = useCreateFeedback();
  const createFeedbackReport = useCreateFeedbackReport();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "draft" | "paused">("all");
  const [teacherName, setTeacherName] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState(0);
  const [feedbackNotice, setFeedbackNotice] = useState("");
  const [reportNotice, setReportNotice] = useState("");
  const [eventOpen, setEventOpen] = useState(true);
  const projects = websites.data ?? [];
  const visibleProjects = projects.filter((website) => {
    const matchesQuery = `${website.name} ${website.url} ${website.description ?? ""}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (statusFilter === "all" || website.status === statusFilter);
  });
  const liveProjects = projects.filter((website) => website.status === "live").length;
  const reportFeedback = (feedbackId: number) => {
    const details = window.prompt("Warum möchtest du dieses Feedback melden? (optional)");
    if (details === null) return;
    createFeedbackReport.mutate(
      { feedbackId, data: { reason: "other", details: details.trim() || null } },
      {
        onSuccess: () => setReportNotice("Danke. Die Meldung wurde zur Prüfung weitergeleitet."),
        onError: () => setReportNotice("Diese Meldung konnte nicht gespeichert werden."),
      },
    );
  };
  const handleProjectsClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const projectsSection = document.getElementById("projects");
    if (!projectsSection) return;

    const scrollingElement = document.scrollingElement ?? document.documentElement;
    const startTop = scrollingElement.scrollTop || window.scrollY;
    const targetTop = Math.max(0, projectsSection.getBoundingClientRect().top + startTop - 24);
    const distance = targetTop - startTop;
    const duration = Math.min(900, Math.max(400, Math.abs(distance) * 0.55));
    const startedAt = performance.now();
    const easeInOut = (progress: number) => progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const nextTop = startTop + distance * easeInOut(progress);
      scrollingElement.scrollTop = nextTop;
      document.documentElement.scrollTop = nextTop;
      document.body.scrollTop = nextTop;
      window.scrollTo(0, nextTop);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    window.history.replaceState(null, "", "#projects");
  };
  const submitFeedback = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!teacherName.trim() || !feedbackText.trim() || rating < 1) {
      setFeedbackNotice("Bitte Name, Feedback und eine Sternebewertung auswählen.");
      return;
    }

    createFeedback.mutate(
      { data: { teacherName: teacherName.trim(), feedback: feedbackText.trim(), rating } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFeedbackQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetFeedbackStatsQueryKey() });
          setTeacherName("");
          setFeedbackText("");
          setRating(0);
          setFeedbackNotice("Vielen Dank für dein Feedback.");
        },
        onError: (error) => setFeedbackNotice(getFeedbackSubmissionErrorMessage(error)),
      },
    );
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-5 md:px-10">
        <BrandMark />
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">{isLoaded && isSignedIn ? "Angemeldet" : "Öffentliche Ansicht · ohne Anmeldung"}</span>
          {isSignedIn ? <Link href="/dashboard" className="focus-ring inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="link-dashboard-public"><LayoutDashboard className="h-4 w-4" /> Zum Dashboard</Link> : <Link href="/sign-in" className="focus-ring rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-bold transition-colors hover:bg-muted" data-testid="link-sign-in">Verwaltung</Link>}
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-5 pb-16 md:px-10">
        <section className="page-enter flex min-h-[calc(100dvh-82px)] flex-col justify-center pb-20 pt-12 md:pt-16">
          <div className="max-w-4xl">
            <div className="mono-label mb-5 flex items-center gap-2 text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> öffentliche projektübersicht</div>
            <h1 className="max-w-4xl text-6xl font-extrabold leading-[.92] tracking-[-.075em] sm:text-8xl">Alex&apos; Websites<span className="text-primary">.</span></h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">Eine Übersicht meiner Projekte, Websites und Ideen. Schau dir an, was ich programmiert habe, und öffne jedes Projekt direkt.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#projects" onClick={handleProjectsClick} className="focus-ring inline-flex items-center gap-3 rounded-xl bg-primary px-5 py-3.5 text-sm font-extrabold text-primary-foreground shadow-[0_10px_25px_hsl(var(--primary)/.2)] transition-transform hover:-translate-y-0.5" data-testid="link-view-projects">Projekte ansehen <ArrowDown className="h-4 w-4" /></a>
              <a href="https://github.com/anonym239" target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-extrabold transition-colors hover:border-primary/50 hover:bg-muted" data-testid="link-public-github-profile"><Github className="h-4 w-4" /> Alex&apos; GitHub-Profil ansehen <ArrowUpRight className="h-3.5 w-3.5" /></a>
            </div>
            <form onSubmit={submitFeedback} className="mt-7 max-w-3xl rounded-2xl border border-border bg-card/80 p-4 shadow-[0_18px_45px_hsl(220_32%_16%/.08)] backdrop-blur-sm md:p-5" data-testid="form-public-feedback">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div><div className="mono-label text-primary">deine meinung zählt</div><h2 className="mt-1 text-lg font-extrabold tracking-[-.03em]">Wie findest du meine Projekte?</h2></div>
                <div className="text-xs text-muted-foreground">Ohne Login · dauert 30 Sekunden</div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-[.7fr_1.3fr]">
                <label className="block"><span className="mb-1.5 block text-xs font-bold">Dein Name</span><input required minLength={2} maxLength={80} value={teacherName} onChange={(event) => setTeacherName(event.target.value)} className="focus-ring h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground" placeholder="z. B. Alex" data-testid="input-feedback-name" /></label>
                <label className="block"><span className="mb-1.5 block text-xs font-bold">Dein Feedback</span><textarea required minLength={3} maxLength={500} value={feedbackText} onChange={(event) => setFeedbackText(event.target.value)} rows={2} className="focus-ring w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground" placeholder="Was gefällt dir an den Projekten?" data-testid="textarea-feedback-text" /></label>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3" role="radiogroup" aria-label="Sternebewertung">
                  <span className="text-xs font-bold">Bewertung</span>
                  <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" onClick={() => setRating(star)} aria-label={`${star} von 5 Sternen`} aria-pressed={rating === star} className={`focus-ring rounded-md p-1 transition-transform hover:scale-110 ${star <= rating ? "text-primary" : "text-muted-foreground/45"}`} data-testid={`button-feedback-star-${star}`}><Star className="h-5 w-5" fill="currentColor" /></button>)}</div>
                  <span className="text-xs text-muted-foreground">{rating ? `${rating}/5` : "Auswählen"}</span>
                </div>
                <button type="submit" disabled={createFeedback.isPending} className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60" data-testid="button-submit-feedback">{createFeedback.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Feedback senden</button>
              </div>
              {feedbackNotice && <p className={`mt-3 text-xs font-semibold ${feedbackNotice.startsWith("Vielen") ? "text-primary" : "text-destructive"}`} role="status" data-testid="feedback-notice">{feedbackNotice}</p>}
            </form>
            <section className="mt-7 max-w-5xl" aria-label="Rückmeldungen">
              <div className="mb-2 flex items-center justify-between"><div className="mono-label text-muted-foreground">rückmeldungen</div><div className="text-[10px] text-muted-foreground">{feedbackStats.data ? feedbackCountLabel(feedbackStats.data.totalCount) : teacherFeedback.data ? feedbackCountLabel(teacherFeedback.data.length) : "Wird geladen"}</div></div>
              {feedbackStats.isLoading ? <div className="skeleton h-32 rounded-2xl" /> : feedbackStats.isError ? <FeedbackStatsError onRetry={() => feedbackStats.refetch()} /> : feedbackStats.data && <FeedbackStatsSummary stats={feedbackStats.data} />}
               <div className="mt-3">{reportNotice && <p className="mb-2 text-xs font-semibold text-primary" role="status">{reportNotice}</p>}{teacherFeedback.isLoading ? <div className="skeleton h-20 rounded-2xl" /> : teacherFeedback.isError ? <ErrorState onRetry={() => teacherFeedback.refetch()} /> : teacherFeedback.data?.length ? <div className="feedback-marquee-viewport rounded-2xl border border-border/80 bg-card/60 py-3"><div className={`feedback-marquee-track gap-3 px-3 ${teacherFeedback.data.length > 1 ? "feedback-marquee-track-moving" : ""}`}>{teacherFeedback.data.map((item) => <article key={item.id} className="w-[260px] shrink-0 rounded-xl border border-border bg-background/80 p-3 sm:w-[310px]"><div className="flex items-center justify-between gap-3"><span className="truncate text-xs font-extrabold">{item.teacherName}</span><span className="flex shrink-0 text-primary" aria-label={`${item.rating} von 5 Sternen`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-3 w-3" fill={star <= item.rating ? "currentColor" : "none"} />)}</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">„{item.feedback}“</p><button type="button" onClick={() => reportFeedback(item.id)} disabled={createFeedbackReport.isPending} className="mt-2 text-[10px] font-bold text-muted-foreground hover:text-destructive disabled:opacity-50">Feedback melden</button></article>)}</div></div> : <div className="feedback-empty-state rounded-2xl border border-dashed border-border bg-card/50 px-4 py-3" aria-live="polite"><div className="feedback-empty-icon"><Star className="h-4 w-4" fill="currentColor" /></div><div><div className="feedback-empty-title text-xs font-extrabold">Seien Sie der Erste</div><div className="mt-0.5 text-[11px] text-muted-foreground">Ihre Rückmeldung erscheint hier.</div></div></div>}</div>
            </section>
          </div>
          <div className="mt-16 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-4"><div className="mono-label text-muted-foreground">projekte</div><div className="mt-3 text-3xl font-extrabold tracking-[-.06em]">{projects.length}</div></div>
            <div className="rounded-2xl border border-border bg-card p-4"><div className="mono-label text-muted-foreground">live</div><div className="mt-3 text-3xl font-extrabold tracking-[-.06em]">{liveProjects}</div></div>
            <div className="col-span-2 rounded-2xl border border-primary/20 bg-accent/45 p-4 sm:col-span-1"><div className="mono-label text-primary">zugang</div><div className="mt-3 text-sm font-extrabold">Für alle offen</div><div className="mt-1 text-xs text-muted-foreground">Ohne Login ansehen</div></div>
          </div>
        </section>
        <section id="projects" className="scroll-mt-6 rounded-[2rem] border border-border bg-card p-5 shadow-[0_24px_70px_hsl(220_32%_16%/.08)] md:p-7">
          <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
            <div><div className="mono-label text-primary">alex&apos; projekte</div><h2 className="mt-1 text-2xl font-extrabold tracking-[-.04em]">Alle Websites auf einen Blick</h2><p className="mt-2 max-w-xl text-sm text-muted-foreground">Suche ein Projekt oder filtere nach dem aktuellen Stand.</p></div>
            <div className="text-xs text-muted-foreground">{visibleProjects.length} von {projects.length} sichtbar</div>
          </div>
          <div className="mt-5 flex flex-col gap-3 md:flex-row">
            <label className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><span className="sr-only">Projekte durchsuchen</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Projekte durchsuchen..." className="focus-ring h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground" data-testid="input-search-public-projects" /></label>
            <div className="flex flex-wrap items-center gap-2">{(["all", "live", "draft", "paused"] as const).map((status) => <button key={status} onClick={() => setStatusFilter(status)} className={`rounded-xl px-3 py-2.5 text-xs font-bold transition-colors ${statusFilter === status ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`} data-testid={`button-public-filter-${status}`}>{status === "all" ? "Alle" : status === "live" ? "Live" : status === "draft" ? "Entwurf" : "Pausiert"}</button>)}</div>
          </div>
           <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
             {websites.isLoading ? [1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="skeleton h-64 rounded-2xl" />) : visibleProjects.length > 0 ? visibleProjects.map((website) => <article key={website.id} className="group overflow-hidden rounded-2xl border border-border bg-background transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl">
               <Link href={`/projects/${website.id}`} className="block" data-testid={`link-directory-${website.id}`}>
                 <div className="relative aspect-[1.7/1] overflow-hidden bg-gradient-to-br from-accent to-background">{website.imageUrl ? <img src={website.imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center text-accent-foreground"><Globe2 className="h-10 w-10 opacity-70" /></div>}<div className="absolute left-3 top-3 rounded-full border border-white/10 bg-background/80 px-2.5 py-1 text-[10px] font-extrabold backdrop-blur-md">{website.status === "live" ? "Live" : website.status === "draft" ? "Entwurf" : "Pausiert"}</div><ArrowUpRight className="absolute right-3 top-3 h-4 w-4 text-white drop-shadow-md transition-colors group-hover:text-primary" /></div>
                 <div className="p-4"><div className="truncate text-base font-extrabold">{website.name}</div><div className="mt-1 truncate text-xs text-muted-foreground">{website.url.replace(/^https?:\/\//, "")}</div>{website.description && <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{website.description}</p>}</div>
               </Link>
               <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
                 <Link href={`/projects/${website.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-2 text-xs font-extrabold text-accent-foreground transition-colors hover:bg-primary/20 hover:text-primary" data-testid={`link-project-detail-${website.id}`}>Details <ArrowUpRight className="h-3 w-3" /></Link>
                 <a href={website.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs font-extrabold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" data-testid={`link-open-website-${website.id}`}>Website <ExternalLink className="h-3 w-3" /></a>
                 {website.githubUrl && <a href={website.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs font-extrabold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" data-testid={`link-public-github-${website.id}`}><Github className="h-3.5 w-3.5" /> GitHub</a>}
               </div>
             </article>) : <div className="sm:col-span-2 lg:col-span-3"><EmptyState compact title={query || statusFilter !== "all" ? "Keine passenden Projekte" : "Noch keine Websites"} message={query || statusFilter !== "all" ? "Versuche eine andere Suche oder einen anderen Filter." : "Sobald ein Projekt veröffentlicht ist, erscheint es hier."} /></div>}
           </div>
        </section>
      </main>
       <footer className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-8 text-xs text-muted-foreground md:px-10"><span className="mono-label text-[9px]">ALEX&apos; WEBSITES / PROJEKTÜBERSICHT</span><span>Gebaut mit Neugier.</span></footer>
       {activeEvents.data?.[0] && eventOpen && <PublicEventModal event={activeEvents.data[0]} onClose={() => setEventOpen(false)} />}
    </div>
  );
}

function PublicEventModal({ event, onClose }: { event: Event; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 px-5 py-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="public-event-title">
      <div className="page-enter relative w-full max-w-lg rounded-[2rem] border border-primary/25 bg-card p-6 shadow-2xl md:p-8">
        <button onClick={onClose} className="focus-ring absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Event schließen" data-testid="button-close-public-event">
          <X className="h-4 w-4" />
        </button>
        <div className="mono-label pr-8 text-primary">neuigkeiten</div>
        <h2 id="public-event-title" className="mt-3 pr-8 text-2xl font-extrabold tracking-[-.04em]">{event.title}</h2>
        {event.imageUrl && <img src={event.imageUrl} alt="" className="mt-5 max-h-64 w-full rounded-xl object-cover" loading="lazy" />}
        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">{event.message}</p>
        <button onClick={onClose} className="focus-ring mt-7 inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-extrabold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="button-view-public-event">
          Verstanden
        </button>
      </div>
    </div>
  );
}

function ProjectDetailPage() {
  const [, params] = useRoute<{ websiteId: string }>("/projects/:websiteId");
  const { isSignedIn } = useUser();
  const queryClient = useQueryClient();
  const websites = useListWebsites();
  const favorites = useListMemberFavorites({ query: { queryKey: getListMemberFavoritesQueryKey(), enabled: Boolean(isSignedIn) } });
  const addFavorite = useCreateMemberFavorite();
  const removeFavorite = useDeleteMemberFavorite();
  const websiteId = Number(params?.websiteId);
  const website = Number.isInteger(websiteId) ? websites.data?.find((item) => item.id === websiteId) : undefined;
  const isFavorite = website ? Boolean(favorites.data?.some((item) => item.id === website.id)) : false;
  const toggleFavorite = () => {
    if (!website) return;
    const options = { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListMemberFavoritesQueryKey() }) };
    if (isFavorite) removeFavorite.mutate({ websiteId: website.id }, options);
    else addFavorite.mutate({ websiteId: website.id }, options);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-5 md:px-10">
        <Link href="/" aria-label="Zur Projektübersicht">
          <BrandMark />
        </Link>
        <div className="flex items-center gap-2">
          {isSignedIn ? <Link href="/dashboard" className="focus-ring inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="link-dashboard-detail"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link> : <Link href="/sign-in" className="focus-ring rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-bold transition-colors hover:bg-muted" data-testid="link-sign-in-detail">Anmelden</Link>}
          <Link href="/#projects" className="focus-ring inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-bold transition-colors hover:bg-muted" data-testid="link-back-projects-header"><ArrowDown className="h-4 w-4 rotate-90" /> Alle Projekte</Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-5 pb-16 md:px-10">
        <div className="page-enter">
          {websites.isLoading ? (
            <div className="py-12">
              <div className="skeleton h-5 w-36 rounded-full" />
              <div className="mt-6 grid gap-6 lg:grid-cols-[1.08fr_.92fr]">
                <div className="skeleton aspect-[1.35/1] rounded-[2rem]" />
                <div className="space-y-4 py-4">
                  <div className="skeleton h-12 w-3/4 rounded-xl" />
                  <div className="skeleton h-24 rounded-xl" />
                  <div className="skeleton h-12 w-56 rounded-xl" />
                </div>
              </div>
            </div>
          ) : websites.isError ? (
            <div className="mx-auto max-w-xl py-20">
              <EmptyState title="Projekt konnte nicht geladen werden" message="Die öffentliche Projektübersicht konnte den Dienst nicht erreichen." action={<button onClick={() => websites.refetch()} className="focus-ring rounded-lg bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground" data-testid="button-retry-project-detail">Erneut versuchen</button>} />
            </div>
          ) : !website ? (
            <div className="mx-auto max-w-xl py-20">
              <EmptyState title="Projekt nicht gefunden" message="Dieses Projekt gibt es nicht oder es wurde aus der Übersicht entfernt." action={<Link href="/#projects" className="focus-ring inline-flex rounded-lg bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground" data-testid="link-back-projects-empty">Zur Projektübersicht</Link>} />
            </div>
          ) : (
            <>
              <Link href="/#projects" className="focus-ring inline-flex items-center gap-2 pt-8 text-xs font-extrabold text-muted-foreground transition-colors hover:text-foreground" data-testid="link-back-projects">
                <ArrowDown className="h-4 w-4 rotate-90" />
                Zur Projektübersicht
              </Link>
              <section className="mt-5 grid gap-6 lg:grid-cols-[1.08fr_.92fr] lg:items-stretch" aria-labelledby="project-detail-title" data-testid={`project-detail-${website.id}`}>
                <div className="relative aspect-[1.35/1] overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-accent via-card to-background shadow-[0_24px_70px_hsl(220_32%_16%/.08)]">
                  {website.imageUrl ? (
                    <img src={website.imageUrl} alt={`Vorschaubild von ${website.name}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-accent-foreground">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-foreground/10">
                        <Globe2 className="h-8 w-8 opacity-75" />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">Kein Vorschaubild vorhanden</span>
                    </div>
                  )}
                  <div className="absolute left-5 top-5 rounded-full border border-white/10 bg-background/85 px-3 py-1.5 text-[10px] font-extrabold backdrop-blur-md">
                    {websiteStatusLabel(website.status)}
                  </div>
                </div>
                <div className="flex flex-col justify-center rounded-[2rem] border border-border bg-card p-6 shadow-[0_24px_70px_hsl(220_32%_16%/.08)] md:p-8">
                  <div className="mono-label text-primary">projekt / {website.id.toString().padStart(2, "0")}</div>
                  <h1 id="project-detail-title" className="mt-3 text-4xl font-extrabold leading-[.95] tracking-[-.06em] sm:text-6xl">{website.name}<span className="text-primary">.</span></h1>
                  <div className="mt-5 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <span className={`h-2 w-2 rounded-full ${website.status === "live" ? "bg-primary" : website.status === "paused" ? "bg-amber-500" : "bg-muted-foreground/60"}`} />
                    {websiteStatusLabel(website.status)}
                  </div>
                  <p className="mt-6 text-base leading-7 text-muted-foreground">
                    {website.description || "Für dieses Projekt ist noch keine Beschreibung hinterlegt."}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <a href={website.url} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-extrabold text-primary-foreground shadow-[0_10px_25px_hsl(var(--primary)/.2)] transition-transform hover:-translate-y-0.5" data-testid={`link-detail-live-${website.id}`}>
                      Website öffnen
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    {website.githubUrl ? (
                      <a href={website.githubUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-extrabold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" data-testid={`link-detail-github-${website.id}`}>
                        <Github className="h-4 w-4" />
                        GitHub
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center rounded-xl border border-dashed border-border px-4 py-3 text-xs font-semibold text-muted-foreground" data-testid={`text-detail-no-github-${website.id}`}>
                        Kein öffentliches GitHub-Repository
                      </span>
                    )}
                    {isSignedIn && <button onClick={toggleFavorite} disabled={addFavorite.isPending || removeFavorite.isPending} className={`focus-ring inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-extrabold transition-colors disabled:opacity-50 ${isFavorite ? "border-primary/30 bg-accent text-primary" : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"}`} data-testid={`button-favorite-project-${website.id}`}><Heart className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} /> {isFavorite ? "Gemerkt" : "Projekt merken"}</button>}
                  </div>
                  <div className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">Live-Adresse</span>
                    <span className="mx-2 text-border">/</span>
                    <span className="break-all">{website.url.replace(/^https?:\/\//, "")}</span>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
      <footer className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-8 text-xs text-muted-foreground md:px-10">
        <span className="mono-label text-[9px]">ALEX&apos; WEBSITES / PROJEKTDETAIL</span>
        <Link href="/#projects" className="font-semibold hover:text-foreground">Zur Übersicht</Link>
      </footer>
    </div>
  );
}

function websiteStatusLabel(status: Website["status"]) {
  return status === "live" ? "Live" : status === "draft" ? "Entwurf" : "Pausiert";
}

function EmptyState({ title, message, action, compact = false }: { title: string; message: string; action?: ReactNode; compact?: boolean }) {
  return <div className={`flex flex-col items-center justify-center text-center ${compact ? "min-h-32" : "min-h-64"} rounded-xl border border-dashed border-border bg-card/50 p-6`} data-testid="state-empty"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Server className="h-5 w-5" /></div><h3 className="mt-4 text-sm font-extrabold">{title}</h3><p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">{message}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

function feedbackCountLabel(count: number) {
  return `${count} ${count === 1 ? "veröffentlichte Bewertung" : "veröffentlichte Bewertungen"}`;
}

function getFeedbackSubmissionErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const candidate = error as { status?: unknown; data?: unknown };
    if (
      (candidate.status === 409 || candidate.status === 429) &&
      typeof candidate.data === "object" &&
      candidate.data !== null &&
      typeof (candidate.data as { error?: unknown }).error === "string"
    ) {
      return (candidate.data as { error: string }).error;
    }
  }

  return "Das Feedback konnte gerade nicht gespeichert werden.";
}

function FeedbackStatsSummary({ stats }: { stats: FeedbackStats }) {
  const rows = [
    { label: "5", count: stats.distribution.fiveStars },
    { label: "4", count: stats.distribution.fourStars },
    { label: "3", count: stats.distribution.threeStars },
    { label: "2", count: stats.distribution.twoStars },
    { label: "1", count: stats.distribution.oneStar },
  ];
  const hasRatings = stats.totalCount > 0;
  const roundedAverage = Math.round(stats.averageRating);

  return (
    <div className="rounded-2xl border border-primary/20 bg-accent/35 p-4 sm:p-5" data-testid="feedback-stats">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="min-w-[155px]">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-[-.06em]" data-testid="feedback-average-rating">
              {hasRatings ? stats.averageRating.toFixed(1).replace(".", ",") : "—"}
            </span>
            <span className="text-xs font-bold text-muted-foreground">/ 5</span>
          </div>
          <div className="mt-1 flex items-center gap-0.5 text-primary" aria-label={hasRatings ? `${stats.averageRating.toFixed(1)} von 5 Sternen im Durchschnitt` : "Noch keine Bewertung"}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-3.5 w-3.5" fill={star <= roundedAverage ? "currentColor" : "none"} />
            ))}
          </div>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">
            {hasRatings ? feedbackCountLabel(stats.totalCount) : "Noch keine veröffentlichte Bewertung"}
          </p>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5" aria-label="Verteilung der Sternebewertungen">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-2 text-[11px]" aria-label={`${row.label} Sterne: ${row.count} (${stats.totalCount ? Math.round((row.count / stats.totalCount) * 100) : 0} Prozent)`}>
              <span className="w-3 text-right font-bold text-muted-foreground">{row.label}</span>
              <Star className="h-3 w-3 shrink-0 text-primary" fill="currentColor" />
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-background/70">
                <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${stats.totalCount ? (row.count / stats.totalCount) * 100 : 0}%` }} />
              </div>
              <span className="w-5 text-right font-semibold text-muted-foreground">{row.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeedbackStatsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs" data-testid="feedback-stats-error">
      <span className="text-muted-foreground">Die Bewertungsstatistik konnte gerade nicht geladen werden.</span>
      <button onClick={onRetry} className="focus-ring shrink-0 rounded-lg border border-border bg-card px-3 py-2 font-bold hover:bg-muted" data-testid="button-retry-feedback-stats">
        Erneut versuchen
      </button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center" data-testid="state-error"><CircleAlert className="h-5 w-5 text-destructive" /><h3 className="mt-3 text-sm font-extrabold">Ansicht konnte nicht geladen werden</h3><p className="mt-1 text-xs text-muted-foreground">Die Projektübersicht konnte den Dienst nicht erreichen.</p><button onClick={onRetry} className="focus-ring mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold hover:bg-muted" data-testid="button-retry"><RefreshCw className="h-3.5 w-3.5" /> Erneut versuchen</button></div>;
}

function SkeletonRows({ count = 4 }: { count?: number }) {
  return <div className="space-y-2" data-testid="state-loading">{Array.from({ length: count }).map((_, index) => <div key={index} className="skeleton h-16 rounded-xl" />)}</div>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();
  const currentUser = useGetCurrentUser();
  const { signOut } = useClerk();
   const isAdmin = currentUser.data?.role === "admin";
   const canManageFeedback = isAdmin || currentUser.data?.role === "moderator";
      const nav = [{ href: "/dashboard", label: "Übersicht", icon: LayoutDashboard }, { href: "/profile", label: "Mein Profil", icon: UserRound }, ...(isAdmin ? [{ href: "/websites", label: "Websites", icon: Globe2 }] : []), ...(canManageFeedback ? [{ href: "/feedback", label: "Feedback", icon: MessageSquareText }] : []), ...(isAdmin ? [{ href: "/events", label: "Events", icon: CirclePlus }] : []), ...(isAdmin ? [{ href: "/users", label: "Personen", icon: Users }] : []), ...(isAdmin ? [{ href: "/requests", label: "Anfragen", icon: Send }] : []), ...(isAdmin ? [{ href: "/activity", label: "Protokoll", icon: ActivityIcon }] : [])];
  return <div className="min-h-[100dvh] bg-background text-foreground">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform duration-300 md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex items-center justify-between px-2"><BrandMark /><button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:hidden" data-testid="button-close-menu"><X className="h-4 w-4" /></button></div>
       <div className="mt-12 px-2 mono-label text-[9px] text-sidebar-foreground/45">arbeitsbereich</div>
      <nav className="mt-3 space-y-1" aria-label="Primary navigation">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${location === href ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"}`} data-testid={`link-nav-${label.toLowerCase()}`}><Icon className="h-[17px] w-[17px]" />{label}{location === href && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}</Link>)}</nav>
       <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/45 p-4"><div className="flex items-center gap-2 text-xs font-bold text-sidebar-accent-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Bereich geschützt</div><p className="mt-2 text-[11px] leading-5 text-sidebar-foreground/55">Deine Projektübersicht ist sicher.</p></div>
      <div className="mt-4 flex items-center gap-3 border-t border-sidebar-border px-2 pt-4"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground">{(user?.firstName?.[0] ?? "A")}{(user?.lastName?.[0] ?? "")}</div><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-sidebar-accent-foreground">{user?.fullName ?? "Account"}</div><div className="truncate text-[10px] text-sidebar-foreground/55">{user?.primaryEmailAddress?.emailAddress ?? "Connected"}</div></div><button onClick={() => signOut({ redirectUrl: basePath || "/" })} className="rounded-lg p-1.5 text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" title="Sign out" data-testid="button-sign-out"><LogOut className="h-4 w-4" /></button></div>
    </aside>
    {mobileOpen && <button className="fixed inset-0 z-30 bg-foreground/30 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-overlay" />}
    <div className="md:pl-[248px]">
       <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-md md:px-10"><div className="flex items-center gap-3"><button className="rounded-lg p-2 hover:bg-muted md:hidden" onClick={() => setMobileOpen(true)} data-testid="button-open-menu"><Menu className="h-5 w-5" /></button><div className="mono-label hidden text-muted-foreground sm:block">{location === "/dashboard" ? "bereich / übersicht" : `bereich / ${location.replace("/", "")}`}</div></div><div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground sm:flex"><Search className="h-3.5 w-3.5" /><span>Suchen</span><kbd className="ml-5 rounded border border-border px-1.5 py-0.5 font-mono text-[9px]">K</kbd></div><div className="h-7 w-px bg-border" /><div className="text-right"><div className="text-xs font-extrabold">{user?.firstName ?? "Dein"} <span className="hidden sm:inline">{user?.lastName ?? "Bereich"}</span></div><div className="mono-label text-[9px] text-primary">{currentUser.isLoading ? "Wird geladen" : currentUser.isError ? "Rolle nicht geladen" : isAdmin ? "Admin" : currentUser.data?.role === "moderator" ? "Moderator" : "Mitglied"}</div></div></div></header>
      <main className="mx-auto max-w-[1440px] p-5 md:p-10">{children}</main>
    </div>
  </div>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="mono-label text-primary">{eyebrow}</div><h1 className="mt-2 text-3xl font-extrabold tracking-[-.05em] md:text-[2.6rem]">{title}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p></div>{action && <div className="shrink-0">{action}</div>}</div>;
}

function StatCard({ label, value, detail, icon: Icon, accent = false }: { label: string; value: string | number; detail: string; icon: typeof Globe2; accent?: boolean }) {
  return <div className={`rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${accent ? "border-primary/20 bg-accent/45" : "border-border bg-card"}`} data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}><div className="flex items-start justify-between"><span className="mono-label text-muted-foreground">{label}</span><div className={`rounded-lg p-2 ${accent ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}><Icon className="h-4 w-4" /></div></div><div className="mt-5 text-3xl font-extrabold tracking-[-.05em]">{value}</div><div className={`mt-1 text-xs font-semibold ${accent ? "text-primary" : "text-muted-foreground"}`}>{detail}</div></div>;
}

function DashboardPage() {
  const currentUser = useGetCurrentUser();
  const summary = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const websites = useListWebsites({ query: { queryKey: getListWebsitesQueryKey() } });
  const activity = useListActivity({ query: { queryKey: getListActivityQueryKey() } });
  const favorites = useListMemberFavorites({ query: { queryKey: getListMemberFavoritesQueryKey() } });
  const removeFavorite = useDeleteMemberFavorite();
  const notifications = useListMemberNotifications({ query: { queryKey: getListMemberNotificationsQueryKey() } });
  const requests = useListMemberRequests({ query: { queryKey: getListMemberRequestsQueryKey() } });
  const createRequest = useCreateMemberRequest();
  const withdrawRequest = useWithdrawMemberRequest();
  const markNotification = useMarkMemberNotificationRead();
  const [requestMessage, setRequestMessage] = useState("");
  const [requestNotice, setRequestNotice] = useState("");
  const isAdmin = currentUser.data?.role === "admin";
  const retry = () => { summary.refetch(); websites.refetch(); activity.refetch(); favorites.refetch(); notifications.refetch(); requests.refetch(); };
  const live = (websites.data ?? []).filter((site) => site.status === "live");
    return <Shell><div className="page-enter"><PageHeader eyebrow="bereich / übersicht" title="Deine Projekte." description="Alle verknüpften Websites, der aktuelle Status und die letzten Änderungen auf einen Blick." action={isAdmin ? <Link href="/websites" className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-extrabold text-primary-foreground shadow-[0_8px_20px_hsl(var(--primary)/.18)] transition-transform hover:-translate-y-0.5" data-testid="button-add-site-header"><CirclePlus className="h-4 w-4" /> Website verknüpfen</Link> : undefined} />
      {summary.isError || websites.isError || activity.isError || favorites.isError || notifications.isError || requests.isError ? <ErrorState onRetry={retry} /> : <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{summary.isLoading ? [1,2,3,4].map((item) => <div key={item} className="skeleton h-36 rounded-2xl" />) : <><StatCard label="Websites" value={summary.data?.totalWebsites ?? websites.data?.length ?? 0} detail={`${summary.data?.liveWebsites ?? live.length} live`} icon={Globe2} accent /><StatCard label="Aufrufe insgesamt" value={formatNumber(summary.data?.totalVisits ?? 0)} detail="über alle Websites" icon={CircleGauge} /><StatCard label="Registrierte Personen" value={summary.data?.registeredUsers ?? 0} detail="in deiner Übersicht" icon={Users} /><StatCard label="Verfügbarkeit" value={summary.data?.uptime ?? "—"} detail="Durchschnitt der letzten 30 Tage" icon={ActivityIcon} />{isAdmin && <><StatCard label="Offene Anfragen" value={summary.data?.openRequests ?? 0} detail="wartet auf Bearbeitung" icon={Send} accent /><StatCard label="Neue Mitglieder" value={summary.data?.newMembers ?? 0} detail="in den letzten 30 Tagen" icon={Users} /><StatCard label="Aktive Events" value={summary.data?.activeEvents ?? 0} detail="öffentlich sichtbar" icon={CirclePlus} /><StatCard label="Feedbackprüfung" value={summary.data?.pendingFeedback ?? 0} detail="ausgeblendete Einträge" icon={MessageSquareText} /></>}</>}</div>
         <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><section className="rounded-2xl border border-border bg-card p-5 md:p-6"><div className="flex items-center justify-between"><div><div className="mono-label text-muted-foreground">aktive projekte</div><h2 className="mt-1 text-lg font-extrabold">Live-Websites</h2></div>{isAdmin && <Link href="/websites" className="text-xs font-bold text-primary hover:underline" data-testid="link-view-all-websites">Alle anzeigen <ArrowUpRight className="inline h-3 w-3" /></Link>}</div>{websites.isLoading ? <div className="mt-5"><SkeletonRows count={3} /></div> : live.length === 0 ? <div className="mt-5"><EmptyState compact title="Noch nichts live" message={isAdmin ? "Verknüpfe eine Website, damit sie hier erscheint." : "Sobald ein Projekt live ist, erscheint es hier."} action={isAdmin ? <Link href="/websites" className="text-xs font-bold text-primary" data-testid="link-add-first-site">Erste Website verknüpfen</Link> : undefined} /></div> : <div className="mt-5 grid gap-2">{live.slice(0, 5).map((site) => <a href={site.url} target="_blank" rel="noreferrer" key={site.id} className="group flex items-center gap-3 rounded-xl border border-border px-3 py-3 transition-colors hover:border-primary/40 hover:bg-accent/40" data-testid={`card-live-website-${site.id}`}><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground"><Globe2 className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-extrabold">{site.name}</div><div className="truncate text-xs text-muted-foreground">{site.url.replace(/^https?:\/\//, "")}</div></div><div className="text-right"><div className="text-xs font-bold">{formatNumber(site.visits)}</div><div className="text-[10px] text-muted-foreground">Aufrufe</div></div><ExternalLink className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" /></a>)}</div>}</section>
         <ActivityPanel activity={activity.data ?? []} loading={activity.isLoading} /></div>
          <div className="mt-5 grid gap-5 lg:grid-cols-3"><FavoritesPanel favorites={favorites.data ?? []} loading={favorites.isLoading} onRemove={(websiteId) => removeFavorite.mutate({ websiteId }, { onSuccess: () => favorites.refetch() })} /><NotificationsPanel notifications={notifications.data ?? []} loading={notifications.isLoading} onRead={(id) => markNotification.mutate({ notificationId: id }, { onSuccess: () => notifications.refetch() })} /><MemberRequestPanel requests={requests.data ?? []} message={requestMessage} notice={requestNotice} pending={createRequest.isPending || withdrawRequest.isPending} onMessage={setRequestMessage} onWithdraw={(id) => withdrawRequest.mutate({ requestId: id }, { onSuccess: () => requests.refetch() })} onSubmit={(event) => { event.preventDefault(); if (requestMessage.trim().length < 3) { setRequestNotice("Bitte mindestens drei Zeichen eingeben."); return; } createRequest.mutate({ data: { message: requestMessage.trim() } }, { onSuccess: () => { setRequestMessage(""); setRequestNotice("Deine Nachricht wurde an den Admin gesendet."); requests.refetch(); }, onError: () => setRequestNotice("Die Nachricht konnte nicht gesendet werden.") }); }} /></div><div className="mt-5 max-w-xl"><ProfileVisibilityPanel /></div>
       </>}</div></Shell>;
}

function FavoritesPanel({ favorites, loading, onRemove }: { favorites: Website[]; loading: boolean; onRemove: (websiteId: number) => void }) {
  return <section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /><div><div className="mono-label text-muted-foreground">deine auswahl</div><h2 className="mt-1 text-lg font-extrabold">Gemerkte Projekte</h2></div></div>{loading ? <div className="mt-4"><SkeletonRows count={2} /></div> : favorites.length === 0 ? <p className="mt-4 text-xs leading-5 text-muted-foreground">Auf einer Projektseite kannst du Websites für später merken.</p> : <div className="mt-4 space-y-2">{favorites.map((site) => <div key={site.id} className="flex items-center gap-2 rounded-xl border border-border px-3 py-3 transition-colors hover:border-primary/40 hover:bg-accent/40"><Link href={`/projects/${site.id}`} className="min-w-0 flex-1"><div className="truncate text-xs font-extrabold">{site.name}</div><div className="truncate text-[10px] text-muted-foreground">{site.url.replace(/^https?:\/\//, "")}</div></Link><Link href={`/projects/${site.id}`} aria-label={`${site.name} öffnen`}><ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" /></Link><button type="button" onClick={() => onRemove(site.id)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label={`${site.name} aus Favoriten entfernen`}><X className="h-3.5 w-3.5" /></button></div>)}</div>}</section>;
}

function NotificationsPanel({ notifications, loading, onRead }: { notifications: import("@workspace/api-client-react").MemberNotification[]; loading: boolean; onRead: (id: number) => void }) {
  const unread = notifications.filter((item) => !item.isRead);
  return <section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /><div><div className="mono-label text-muted-foreground">für dich</div><h2 className="mt-1 text-lg font-extrabold">Benachrichtigungen</h2></div>{unread.length > 0 && <span className="ml-auto rounded-full bg-primary px-2 py-1 text-[10px] font-extrabold text-primary-foreground">{unread.length}</span>}</div>{loading ? <div className="mt-4"><SkeletonRows count={2} /></div> : notifications.length === 0 ? <p className="mt-4 text-xs leading-5 text-muted-foreground">Updates zu deinen Anfragen erscheinen hier.</p> : <div className="mt-4 space-y-2">{notifications.slice(0, 4).map((item) => <button key={item.id} onClick={() => !item.isRead && onRead(item.id)} className={`w-full rounded-xl border p-3 text-left transition-colors ${item.isRead ? "border-border bg-background" : "border-primary/30 bg-accent/40"}`}><div className="text-xs font-extrabold">{item.title}</div><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{item.message}</p><div className="mt-2 text-[10px] text-muted-foreground">{formatRelative(item.createdAt)}{!item.isRead && " · Als gelesen markieren"}</div></button>)}</div>}</section>;
}

function MemberRequestPanel({ requests, message, notice, pending, onMessage, onWithdraw, onSubmit }: { requests: import("@workspace/api-client-react").MemberRequest[]; message: string; notice: string; pending: boolean; onMessage: (value: string) => void; onWithdraw: (id: number) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-2"><Send className="h-4 w-4 text-primary" /><div><div className="mono-label text-muted-foreground">direkter draht</div><h2 className="mt-1 text-lg font-extrabold">Anfrage senden</h2></div></div><form onSubmit={onSubmit} className="mt-4"><textarea value={message} onChange={(event) => onMessage(event.target.value)} rows={3} maxLength={1000} placeholder="Wobei kann Alex helfen?" className="focus-ring w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-xs outline-none placeholder:text-muted-foreground" data-testid="textarea-member-request" /><div className="mt-3 flex items-center justify-between gap-2"><span className="text-[10px] text-muted-foreground">{requests.length} Anfrage{requests.length === 1 ? "" : "n"} gesendet</span><button type="submit" disabled={pending} className="focus-ring inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-extrabold text-primary-foreground disabled:opacity-50" data-testid="button-send-member-request">{pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Senden</button></div></form>{notice && <p className="mt-3 text-[11px] font-semibold text-primary" role="status">{notice}</p>}{requests.length > 0 && <div className="mt-4 space-y-2">{requests.slice(0, 3).map((request) => <div key={request.id} className="rounded-xl border border-border bg-background p-3"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-extrabold uppercase tracking-wide text-primary">{request.status === "in_progress" ? "In Bearbeitung" : request.status === "closed" ? "Erledigt" : request.status === "withdrawn" ? "Zurückgezogen" : "Offen"}</span><span className="text-[10px] text-muted-foreground">{formatRelative(request.createdAt)}</span></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{request.message}</p><RequestHistory requestId={request.id} />{request.status !== "closed" && request.status !== "withdrawn" && <button type="button" onClick={() => onWithdraw(request.id)} disabled={pending} className="mt-2 text-[10px] font-bold text-muted-foreground hover:text-destructive disabled:opacity-50">Anfrage zurückziehen</button>}</div>)}</div>}</section>;
}

function RequestHistory({ requestId }: { requestId: number }) {
  const history = useListMemberRequestHistory(requestId, { query: { queryKey: getListMemberRequestHistoryQueryKey(requestId) } });
  if (!history.data?.length) return null;
  return <div className="mt-2 border-l-2 border-primary/20 pl-2">{history.data.slice(0, 2).map((entry: MemberRequestHistory) => <div key={entry.id} className="text-[10px] text-muted-foreground"><span className="font-bold text-foreground">{entry.actorName}</span> · {formatRelative(entry.createdAt)} · {entry.status === "in_progress" ? "in Bearbeitung" : entry.status === "closed" ? "erledigt" : entry.status === "withdrawn" ? "zurückgezogen" : "offen"}</div>)}</div>;
}

function ProfileVisibilityPanel() {
  const profile = useGetMemberProfile({ query: { queryKey: getGetMemberProfileQueryKey() } });
  const update = useUpdateMemberProfile();
  const [notice, setNotice] = useState("");
  const setVisibility = (profileVisibility: "private" | "public") => {
    update.mutate({ data: { profileVisibility } }, {
      onSuccess: () => {
        profile.refetch();
        setNotice("Sichtbarkeit gespeichert.");
      },
      onError: () => setNotice("Die Sichtbarkeit konnte nicht gespeichert werden."),
    });
  };
  return <section className="rounded-2xl border border-border bg-card p-5">
    <div className="flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /><div><div className="mono-label text-muted-foreground">profil</div><h2 className="mt-1 text-lg font-extrabold">Sichtbarkeit</h2></div></div>
    <p className="mt-3 text-xs leading-5 text-muted-foreground">Lege fest, ob deine Profilinformationen nur dir oder auch anderen Mitgliedern angezeigt werden dürfen.</p>
    <div className="mt-4 flex flex-wrap gap-2">
      {(["private", "public"] as const).map((visibility) => <button key={visibility} type="button" onClick={() => setVisibility(visibility)} disabled={update.isPending || profile.isLoading} className={`focus-ring rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${profile.data?.profileVisibility === visibility ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:bg-muted"}`} data-testid={`button-profile-visibility-${visibility}`}>{visibility === "private" ? "Privat" : "Für Mitglieder sichtbar"}</button>)}
    </div>
    {notice && <p className="mt-3 text-[11px] font-semibold text-primary" role="status">{notice}</p>}
  </section>;
}

function ActivityPanel({ activity, loading }: { activity: Activity[]; loading: boolean }) {
  return <section className="rounded-2xl border border-border bg-card p-5 md:p-6"><div className="mono-label text-muted-foreground">änderungsverlauf</div><h2 className="mt-1 text-lg font-extrabold">Letzte Aktivitäten</h2>{loading ? <div className="mt-5"><SkeletonRows count={4} /></div> : activity.length === 0 ? <div className="mt-5"><EmptyState compact title="Noch keine Aktivitäten" message="Änderungen an deinen Projekten erscheinen hier." /></div> : <div className="mt-5 space-y-4">{activity.slice(0, 6).map((item) => <div key={item.id} className="flex gap-3" data-testid={`activity-${item.id}`}><div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"><ActivityIcon className="h-3.5 w-3.5" /></div><div className="min-w-0"><p className="text-xs font-semibold leading-5">{item.message}</p><p className="mt-1 text-[10px] text-muted-foreground">{item.actorName} · {formatRelative(item.createdAt)}</p></div></div>)}</div>}</section>;
}

function WebsitesPage() {
  const queryClient = useQueryClient();
  const websites = useListWebsites();
  const createWebsite = useCreateWebsite();
  const updateWebsite = useUpdateWebsite();
  const deleteWebsite = useDeleteWebsite();
  const importNetlify = useImportNetlifyWebsites();
  const [modal, setModal] = useState<Website | "new" | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const filtered = useMemo(() => (websites.data ?? []).filter((site) => `${site.name} ${site.url}`.toLowerCase().includes(query.toLowerCase()) && (statusFilter === "all" || site.status === statusFilter)), [websites.data, query, statusFilter]);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListWebsitesQueryKey() });
  const save = (data: WebsiteFormData, editing: Website | "new") => {
     if (editing === "new") createWebsite.mutate({ data }, { onSuccess: () => { invalidate(); setModal(null); setNotice("Website wurde verknüpft."); }, onError: () => setNotice("Die Website konnte nicht hinzugefügt werden.") });
     else updateWebsite.mutate({ websiteId: editing.id, data }, { onSuccess: () => { invalidate(); setModal(null); setNotice("Website aktualisiert."); }, onError: () => setNotice("Die Website konnte nicht aktualisiert werden.") });
  };
   const syncNetlify = () => {
     importNetlify.mutate(undefined, {
       onSuccess: (result) => {
         invalidate();
         queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() });
         setNotice(`${result.imported + result.updated} Netlify-Projekte synchronisiert (${result.imported} neu, ${result.updated} aktualisiert).`);
       },
       onError: () => setNotice("Die Netlify-Projekte konnten nicht synchronisiert werden."),
     });
   };
   const remove = (site: Website) => { if (window.confirm(`Soll ${site.name} wirklich entfernt werden?`)) deleteWebsite.mutate({ websiteId: site.id }, { onSuccess: () => { invalidate(); setNotice("Website entfernt."); }, onError: () => setNotice("Die Website konnte nicht entfernt werden.") }); };
  const changeStatus = (site: Website) => { const next = site.status === "live" ? "paused" : "live"; updateWebsite.mutate({ websiteId: site.id, data: { status: next } }, { onSuccess: invalidate }); };
    return <Shell><div className="page-enter"><PageHeader eyebrow="bereich / websites" title="Websites" description="Verknüpfe hier alle Projekte, die andere sehen sollen." action={<div className="flex flex-col gap-2 sm:flex-row"><button onClick={syncNetlify} disabled={importNetlify.isPending} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-extrabold transition-colors hover:bg-muted disabled:cursor-wait disabled:opacity-60" data-testid="button-sync-netlify">{importNetlify.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />} {importNetlify.isPending ? "Netlify wird geladen..." : "Von Netlify synchronisieren"}</button><button onClick={() => setModal("new")} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-extrabold text-primary-foreground shadow-[0_8px_20px_hsl(var(--primary)/.18)] transition-transform hover:-translate-y-0.5" data-testid="button-add-website"><CirclePlus className="h-4 w-4" /> Website verknüpfen</button></div>} />
    {notice && <div className="mb-5 flex items-center justify-between rounded-xl border border-primary/20 bg-accent px-4 py-3 text-xs font-semibold text-accent-foreground" data-testid="status-notice"><span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {notice}</span><button onClick={() => setNotice("")} data-testid="button-dismiss-notice"><X className="h-4 w-4" /></button></div>}
     <section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between"><div className="relative w-full md:max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Websites suchen..." className="focus-ring h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground" data-testid="input-search-websites" /></div><div className="flex flex-wrap items-center gap-2">{["all", "live", "draft", "paused"].map((status) => <button key={status} onClick={() => setStatusFilter(status)} className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition-colors ${statusFilter === status ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`} data-testid={`button-filter-${status}`}>{status === "all" ? "Alle" : status === "live" ? "Live" : status === "draft" ? "Entwurf" : "Pausiert"}</button>)}</div></div>
       {websites.isLoading ? <div className="p-4"><SkeletonRows count={5} /></div> : websites.isError ? <div className="p-4"><ErrorState onRetry={() => websites.refetch()} /></div> : filtered.length === 0 ? <div className="p-4"><EmptyState title={query || statusFilter !== "all" ? "Keine passenden Websites" : "Deine Übersicht beginnt hier"} message={query || statusFilter !== "all" ? "Versuche eine andere Suche oder einen anderen Filter." : "Verknüpfe dein erstes Projekt."} action={<button onClick={() => setModal("new")} className="rounded-lg bg-primary px-3 py-2 text-xs font-extrabold text-primary-foreground" data-testid="button-add-empty-website">Website verknüpfen</button>} /></div> : <div className="divide-y divide-border">{filtered.map((site) => <WebsiteRow key={site.id} site={site} onEdit={() => setModal(site)} onDelete={() => remove(site)} onStatus={() => changeStatus(site)} deleting={deleteWebsite.isPending} />)}</div>}</section>
    {modal && <WebsiteModal website={modal === "new" ? null : modal} onClose={() => setModal(null)} onSave={(data) => save(data, modal)} pending={createWebsite.isPending || updateWebsite.isPending} />}
  </div></Shell>;
}

type EventFormData = { title: string; message: string; imageUrl?: string | null; isActive: boolean };

function EventsPage() {
  const queryClient = useQueryClient();
  const events = useListManagedEvents({ query: { queryKey: getListManagedEventsQueryKey() } });
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const [modal, setModal] = useState<Event | "new" | null>(null);
  const [notice, setNotice] = useState("");
  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListManagedEventsQueryKey() });
  const save = (data: EventFormData, editing: Event | "new") => {
    if (editing === "new") {
      createEvent.mutate({ data }, {
        onSuccess: () => { invalidate(); setModal(null); setNotice("Event wurde erstellt."); },
        onError: () => setNotice("Das Event konnte nicht erstellt werden."),
      });
    } else {
      updateEvent.mutate({ eventId: editing.id, data }, {
        onSuccess: () => { invalidate(); setModal(null); setNotice("Event wurde aktualisiert."); },
        onError: () => setNotice("Das Event konnte nicht aktualisiert werden."),
      });
    }
  };
  const toggle = (event: Event) => updateEvent.mutate({ eventId: event.id, data: { isActive: !event.isActive } }, { onSuccess: invalidate, onError: () => setNotice("Der Status konnte nicht geändert werden.") });
  const remove = (event: Event) => {
    if (!window.confirm(`Soll das Event „${event.title}“ wirklich gelöscht werden?`)) return;
    deleteEvent.mutate({ eventId: event.id }, { onSuccess: () => { invalidate(); setNotice("Event gelöscht."); }, onError: () => setNotice("Das Event konnte nicht gelöscht werden.") });
  };

  return <Shell><div className="page-enter">
    <PageHeader eyebrow="bereich / events" title="Events" description="Erstelle eine Nachricht, die beim ersten Besuch auf deiner öffentlichen Seite eingeblendet wird." action={<button onClick={() => setModal("new")} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-extrabold text-primary-foreground shadow-[0_8px_20px_hsl(var(--primary)/.18)] transition-transform hover:-translate-y-0.5" data-testid="button-add-event"><CirclePlus className="h-4 w-4" /> Event erstellen</button>} />
    {notice && <div className="mb-5 flex items-center justify-between rounded-xl border border-primary/20 bg-accent px-4 py-3 text-xs font-semibold text-accent-foreground" data-testid="status-event-notice"><span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {notice}</span><button onClick={() => setNotice("")} data-testid="button-dismiss-event-notice"><X className="h-4 w-4" /></button></div>}
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border p-5"><h2 className="text-sm font-extrabold">Deine Events</h2><p className="mt-1 text-xs text-muted-foreground">Nur aktive Events werden öffentlich angezeigt. Bei mehreren aktiven Events wird das zuletzt erstellte eingeblendet.</p></div>
      {events.isLoading ? <div className="p-4"><SkeletonRows count={3} /></div> : events.isError ? <div className="p-4"><ErrorState onRetry={() => events.refetch()} /></div> : events.data?.length ? <div className="divide-y divide-border">{events.data.map((event) => <EventRow key={event.id} event={event} pending={updateEvent.isPending || deleteEvent.isPending} onEdit={() => setModal(event)} onToggle={() => toggle(event)} onDelete={() => remove(event)} />)}</div> : <div className="p-4"><EmptyState title="Noch keine Events" message="Erstelle dein erstes Event, damit Besucher beim Start eine Nachricht sehen." action={<button onClick={() => setModal("new")} className="rounded-lg bg-primary px-3 py-2 text-xs font-extrabold text-primary-foreground" data-testid="button-add-empty-event">Event erstellen</button>} /></div>}
    </section>
     {modal && <EventModal event={modal === "new" ? null : modal} onClose={() => setModal(null)} onSave={(data) => save({ ...data, imageUrl: data.imageUrl?.trim() || null }, modal)} pending={createEvent.isPending || updateEvent.isPending} />}
  </div></Shell>;
}

function EventRow({ event, pending, onEdit, onToggle, onDelete }: { event: Event; pending: boolean; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
  return <div className="flex flex-col gap-4 p-5 transition-colors hover:bg-muted/30 md:flex-row md:items-center" data-testid={`row-event-${event.id}`}>
    {event.imageUrl && <img src={event.imageUrl} alt="" className="h-20 w-28 shrink-0 rounded-xl object-cover" loading="lazy" />}
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><span className="text-sm font-extrabold">{event.title}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${event.isActive ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>{event.isActive ? "Aktiv" : "Inaktiv"}</span></div><p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{event.message}</p></div>
    <div className="flex shrink-0 flex-wrap gap-2"><button onClick={onToggle} disabled={pending} className="focus-ring rounded-lg border border-border px-3 py-2 text-xs font-bold transition-colors hover:bg-muted disabled:opacity-50" data-testid={`button-toggle-event-${event.id}`}>{event.isActive ? "Deaktivieren" : "Aktivieren"}</button><button onClick={onEdit} disabled={pending} className="focus-ring rounded-lg border border-border px-3 py-2 text-xs font-bold transition-colors hover:bg-muted disabled:opacity-50" data-testid={`button-edit-event-${event.id}`}>Bearbeiten</button><button onClick={onDelete} disabled={pending} className="focus-ring rounded-lg border border-destructive/20 px-3 py-2 text-xs font-bold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50" data-testid={`button-delete-event-${event.id}`}>Löschen</button></div>
  </div>;
}

function EventModal({ event, onClose, onSave, pending }: { event: Event | null; onClose: () => void; onSave: (data: EventFormData) => void; pending: boolean }) {
  const [form, setForm] = useState<EventFormData>({ title: event?.title ?? "", message: event?.message ?? "", imageUrl: event?.imageUrl ?? "", isActive: event?.isActive ?? true });
  const update = (key: "title" | "message" | "imageUrl", value: string) => setForm((current) => ({ ...current, [key]: value }));
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true">
    <div className="w-full max-w-lg rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><div className="mono-label text-primary">{event ? "event bearbeiten" : "neues event"}</div><h2 className="mt-1 text-lg font-extrabold">{event ? "Event aktualisieren" : "Event erstellen"}</h2></div><button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" data-testid="button-close-event-modal"><X className="h-4 w-4" /></button></div>
      <form onSubmit={(submitEvent) => { submitEvent.preventDefault(); onSave({ title: form.title.trim(), message: form.message.trim(), isActive: form.isActive }); }} className="space-y-4 p-5">
        <label className="block"><span className="mb-1.5 block text-xs font-bold">Titel</span><input required minLength={1} maxLength={120} value={form.title} onChange={(event) => update("title", event.target.value)} className="focus-ring h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none" placeholder="Neue Website veröffentlicht" data-testid="input-event-title" /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-bold">Nachricht</span><textarea required minLength={1} maxLength={1000} rows={5} value={form.message} onChange={(event) => update("message", event.target.value)} className="focus-ring w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none" placeholder="Erzähle Besuchern, was es Neues gibt." data-testid="textarea-event-message" /></label>
         <label className="block"><span className="mb-1.5 block text-xs font-bold">Bild-URL <span className="font-normal text-muted-foreground">(optional)</span></span><input type="url" maxLength={500} value={form.imageUrl ?? ""} onChange={(event) => update("imageUrl", event.target.value)} className="focus-ring h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none" placeholder="https://..." data-testid="input-event-image-url" /></label>
        <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-3 text-xs font-bold"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 accent-[hsl(var(--primary))]" data-testid="checkbox-event-active" /> Direkt öffentlich anzeigen</label>
        <div className="flex justify-end gap-2 border-t border-border pt-4"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted" data-testid="button-cancel-event">Abbrechen</button><button disabled={pending} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground disabled:opacity-60" data-testid="button-save-event">{pending && <Loader2 className="h-4 w-4 animate-spin" />} {event ? "Änderungen speichern" : "Event erstellen"}</button></div>
      </form>
    </div>
  </div>;
}

type WebsiteFormData = { name: string; url: string; githubUrl?: string | null; description?: string | null; status?: "live" | "draft" | "paused" };

function WebsiteRow({ site, onEdit, onDelete, onStatus, deleting }: { site: Website; onEdit: () => void; onDelete: () => void; onStatus: () => void; deleting: boolean }) {
  const [open, setOpen] = useState(false);
   return <div className="flex flex-col gap-4 p-4 transition-colors hover:bg-muted/40 md:flex-row md:items-center" data-testid={`row-website-${site.id}`}><div className="flex min-w-0 flex-1 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent text-accent-foreground">{site.imageUrl ? <img src={site.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" /> : <Globe2 className="h-[18px] w-[18px]" />}</div><div className="min-w-0"><div className="truncate text-sm font-extrabold">{site.name}</div><div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><span className="truncate">{site.url}</span>{site.githubUrl && <a href={site.githubUrl} target="_blank" rel="noreferrer" className="text-foreground hover:text-primary" title="GitHub öffnen" data-testid={`link-github-${site.id}`}><Github className="h-3.5 w-3.5" /></a>}</div></div></div><div className="flex items-center gap-5 pl-[52px] md:pl-0"><div className="hidden min-w-24 sm:block"><div className="text-xs font-bold">{formatNumber(site.visits)}</div><div className="text-[10px] text-muted-foreground">Aufrufe</div></div><button onClick={onStatus} className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold capitalize transition-colors ${site.status === "live" ? "bg-accent text-accent-foreground hover:bg-primary/20" : site.status === "draft" ? "bg-muted text-muted-foreground hover:bg-secondary" : "bg-amber-100 text-amber-800 hover:bg-amber-200"}`} title="Status ändern" data-testid={`button-status-${site.id}`}>{site.status === "live" ? "Live" : site.status === "draft" ? "Entwurf" : "Pausiert"}</button><div className="relative ml-auto"><button onClick={() => setOpen(!open)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" data-testid={`button-menu-website-${site.id}`}><MoreHorizontal className="h-4 w-4" /></button>{open && <div className="absolute bottom-10 right-0 z-50 mb-1 w-40 rounded-xl border border-border bg-popover p-1.5 shadow-xl"><button onClick={() => { setOpen(false); onEdit(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold hover:bg-muted" data-testid={`button-edit-website-${site.id}`}><Pencil className="h-3.5 w-3.5" /> Bearbeiten</button><button onClick={() => { setOpen(false); onDelete(); }} disabled={deleting} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50" data-testid={`button-delete-website-${site.id}`}><Trash2 className="h-3.5 w-3.5" /> Löschen</button></div>}</div></div></div>;
}

function WebsiteModal({ website, onClose, onSave, pending }: { website: Website | null; onClose: () => void; onSave: (data: WebsiteFormData) => void; pending: boolean }) {
  const [form, setForm] = useState<WebsiteFormData>({ name: website?.name ?? "", url: website?.url ?? "", githubUrl: website?.githubUrl ?? "", description: website?.description ?? "", status: website?.status ?? "draft" });
  const update = (key: keyof WebsiteFormData, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => { event.preventDefault(); onSave({ ...form, name: form.name.trim(), url: form.url.trim(), githubUrl: form.githubUrl?.trim() || null, description: form.description?.trim() || null }); };
   return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><div className="mono-label text-primary">{website ? "website bearbeiten" : "neue website"}</div><h2 className="mt-1 text-lg font-extrabold">{website ? "Website aktualisieren" : "Website verknüpfen"}</h2></div><button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" data-testid="button-close-website-modal"><X className="h-4 w-4" /></button></div><form onSubmit={submit} className="space-y-4 p-5"><label className="block"><span className="mb-1.5 block text-xs font-bold">Name</span><input required value={form.name} onChange={(event) => update("name", event.target.value)} className="focus-ring h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none" placeholder="Mein Portfolio" data-testid="input-website-name" /></label><label className="block"><span className="mb-1.5 block text-xs font-bold">Website-URL</span><input required type="url" value={form.url} onChange={(event) => update("url", event.target.value)} className="focus-ring h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none" placeholder="https://meine-website.de" data-testid="input-website-url" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-xs font-bold">GitHub-URL <span className="font-normal text-muted-foreground">(optional)</span></span><input type="url" value={form.githubUrl ?? ""} onChange={(event) => update("githubUrl", event.target.value)} className="focus-ring h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none" placeholder="https://github.com/..." data-testid="input-website-github" /></label><label className="block"><span className="mb-1.5 block text-xs font-bold">Status</span><select value={form.status} onChange={(event) => update("status", event.target.value)} className="focus-ring h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none" data-testid="select-website-status"><option value="draft">Entwurf</option><option value="live">Live</option><option value="paused">Pausiert</option></select></label></div><label className="block"><span className="mb-1.5 block text-xs font-bold">Beschreibung <span className="font-normal text-muted-foreground">(optional)</span></span><textarea value={form.description ?? ""} onChange={(event) => update("description", event.target.value)} rows={3} className="focus-ring w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none" placeholder="Worum geht es bei diesem Projekt?" data-testid="textarea-website-description" /></label><div className="flex justify-end gap-2 border-t border-border pt-4"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted" data-testid="button-cancel-website">Abbrechen</button><button disabled={pending} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground disabled:opacity-60" data-testid="button-save-website">{pending && <Loader2 className="h-4 w-4 animate-spin" />} {website ? "Änderungen speichern" : "Website verknüpfen"}</button></div></form></div></div>;
}

function UsersPage() {
  const user = useUser().user;
  const currentUser = useGetCurrentUser();
  const isAdmin = currentUser.data?.role === "admin";
  const queryClient = useQueryClient();
  const users = useListUsers({ query: { enabled: isAdmin, queryKey: getListUsersQueryKey() } });
  const updateRole = useUpdateUserRole();
  const [notice, setNotice] = useState("");
  if (!isAdmin) return <Shell><div className="page-enter mx-auto max-w-xl py-16"><div className="rounded-2xl border border-border bg-card p-8 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-primary" /><h1 className="mt-4 text-2xl font-extrabold">Adminrechte erforderlich</h1><p className="mt-2 text-sm text-muted-foreground">Personen und Rollen sind nur für Administratoren sichtbar.</p><Link href="/dashboard" className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground" data-testid="link-back-dashboard">Zur Übersicht</Link></div></div></Shell>;
  const isProtectedAdmin = (person: AppUser) => person.email.trim().toLowerCase() === bootstrapAdminEmail || person.id === currentUser.data?.id;
  const changeRole = (person: AppUser, role: string) => {
    if (isProtectedAdmin(person)) {
      setNotice("Die eigene Admin-Rolle ist geschützt.");
      return;
    }
    updateRole.mutate({ userId: person.id, data: { role: role as AppUserRole } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        setNotice(`Die Rolle von ${person.name} ist jetzt ${role}.`);
      },
      onError: () => setNotice("Die Rolle konnte nicht geändert werden."),
    });
  };
  return <Shell><div className="page-enter"><PageHeader eyebrow="bereich / personen" title="Personen" description="Verwalte, wer deine Projektübersicht sehen und bearbeiten darf." />{notice && <div className="mb-5 rounded-xl border border-primary/20 bg-accent px-4 py-3 text-xs font-semibold text-accent-foreground" data-testid="status-role-notice">{notice}</div>}{users.isError ? <ErrorState onRetry={() => users.refetch()} /> : <section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="text-sm font-extrabold">Mitglieder</h2><p className="mt-1 text-xs text-muted-foreground">{users.data?.length ?? 0} registrierte Personen</p></div><div className="rounded-lg bg-accent px-3 py-2 text-xs font-bold text-accent-foreground"><Users className="mr-1.5 inline h-3.5 w-3.5" /> Zugriffe verwalten</div></div>{users.isLoading ? <div className="p-4"><SkeletonRows count={5} /></div> : users.data?.length ? <div className="divide-y divide-border">{users.data.map((person) => { const protectedAdmin = isProtectedAdmin(person); return <div key={person.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center" data-testid={`row-user-${person.id}`}><div className="flex min-w-0 flex-1 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-extrabold text-secondary-foreground">{initials(person.name)}</div><div className="min-w-0"><div className="truncate text-sm font-extrabold">{person.name}</div><div className="truncate text-xs text-muted-foreground">{person.email}</div></div></div><div className="flex items-center gap-4 pl-[52px] sm:pl-0"><div className="hidden text-right sm:block"><div className="text-[10px] text-muted-foreground">Zuletzt aktiv</div><div className="text-xs font-semibold">{formatRelative(person.lastActiveAt)}</div></div><div className="relative"><select value={person.role} disabled={updateRole.isPending || protectedAdmin} onChange={(event) => changeRole(person, event.target.value)} aria-label={protectedAdmin ? `${person.name} — eigene Admin-Rolle geschützt` : `Rolle von ${person.name} ändern`} title={protectedAdmin ? "Die eigene Admin-Rolle kann nicht geändert werden." : undefined} className={`focus-ring h-9 rounded-lg border border-input bg-background px-3 text-xs font-bold capitalize outline-none ${protectedAdmin ? "cursor-not-allowed opacity-70" : ""}`} data-testid={`select-role-${person.id}`}><option value="admin">Admin</option><option value="moderator">Moderator</option><option value="member">Mitglied</option></select></div></div></div>; })}</div> : <div className="p-4"><EmptyState title="Noch keine Personen" message="Neue Mitglieder werden hier angezeigt." /></div>}</section>}</div></Shell>;
}

function FeedbackPage() {
  const currentUser = useGetCurrentUser();
  const queryClient = useQueryClient();
  const isAdmin = currentUser.data?.role === "admin";
  const canManageFeedback = isAdmin || currentUser.data?.role === "moderator";
  const feedback = useListManagedFeedback({ query: { enabled: canManageFeedback, queryKey: getListManagedFeedbackQueryKey() } });
  const reports = useListFeedbackReports({ query: { enabled: canManageFeedback, queryKey: getListFeedbackReportsQueryKey() } });
  const updateFeedback = useUpdateFeedback();
  const updateReport = useUpdateFeedbackReport();
  const deleteFeedback = useDeleteFeedback();
  const [notice, setNotice] = useState("");
  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListManagedFeedbackQueryKey() });
  const toggleVisibility = (item: ManagedFeedback) => {
    updateFeedback.mutate(
       { feedbackId: item.id, data: { isVisible: !item.isVisible, reason: window.prompt("Optionaler Moderationsgrund:") || null } },
      {
        onSuccess: () => {
          invalidate();
          setNotice(item.isVisible ? "Feedback wurde ausgeblendet." : "Feedback wurde veröffentlicht.");
        },
        onError: () => setNotice("Die Sichtbarkeit konnte nicht geändert werden."),
      },
    );
  };
  const remove = (item: ManagedFeedback) => {
    if (!window.confirm(`Soll das Feedback von ${item.teacherName} wirklich gelöscht werden?`)) return;
    deleteFeedback.mutate(
      { feedbackId: item.id },
      {
        onSuccess: () => {
          invalidate();
          setNotice("Feedback wurde gelöscht.");
        },
        onError: () => setNotice("Das Feedback konnte nicht gelöscht werden."),
      },
    );
  };

  if (currentUser.isLoading) return <Shell><div className="page-enter"><SkeletonRows count={4} /></div></Shell>;
  if (!canManageFeedback) return <Shell><div className="page-enter mx-auto max-w-xl py-16"><div className="rounded-2xl border border-border bg-card p-8 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-primary" /><h1 className="mt-4 text-2xl font-extrabold">Adminrechte erforderlich</h1><p className="mt-2 text-sm text-muted-foreground">Feedback kann nur im geschützten Verwaltungsbereich verwaltet werden.</p><Link href="/dashboard" className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground" data-testid="link-back-feedback-dashboard">Zur Übersicht</Link></div></div></Shell>;

  return <Shell><div className="page-enter"><PageHeader eyebrow="bereich / feedback" title="Rückmeldungen" description="Prüfe, welche Rückmeldungen öffentlich in deiner Projektübersicht erscheinen." />{notice && <div className="mb-5 flex items-center justify-between rounded-xl border border-primary/20 bg-accent px-4 py-3 text-xs font-semibold text-accent-foreground" data-testid="status-feedback-notice"><span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {notice}</span><button onClick={() => setNotice("")} data-testid="button-dismiss-feedback-notice"><X className="h-4 w-4" /></button></div>}<section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="text-sm font-extrabold">Eingegangene Rückmeldungen</h2><p className="mt-1 text-xs text-muted-foreground">{feedback.data?.length ?? 0} Rückmeldungen insgesamt</p></div><div className="rounded-lg bg-accent px-3 py-2 text-xs font-bold text-accent-foreground"><MessageSquareText className="mr-1.5 inline h-3.5 w-3.5" /> Veröffentlichung verwalten</div></div>{feedback.isLoading ? <div className="p-4"><SkeletonRows count={4} /></div> : feedback.isError ? <div className="p-4"><ErrorState onRetry={() => feedback.refetch()} /></div> : feedback.data?.length ? <div className="divide-y divide-border">{feedback.data.map((item) => <ManagedFeedbackRow key={item.id} item={item} isAdmin={isAdmin} pending={updateFeedback.isPending || deleteFeedback.isPending} onToggle={() => toggleVisibility(item)} onDelete={() => remove(item)} />)}</div> : <div className="p-4"><EmptyState title="Noch kein Feedback" message="Neue Rückmeldungen erscheinen hier." /></div>}</section><FeedbackReportsPanel reports={reports.data ?? []} loading={reports.isLoading} pending={updateReport.isPending} onUpdate={(reportId, status) => updateReport.mutate({ reportId, data: { status } }, { onSuccess: () => reports.refetch() })} /></div></Shell>;
}

function FeedbackHistory({ feedbackId }: { feedbackId: number }) {
  const history = useListFeedbackHistory(feedbackId, { query: { queryKey: getListFeedbackHistoryQueryKey(feedbackId) } });
  if (history.isLoading) return <div className="mt-3 h-4 w-36 animate-pulse rounded bg-muted" />;
  if (!history.data?.length) return null;
  return <div className="mt-3 rounded-lg border border-border/70 bg-background/70 px-3 py-2"><div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Moderationshistorie</div><div className="mt-2 space-y-1.5">{history.data.slice(0, 3).map((entry: FeedbackModerationHistory) => <div key={entry.id} className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground"><span className="font-bold text-foreground">{entry.action === "published" ? "Veröffentlicht" : entry.action === "hidden" ? "Ausgeblendet" : "Gelöscht"}</span><span>{entry.actorName}</span><span>{formatRelative(entry.createdAt)}</span>{entry.reason && <span>· {entry.reason}</span>}</div>)}</div></div>;
}

function FeedbackReportsPanel({ reports, loading, pending, onUpdate }: { reports: FeedbackReport[]; loading: boolean; pending: boolean; onUpdate: (reportId: number, status: "reviewed" | "dismissed") => void }) {
  const openReports = reports.filter((report) => report.status === "open");
  return <section className="mt-5 overflow-hidden rounded-2xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="text-sm font-extrabold">Gemeldete Rückmeldungen</h2><p className="mt-1 text-xs text-muted-foreground">{openReports.length} offene Meldung{openReports.length === 1 ? "" : "en"}</p></div><CircleAlert className="h-4 w-4 text-primary" /></div>{loading ? <div className="p-4"><SkeletonRows count={2} /></div> : !reports.length ? <div className="p-5"><EmptyState compact title="Keine Meldungen" message="Gemeldete Feedbacks erscheinen hier zur Prüfung." /></div> : <div className="divide-y divide-border">{reports.map((report) => <div key={report.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-extrabold">Feedback #{report.feedbackId}</span><span className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold">{report.reason}</span><span className="text-[10px] text-muted-foreground">{formatRelative(report.createdAt)}</span></div>{report.details && <p className="mt-2 text-xs leading-5 text-muted-foreground">{report.details}</p>}</div>{report.status === "open" ? <div className="flex shrink-0 gap-2"><button type="button" disabled={pending} onClick={() => onUpdate(report.id, "reviewed")} className="focus-ring rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">Prüfung erledigt</button><button type="button" disabled={pending} onClick={() => onUpdate(report.id, "dismissed")} className="focus-ring rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-muted disabled:opacity-50">Verwerfen</button></div> : <span className="text-[10px] font-bold text-muted-foreground">{report.status === "reviewed" ? "Geprüft" : "Verworfen"}{report.reviewedBy ? ` · ${report.reviewedBy}` : ""}</span>}</div>)}</div>}</section>;
}

function MemberRequestsPage() {
  const queryClient = useQueryClient();
  const requests = useListManagedMemberRequests({ query: { queryKey: getListManagedMemberRequestsQueryKey() } });
  const updateStatus = useUpdateMemberRequestStatus();
  const deleteRequest = useDeleteManagedMemberRequest();
  const changeStatus = (requestId: number, status: "open" | "in_progress" | "closed") => {
    updateStatus.mutate({ requestId, data: { status } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListManagedMemberRequestsQueryKey() }),
    });
  };
  const remove = (requestId: number, userName: string) => {
    if (!window.confirm(`Soll die Anfrage von ${userName} wirklich gelöscht werden?`)) return;
    deleteRequest.mutate({ requestId }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListManagedMemberRequestsQueryKey() }),
    });
  };
  return <Shell><div className="page-enter"><PageHeader eyebrow="bereich / anfragen" title="Mitgliederanfragen" description="Beantworte Nachrichten von Mitgliedern und halte sie über den Bearbeitungsstand auf dem Laufenden." />{requests.isLoading ? <SkeletonRows count={4} /> : requests.isError ? <ErrorState onRetry={() => requests.refetch()} /> : requests.data?.length ? <section className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">{requests.data.map((request) => <div key={request.id} className="p-5" data-testid={`member-request-${request.id}`}><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-sm font-extrabold">{request.userName}</div><div className="text-xs text-muted-foreground">{request.userEmail} · {formatRelative(request.createdAt)}</div></div><div className="flex items-center gap-2"><select value={request.status === "withdrawn" ? "open" : request.status} onChange={(event) => changeStatus(request.id, event.target.value as "open" | "in_progress" | "closed")} disabled={updateStatus.isPending || request.status === "withdrawn"} className="focus-ring rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold outline-none" data-testid={`select-member-request-status-${request.id}`}><option value="open">Offen</option><option value="in_progress">In Bearbeitung</option><option value="closed">Erledigt</option></select><button type="button" onClick={() => remove(request.id, request.userName)} disabled={deleteRequest.isPending} className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-destructive/20 px-3 py-2 text-xs font-bold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50" data-testid={`button-delete-member-request-${request.id}`}><Trash2 className="h-3.5 w-3.5" /> Löschen</button></div></div><p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-6 text-muted-foreground">{request.message}</p><RequestHistory requestId={request.id} /></div>)}</section> : <EmptyState title="Noch keine Anfragen" message="Neue Nachrichten von Mitgliedern erscheinen hier." />}</div></Shell>;
}

function AdminActivityPage() {
  const activity = useListAdminActivity({ query: { queryKey: getListAdminActivityQueryKey() } });
  return <Shell><div className="page-enter"><PageHeader eyebrow="bereich / protokoll" title="Admin-Aktivität" description="Nachvollziehbarer Verlauf aller wichtigen Verwaltungsaktionen." /><section className="rounded-2xl border border-border bg-card p-5 md:p-6">{activity.isLoading ? <SkeletonRows count={8} /> : activity.isError ? <ErrorState onRetry={() => activity.refetch()} /> : activity.data?.length ? <div className="space-y-4">{activity.data.map((item) => <div key={item.id} className="flex gap-3 border-b border-border pb-4 last:border-0 last:pb-0"><div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-primary"><ActivityIcon className="h-3.5 w-3.5" /></div><div><p className="text-sm font-semibold">{item.message}</p><p className="mt-1 text-[11px] text-muted-foreground">{item.actorName} · {formatRelative(item.createdAt)}</p></div></div>)}</div> : <EmptyState compact title="Noch keine Einträge" message="Admin-Aktionen erscheinen hier." />}</section></div></Shell>;
}

function ProfilePage() {
  return <div className="min-h-[100dvh] bg-background px-4 py-8 text-foreground md:px-8"><div className="mx-auto flex max-w-5xl items-center justify-between pb-6"><Link href="/dashboard" className="focus-ring inline-flex items-center gap-2 text-sm font-extrabold text-muted-foreground hover:text-foreground" data-testid="link-profile-back-dashboard"><ArrowDown className="h-4 w-4 rotate-90" /> Zurück zum Dashboard</Link><BrandMark compact /></div><div className="mx-auto max-w-5xl"><UserProfile routing="path" path={`${basePath}/profile`} /></div></div>;
}

function ManagedFeedbackRow({ item, isAdmin, pending, onToggle, onDelete }: { item: ManagedFeedback; isAdmin: boolean; pending: boolean; onToggle: () => void; onDelete: () => void }) {
  return <div className="flex flex-col gap-4 p-5 transition-colors hover:bg-muted/30 lg:flex-row lg:items-center" data-testid={`row-feedback-${item.id}`}><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><span className="text-sm font-extrabold">{item.teacherName}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${item.isVisible ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>{item.isVisible ? "Öffentlich" : "Ausgeblendet"}</span><span className="text-[10px] text-muted-foreground">{formatRelative(item.createdAt)}</span></div><div className="mt-2 flex items-center gap-1 text-primary" aria-label={`${item.rating} von 5 Sternen`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-3.5 w-3.5" fill={star <= item.rating ? "currentColor" : "none"} />)}</div><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">„{item.feedback}“</p><FeedbackHistory feedbackId={item.id} /></div><div className="flex shrink-0 flex-wrap gap-2"><button onClick={onToggle} disabled={pending} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold transition-colors hover:bg-muted disabled:cursor-wait disabled:opacity-50" data-testid={`button-toggle-feedback-${item.id}`}>{item.isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{item.isVisible ? "Ausblenden" : "Veröffentlichen"}</button>{isAdmin && <button onClick={onDelete} disabled={pending} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-destructive/20 px-3 py-2 text-xs font-bold text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-wait disabled:opacity-50" data-testid={`button-delete-feedback-${item.id}`}><Trash2 className="h-3.5 w-3.5" /> Löschen</button>}</div></div>;
}

function AuthPages() {
  return <><Route path="/sign-in/*?" component={() => <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>} /><Route path="/sign-up/*?" component={() => <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>} /></>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  useEffect(() => addListener(() => { qc.clear(); }), [addListener, qc]);
  return null;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <div className="flex min-h-[100dvh] items-center justify-center bg-background"><div className="skeleton h-16 w-64 rounded-xl" /></div>;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <>{children}</>;
}

function AdminOnlyRoute({ children }: { children: ReactNode }) {
  const currentUser = useGetCurrentUser();
  if (currentUser.isLoading) return <div className="flex min-h-[100dvh] items-center justify-center bg-background"><div className="skeleton h-16 w-64 rounded-xl" /></div>;
  if (currentUser.data?.role !== "admin") {
    return <Shell><div className="page-enter mx-auto max-w-xl py-16"><div className="rounded-2xl border border-border bg-card p-8 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-primary" /><h1 className="mt-4 text-2xl font-extrabold">Adminrechte erforderlich</h1><p className="mt-2 text-sm text-muted-foreground">Dieser Bereich ist nur für Administratoren verfügbar. Deine Übersicht mit Live-Projekten und Aktivitäten bleibt zugänglich.</p><Link href="/dashboard" className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground" data-testid="link-back-dashboard-admin-required">Zur Übersicht</Link></div></div></Shell>;
  }
  return <>{children}</>;
}

function Router() {
  return <><ClerkQueryClientCacheInvalidator /><Switch><Route path="/sign-in/*?" component={() => <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} forceRedirectUrl={`${basePath}/`} /></div>} /><Route path="/sign-up/*?" component={() => <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} forceRedirectUrl={`${basePath}/`} /></div>} /><Route path="/" component={Home} /><Route path="/projects/:websiteId" component={ProjectDetailPage} /><Route path="/profile/*?"><ProtectedRoute><ProfilePage /></ProtectedRoute></Route><Route path="/dashboard"><ProtectedRoute><DashboardPage /></ProtectedRoute></Route><Route path="/websites"><ProtectedRoute><AdminOnlyRoute><WebsitesPage /></AdminOnlyRoute></ProtectedRoute></Route><Route path="/events"><ProtectedRoute><AdminOnlyRoute><EventsPage /></AdminOnlyRoute></ProtectedRoute></Route><Route path="/feedback"><ProtectedRoute><FeedbackPage /></ProtectedRoute></Route><Route path="/users"><ProtectedRoute><AdminOnlyRoute><UsersPage /></AdminOnlyRoute></ProtectedRoute></Route><Route path="/requests"><ProtectedRoute><AdminOnlyRoute><MemberRequestsPage /></AdminOnlyRoute></ProtectedRoute></Route><Route path="/activity"><ProtectedRoute><AdminOnlyRoute><AdminActivityPage /></AdminOnlyRoute></ProtectedRoute></Route><Route component={NotFound} /></Switch></>;
}

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} localization={deDE} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} routerPush={(to) => setLocation(stripBase(to))} routerReplace={(to) => setLocation(stripBase(to), { replace: true })}><ErrorBoundary><Router /></ErrorBoundary></ClerkProvider>;
}

function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter base={basePath}><ClerkProviderWithRoutes /></WouterRouter></QueryClientProvider>;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("de-DE", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatRelative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "kürzlich";
  const hours = Math.round((Date.now() - date.getTime()) / 3600000);
  if (hours < 1) return "gerade eben";
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.round(hours / 24);
  return days < 30 ? `vor ${days} Tagen` : date.toLocaleDateString("de-DE", { month: "short", day: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

export default App;