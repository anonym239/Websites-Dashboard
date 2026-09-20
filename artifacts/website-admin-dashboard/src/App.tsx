{`${summary.data?.liveWebsites ?? live.length} live`} icon={Globe2} accent /><StatCard label="Aufrufe insgesamt" value={formatNumber(summary.data?.totalVisits ?? 0)} detail="über alle Websites" icon={CircleGauge} /><StatCard label="Registrierte Personen" value={summary.data?.registeredUsers ?? 0} detail="in deiner Übersicht" icon={Users} /><StatCard label="Verfügbarkeit" value={summary.data?.uptime ?? "—"} detail="Durchschnitt der letzten 30 Tage" icon={ActivityIcon} />{isAdmin && <><StatCard label="Offene Anfragen" value={summary.data?.openRequests ?? 0} detail="wartet auf Bearbeitung" icon={Send} accent /><StatCard label="Neue Mitglieder" value={summary.data?.newMembers ?? 0} detail="in den letzten 30 Tagen" icon={Users} /><StatCard label="Aktive Events" value={summary.data?.activeEvents ?? 0} detail="öffentlich sichtbar" icon={CirclePlus} /><StatCard label="Feedbackprüfung" value={summary.data?.pendingFeedback ?? 0} detail="ausgeblendete Einträge" icon={MessageSquareText} /></>}</>}</div>
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
    return <Shell><div className="page-enter"><PageHeader eyebrow="bereich / websites" title="Websites" description="Verknüpfe hier alle Projekte, die deine Lehrer sehen sollen." action={<div className="flex flex-col gap-2 sm:flex-row"><button onClick={syncNetlify} disabled={importNetlify.isPending} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-extrabold transition-colors hover:bg-muted disabled:cursor-wait disabled:opacity-60" data-testid="button-sync-netlify">{importNetlify.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />} {importNetlify.isPending ? "Netlify wird geladen..." : "Von Netlify synchronisieren"}</button><button onClick={() => setModal("new")} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-extrabold text-primary-foreground shadow-[0_8px_20px_hsl(var(--primary)/.18)] transition-transform hover:-translate-y-0.5" data-testid="button-add-website"><CirclePlus className="h-4 w-4" /> Website verknüpfen</button></div>} />
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

  return <Shell><div className="page-enter"><PageHeader eyebrow="bereich / feedback" title="Lehrerfeedback" description="Prüfe, welche Rückmeldungen öffentlich in deiner Projektübersicht erscheinen." />{notice && <div className="mb-5 flex items-center justify-between rounded-xl border border-primary/20 bg-accent px-4 py-3 text-xs font-semibold text-accent-foreground" data-testid="status-feedback-notice"><span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {notice}</span><button onClick={() => setNotice("")} data-testid="button-dismiss-feedback-notice"><X className="h-4 w-4" /></button></div>}<section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="text-sm font-extrabold">Eingegangene Rückmeldungen</h2><p className="mt-1 text-xs text-muted-foreground">{feedback.data?.length ?? 0} Rückmeldungen insgesamt</p></div><div className="rounded-lg bg-accent px-3 py-2 text-xs font-bold text-accent-foreground"><MessageSquareText className="mr-1.5 inline h-3.5 w-3.5" /> Veröffentlichung verwalten</div></div>{feedback.isLoading ? <div className="p-4"><SkeletonRows count={4} /></div> : feedback.isError ? <div className="p-4"><ErrorState onRetry={() => feedback.refetch()} /></div> : feedback.data?.length ? <div className="divide-y divide-border">{feedback.data.map((item) => <ManagedFeedbackRow key={item.id} item={item} isAdmin={isAdmin} pending={updateFeedback.isPending || deleteFeedback.isPending} onToggle={() => toggleVisibility(item)} onDelete={() => remove(item)} />)}</div> : <div className="p-4"><EmptyState title="Noch kein Feedback" message="Neue Rückmeldungen von Lehrern erscheinen hier." /></div>}</section><FeedbackReportsPanel reports={reports.data ?? []} loading={reports.isLoading} pending={updateReport.isPending} onUpdate={(reportId, status) => updateReport.mutate({ reportId, data: { status } }, { onSuccess: () => reports.refetch() })} /></div></Shell>;
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