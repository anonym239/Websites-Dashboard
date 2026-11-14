import { useState, useSyncExternalStore, type ComponentProps, type FormEvent, type ReactNode } from "react";
import {
  ClerkProvider as RealClerkProvider,
  SignIn as RealSignIn,
  SignUp as RealSignUp,
  UserProfile as RealUserProfile,
  useClerk as useRealClerk,
  useUser as useRealUser,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { setLocalIdentityGetter } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";

/**
 * Clerk when a publishable key is configured, otherwise a browser-only login.
 * The local login only unlocks this browser's own copy of the data; publishing
 * to the live site still needs the admin's GitHub token.
 */
const configuredClerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
// publishableKeyFromHost derives a key from the hostname even when none is set,
// which then fails to load; only use Clerk when a key was configured explicitly.
export const clerkPubKey = configuredClerkKey ? (publishableKeyFromHost(window.location.hostname, configuredClerkKey) as string) : undefined;
export const hasClerk = Boolean(clerkPubKey);

type PreviewRole = "admin" | "member";
type LocalUser = { id: string; firstName: string; lastName: string; email: string; preview?: PreviewRole };
/** A registered browser account. Only a salted PBKDF2 hash of the password is stored. */
type LocalAccount = { id: string; firstName: string; lastName: string; email: string; salt: string; hash: string; createdAt: string };

const LOCAL_USER_KEY = "webspace.local-user.v1";
const LOCAL_ACCOUNTS_KEY = "webspace.local-accounts.v1";

function readAccounts(): LocalAccount[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) ?? "[]") as LocalAccount[];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: LocalAccount[]) {
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    throw new Error("Dein Browser blockiert den Speicher – das Konto kann nicht gespeichert werden.");
  }
}

const toHex = (bytes: ArrayBuffer | Uint8Array) => Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");

async function hashPassword(password: string, saltHex: string) {
  const salt = new Uint8Array(saltHex.match(/../g)!.map((pair) => parseInt(pair, 16)));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 150_000 }, key, 256);
  return toHex(bits);
}

async function registerAccount(name: string, email: string, password: string): Promise<LocalUser> {
  const accounts = readAccounts();
  if (accounts.some((account) => account.email === email)) throw new Error("Mit dieser E-Mail gibt es schon ein Konto. Bitte melde dich an.");
  const [firstName = "", ...rest] = name.trim().split(/\s+/);
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const previous = readLocalUser();
  const account: LocalAccount = {
    // Keep the id of an earlier password-less login with the same e-mail, so its data stays linked.
    id: previous && !previous.preview && previous.email === email ? previous.id : `local_${crypto.randomUUID()}`,
    firstName,
    lastName: rest.join(" "),
    email,
    salt,
    hash: await hashPassword(password, salt),
    createdAt: new Date().toISOString(),
  };
  writeAccounts([...accounts, account]);
  return { id: account.id, firstName: account.firstName, lastName: account.lastName, email };
}

async function verifyAccount(email: string, password: string): Promise<LocalUser> {
  const account = readAccounts().find((item) => item.email === email);
  if (!account) throw new Error("Zu dieser E-Mail gibt es noch kein Konto. Bitte registriere dich zuerst.");
  if ((await hashPassword(password, account.salt)) !== account.hash) throw new Error("Das Passwort stimmt nicht.");
  return { id: account.id, firstName: account.firstName, lastName: account.lastName, email: account.email };
}

const PREVIEW_USERS: Record<PreviewRole, LocalUser> = {
  admin: { id: "preview_teacher", firstName: "Lehrer", lastName: "(Vorschau)", email: "lehrer@vorschau.local", preview: "admin" },
  member: { id: "preview_guest", firstName: "Gast", lastName: "", email: "gast@vorschau.local", preview: "member" },
};
const userListeners = new Set<() => void>();
let cachedUser: LocalUser | null | undefined;

function readLocalUser(): LocalUser | null {
  if (cachedUser !== undefined) return cachedUser;
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    cachedUser = raw ? (JSON.parse(raw) as LocalUser) : null;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

function writeLocalUser(user: LocalUser | null) {
  cachedUser = user;
  try {
    if (user) localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(LOCAL_USER_KEY);
  } catch {
    // Blocked storage: the login lasts until the tab is closed.
  }
  userListeners.forEach((listener) => listener());
}

function subscribeLocalUser(listener: () => void) {
  userListeners.add(listener);
  return () => {
    userListeners.delete(listener);
  };
}

type ClerkWindow = { Clerk?: { user?: { id: string; fullName?: string | null; imageUrl?: string; primaryEmailAddress?: { emailAddress: string } | null } | null } };

setLocalIdentityGetter(() => {
  const preview = readLocalUser();
  if (preview?.preview) {
    return { id: preview.id, name: `${preview.firstName} ${preview.lastName}`.trim(), email: preview.email, previewRole: preview.preview };
  }
  if (hasClerk) {
    const user = (window as unknown as ClerkWindow).Clerk?.user;
    const email = user?.primaryEmailAddress?.emailAddress;
    return user && email ? { id: user.id, name: user.fullName || email, email, avatarUrl: user.imageUrl ?? null } : null;
  }
  const user = readLocalUser();
  return user ? { id: user.id, name: `${user.firstName} ${user.lastName}`.trim() || user.email, email: user.email, previewRole: user.preview } : null;
});

function toUserShape(user: LocalUser) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    primaryEmailAddress: { emailAddress: user.email },
  };
}

function useLocalUser() {
  const user = useSyncExternalStore(subscribeLocalUser, readLocalUser);
  return { isLoaded: true, isSignedIn: Boolean(user), user: user ? toUserShape(user) : null };
}

function useLocalClerk() {
  return {
    signOut: async ({ redirectUrl }: { redirectUrl?: string } = {}) => {
      writeLocalUser(null);
      if (redirectUrl) window.location.assign(redirectUrl);
    },
    addListener: (listener: () => void) => subscribeLocalUser(listener),
  };
}

type UserState = {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  user: ReturnType<typeof toUserShape> | null | undefined;
};

/** With Clerk, a read-only preview session ("Lehrer" / "Gast") still takes precedence. */
function useClerkOrPreviewUser(): UserState {
  const real = useRealUser() as unknown as UserState;
  const local = useSyncExternalStore(subscribeLocalUser, readLocalUser);
  return local?.preview ? { isLoaded: true, isSignedIn: true, user: toUserShape(local) } : real;
}

function useClerkWithPreview() {
  const clerk = useRealClerk();
  return {
    signOut: async (options: { redirectUrl?: string } = {}) => {
      if (readLocalUser()?.preview) {
        writeLocalUser(null);
        if (options.redirectUrl) window.location.assign(options.redirectUrl);
        return;
      }
      await clerk.signOut(options);
    },
  };
}

function useLocalSignOut() {
  const { signOut } = useLocalClerk();
  return { signOut };
}

export const useUser = (hasClerk ? useClerkOrPreviewUser : useLocalUser) as () => UserState;
export const useClerk = (hasClerk ? useClerkWithPreview : useLocalSignOut) as () => { signOut: (options?: { redirectUrl?: string }) => Promise<void> };

/** Read-only preview role ("admin" = Überblick für Lehrer, "member" = Gast), or null. */
export function usePreviewRole(): PreviewRole | null {
  const user = useSyncExternalStore(subscribeLocalUser, readLocalUser);
  return user?.preview ?? null;
}

export function endPreview() {
  writeLocalUser(null);
}

export function AuthProvider({ children, ...props }: Omit<ComponentProps<typeof RealClerkProvider>, "publishableKey"> & { children: ReactNode }) {
  if (!hasClerk) return <>{children}</>;
  return <RealClerkProvider publishableKey={clerkPubKey!} {...props}>{children}</RealClerkProvider>;
}

const inputClass = "focus-ring h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none";

function LocalAuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const [, setLocation] = useLocation();
  const existing = readLocalUser();
  const known = existing && !existing.preview ? existing : null;
  const [name, setName] = useState(known ? `${known.firstName} ${known.lastName}`.trim() : "");
  const [email, setEmail] = useState(known?.email ?? "");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const signUp = mode === "sign-up";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (signUp && password.length < 8) return setError("Das Passwort braucht mindestens 8 Zeichen.");
    if (signUp && password !== repeat) return setError("Die beiden Passwörter sind nicht gleich.");
    setBusy(true);
    try {
      const user = signUp ? await registerAccount(name, normalizedEmail, password) : await verifyAccount(normalizedEmail, password);
      writeLocalUser(user);
      setLocation("/dashboard");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Das hat nicht geklappt.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-[440px] max-w-full rounded-2xl border border-border bg-card p-8 shadow-xl" data-testid="local-auth">
      <div className="mono-label text-primary">{signUp ? "konto anlegen" : "anmelden"}</div>
      <h1 className="mt-2 text-2xl font-extrabold tracking-[-.04em]">{signUp ? "Neues Konto" : "Willkommen zurück"}</h1>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{signUp ? "Wähle ein Passwort mit mindestens 8 Zeichen." : "Melde dich mit deiner E-Mail und deinem Passwort an."} Das Konto wird nur in diesem Browser gespeichert.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {signUp && <label className="block"><span className="mb-1.5 block text-xs font-bold">Name</span><input required minLength={2} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="Max Mustermann" data-testid="input-local-name" /></label>}
        <label className="block"><span className="mb-1.5 block text-xs font-bold">E-Mail</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="max@mustermann.de" data-testid="input-local-email" /></label>
        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-xs font-bold">Passwort<button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[11px] font-semibold text-primary" data-testid="button-toggle-password">{showPassword ? "verbergen" : "anzeigen"}</button></span>
          <input required type={showPassword ? "text" : "password"} minLength={signUp ? 8 : 1} autoComplete={signUp ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} placeholder={signUp ? "mindestens 8 Zeichen" : "Dein Passwort"} data-testid="input-local-password" />
        </label>
        {signUp && <label className="block"><span className="mb-1.5 block text-xs font-bold">Passwort wiederholen</span><input required type={showPassword ? "text" : "password"} autoComplete="new-password" value={repeat} onChange={(event) => setRepeat(event.target.value)} className={inputClass} data-testid="input-local-password-repeat" /></label>}
        {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive" data-testid="status-auth-error">{error}</div>}
        <button type="submit" disabled={busy} className="focus-ring w-full rounded-lg bg-primary px-4 py-3 text-sm font-extrabold text-primary-foreground disabled:opacity-60" data-testid="button-local-sign-in">{busy ? "Einen Moment ..." : signUp ? "Konto anlegen" : "Anmelden"}</button>
      </form>
      <PreviewButtons className="mt-6" />
      <div className="mt-5 border-t border-border pt-4 text-center text-xs text-muted-foreground">
        {signUp ? <>Schon registriert? <Link href="/sign-in" className="font-bold text-primary">Anmelden</Link></> : <>Noch kein Konto? <Link href="/sign-up" className="font-bold text-primary">Registrieren</Link></>}
        <span className="mx-2">·</span><Link href="/" className="font-bold text-primary">Zur Startseite</Link>
      </div>
    </div>
  );
}

/** "Überblick für Lehrer" (admin view) and "Als Gast" (member view) – read-only previews. */
function PreviewButtons({ className = "" }: { className?: string }) {
  const [, setLocation] = useLocation();
  const preview = (role: PreviewRole) => {
    writeLocalUser(PREVIEW_USERS[role]);
    setLocation("/dashboard");
  };
  return (
    <div className={className}>
      <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground"><span className="h-px flex-1 bg-border" />oder erst mal umsehen<span className="h-px flex-1 bg-border" /></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => preview("admin")} className="focus-ring rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/50 hover:bg-muted" data-testid="button-preview-teacher"><span className="block text-xs font-extrabold">Überblick für Lehrer</span><span className="block text-[10px] text-muted-foreground">Ansicht als Admin</span></button>
        <button type="button" onClick={() => preview("member")} className="focus-ring rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/50 hover:bg-muted" data-testid="button-preview-guest"><span className="block text-xs font-extrabold">Als Gast</span><span className="block text-[10px] text-muted-foreground">Ansicht als Mitglied</span></button>
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">Die Vorschau ist nur zum Ansehen – ändern geht erst mit Konto.</p>
    </div>
  );
}

function ClerkWithPreview({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-[440px] max-w-full flex-col items-center">
      {children}
      <PreviewButtons className="mt-6 w-full rounded-2xl border border-border bg-card p-5" />
    </div>
  );
}

function LocalUserProfile() {
  const user = useSyncExternalStore(subscribeLocalUser, readLocalUser);
  const [name, setName] = useState(user ? `${user.firstName} ${user.lastName}`.trim() : "");
  const [saved, setSaved] = useState(false);
  if (!user) return null;
  const save = (event: FormEvent) => {
    event.preventDefault();
    const [firstName, ...rest] = name.trim().split(/\s+/);
    writeLocalUser({ ...user, firstName: firstName ?? "", lastName: rest.join(" ") });
    const accounts = readAccounts();
    if (accounts.some((account) => account.id === user.id)) writeAccounts(accounts.map((account) => (account.id === user.id ? { ...account, firstName: firstName ?? "", lastName: rest.join(" ") } : account)));
    setSaved(true);
  };
  return (
    <div className="max-w-xl rounded-2xl border border-border bg-card p-6" data-testid="local-profile">
      <div className="mono-label text-primary">profil</div>
      <h1 className="mt-2 text-2xl font-extrabold tracking-[-.04em]">Dein Konto</h1>
      <form onSubmit={save} className="mt-5 space-y-4">
        <label className="block"><span className="mb-1.5 block text-xs font-bold">Name</span><input required value={name} onChange={(event) => { setName(event.target.value); setSaved(false); }} className="focus-ring h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none" data-testid="input-profile-name" /></label>
        <div className="text-xs text-muted-foreground">E-Mail: <span className="font-bold text-foreground">{user.email}</span></div>
        <div className="flex items-center gap-3"><button type="submit" className="focus-ring rounded-lg bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground" data-testid="button-save-profile">Speichern</button>{saved && <span className="text-xs font-semibold text-primary">Gespeichert.</span>}</div>
      </form>
    </div>
  );
}

export function SignIn(props: ComponentProps<typeof RealSignIn>) {
  return hasClerk ? <ClerkWithPreview><RealSignIn {...props} /></ClerkWithPreview> : <LocalAuthForm mode="sign-in" />;
}

export function SignUp(props: ComponentProps<typeof RealSignUp>) {
  return hasClerk ? <ClerkWithPreview><RealSignUp {...props} /></ClerkWithPreview> : <LocalAuthForm mode="sign-up" />;
}

export function UserProfile(props: ComponentProps<typeof RealUserProfile>) {
  const preview = usePreviewRole();
  return hasClerk && !preview ? <RealUserProfile {...props} /> : <LocalUserProfile />;
}
