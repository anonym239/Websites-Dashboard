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

type LocalUser = { id: string; firstName: string; lastName: string; email: string };

const LOCAL_USER_KEY = "webspace.local-user.v1";
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
  if (hasClerk) {
    const user = (window as unknown as ClerkWindow).Clerk?.user;
    const email = user?.primaryEmailAddress?.emailAddress;
    return user && email ? { id: user.id, name: user.fullName || email, email, avatarUrl: user.imageUrl ?? null } : null;
  }
  const user = readLocalUser();
  return user ? { id: user.id, name: `${user.firstName} ${user.lastName}`.trim() || user.email, email: user.email } : null;
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

export const useUser = (hasClerk ? useRealUser : useLocalUser) as () => {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  user: ReturnType<typeof toUserShape> | null | undefined;
};
export const useClerk = (hasClerk ? useRealClerk : useLocalClerk) as () => ReturnType<typeof useLocalClerk>;

export function AuthProvider({ children, ...props }: Omit<ComponentProps<typeof RealClerkProvider>, "publishableKey"> & { children: ReactNode }) {
  if (!hasClerk) return <>{children}</>;
  return <RealClerkProvider publishableKey={clerkPubKey!} {...props}>{children}</RealClerkProvider>;
}

function LocalAuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const [, setLocation] = useLocation();
  const existing = readLocalUser();
  const [name, setName] = useState(existing ? `${existing.firstName} ${existing.lastName}`.trim() : "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const [firstName, ...rest] = name.trim().split(/\s+/);
    const normalizedEmail = email.trim().toLowerCase();
    writeLocalUser({ id: existing?.email === normalizedEmail ? existing.id : `local_${crypto.randomUUID()}`, firstName: firstName ?? "", lastName: rest.join(" "), email: normalizedEmail });
    setLocation("/dashboard");
  };
  return (
    <div className="w-[440px] max-w-full rounded-2xl border border-border bg-card p-8 shadow-xl" data-testid="local-auth">
      <div className="mono-label text-primary">{mode === "sign-in" ? "anmelden" : "konto anlegen"}</div>
      <h1 className="mt-2 text-2xl font-extrabold tracking-[-.04em]">{mode === "sign-in" ? "Willkommen zurück" : "Neues Konto"}</h1>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">Die Anmeldung läuft direkt in deinem Browser, ohne Server. Deine Daten bleiben auf diesem Gerät.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block"><span className="mb-1.5 block text-xs font-bold">Name</span><input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} className="focus-ring h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none" placeholder="Max Mustermann" data-testid="input-local-name" /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-bold">E-Mail</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="focus-ring h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none" placeholder="max@mustermann.de" data-testid="input-local-email" /></label>
        <button type="submit" className="focus-ring w-full rounded-lg bg-primary px-4 py-3 text-sm font-extrabold text-primary-foreground" data-testid="button-local-sign-in">{mode === "sign-in" ? "Anmelden" : "Konto anlegen"}</button>
      </form>
      <div className="mt-5 border-t border-border pt-4 text-center text-xs text-muted-foreground">
        {mode === "sign-in" ? <>Noch kein Konto? <Link href="/sign-up" className="font-bold text-primary">Registrieren</Link></> : <>Schon registriert? <Link href="/sign-in" className="font-bold text-primary">Anmelden</Link></>}
        <span className="mx-2">·</span><Link href="/" className="font-bold text-primary">Zur Startseite</Link>
      </div>
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
  return hasClerk ? <RealSignIn {...props} /> : <LocalAuthForm mode="sign-in" />;
}

export function SignUp(props: ComponentProps<typeof RealSignUp>) {
  return hasClerk ? <RealSignUp {...props} /> : <LocalAuthForm mode="sign-up" />;
}

export function UserProfile(props: ComponentProps<typeof RealUserProfile>) {
  return hasClerk ? <RealUserProfile {...props} /> : <LocalUserProfile />;
}
