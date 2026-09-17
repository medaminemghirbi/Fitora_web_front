import { HttpClient } from "@angular/common/http";
import { Injectable, computed, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, map, tap } from "rxjs";
import * as Sentry from "@sentry/angular";
import { ConfigurationService } from "../configuration/configuration.service";
import { API_BASE_URL } from "../models/api-config";
import { Client } from "../models/client.model";
import { User } from "../models/user.model";

const TOKEN_KEY = "fitora_token";
const USER_KEY = "fitora_user";
const CLIENT_KEY = "fitora_client";
const IMPERSONATOR_KEY = "fitora_impersonator";

// /auth/login tries a platform account (owner/staff/admin) first, then a
// client's own mobile login — account_type says which one came back. Every
// other AuthResponse in this file (register, impersonation) is always a
// "user" login, so account_type/client stay optional there.
interface AuthResponse {
  token: string;
  account_type?: "user" | "client";
  user?: User;
  client?: Client;
}

interface ImpersonatorStash {
  token: string;
  user: User;
  companyName: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
  locale?: string;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly currentUserSignal = signal<User | null>(this.readStoredUser());
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isOwner = computed(() => this.currentUserSignal()?.role === "owner");
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === "admin");
  readonly isStaff = computed(() => this.currentUserSignal()?.role === "staff");

  // A Client's own mobile-style login (/member) — mutually exclusive with
  // currentUser, never both set at once (see setSession).
  private readonly currentClientSignal = signal<Client | null>(this.readStoredClient());
  readonly currentClient = this.currentClientSignal.asReadonly();
  readonly isClient = computed(() => this.currentClientSignal() !== null);

  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null || this.currentClientSignal() !== null);

  private readonly impersonatorStashSignal = signal<ImpersonatorStash | null>(this.readImpersonatorStash());
  readonly isImpersonating = computed(() => this.impersonatorStashSignal() !== null);
  readonly impersonatedCompanyName = computed(() => this.impersonatorStashSignal()?.companyName ?? null);

  // Configuration (company, branding, permissions, modules, subscription) is
  // owned by ConfigurationService and hydrated from GET /api/v1/bootstrap;
  // these delegate so callers that already inject AuthService keep working.
  private readonly config = inject(ConfigurationService);
  readonly permissions = this.config.permissions;
  readonly activeRole = this.config.role;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {
    // Attributes any error caught after this to the tenant it happened for
    // — a no-op call when Sentry was never initialized (no DSN, see
    // main.ts), so this is safe to always run.
    const client = this.currentClientSignal();
    if (client) {
      Sentry.setUser({ id: client.id, email: client.email ?? undefined });
    } else {
      this.syncSentryUser(this.currentUserSignal());
    }
  }

  private syncSentryUser(user: User | null): void {
    Sentry.setUser(user ? { id: user.id, email: user.email, company_id: user.company_id ?? undefined, role: user.role } : null);
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/auth/login`, { email, password })
      .pipe(tap((res) => this.setSession(res)));
  }

  /**
   * Someone signing themselves up as a member — no gym involved; they pick
   * their gyms afterwards from the directory. This is the ONLY
   * self-registration left: a gym asks for a demo or a quote instead
   * (LeadsService), and Fitora opens its account after the conversation.
   */
  registerClient(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/auth/register_client`, payload)
      .pipe(tap((res) => this.setSession(res)));
  }

  // (Re)hydrate ConfigurationService from /bootstrap. Safe to call
  // repeatedly; failures leave the last known value in place. Skipped for a
  // platform admin — the /admin surface isn't tenant-scoped — but the admin
  // still gets the real-time system_update notification feed. Also skipped
  // for a client: /bootstrap is built entirely around current_user (role,
  // permissions, modules) and has nothing a member's own shell needs — it
  // fetches its own branding directly via BrandingService instead.
  loadConfiguration(): void {
    if (this.isClient()) {
      this.config.clear();
      return;
    }
    if (this.currentUserSignal()?.role === "admin") {
      this.config.clear();
      this.config.connectAdminNotifications();
      return;
    }
    this.config.load().subscribe({ error: () => {} });
  }

  hasPermission(key: string): boolean {
    const user = this.currentUserSignal();
    if (!user) return false;
    if (user.role === "admin") return true;
    return this.config.hasPermission(key);
  }

  /**
   * Drops the session without leaving the page. Used when a sign-in
   * succeeded but landed in the wrong zone — the account is real, it just
   * does not belong here, so the page stays put and says where to go.
   */
  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(CLIENT_KEY);
    this.currentUserSignal.set(null);
    this.currentClientSignal.set(null);
    this.syncSentryUser(null);
    this.config.clear();
  }

  logout(): void {
    // Logging out of an impersonated session should drop back to the admin
    // account that started it, not destroy that admin's session too — the
    // explicit "exit impersonation" banner action does the same thing, this
    // just makes the ordinary logout button behave sanely in that context.
    if (this.isImpersonating()) {
      this.exitImpersonation();
      return;
    }

    // Each zone has its own sign-in, so logging out has to land in the one
    // this account belongs to.
    const backTo = this.isClient() ? "/connexion" : "/pro/connexion";
    this.clearSession();
    this.router.navigate([ backTo ]);
  }

  // Called by the admin companies page after POST .../impersonate
  // succeeds — stashes the admin's own session so it can be restored, then
  // switches to the impersonated owner's session.
  startImpersonation(res: AuthResponse, companyName: string): void {
    const token = this.getToken();
    const user = this.currentUserSignal();
    if (token && user) {
      const stash: ImpersonatorStash = { token, user, companyName };
      localStorage.setItem(IMPERSONATOR_KEY, JSON.stringify(stash));
      this.impersonatorStashSignal.set(stash);
    }
    this.setSession(res);
    this.router.navigate(["/owner/dashboard"]);
  }

  exitImpersonation(): void {
    const stash = this.impersonatorStashSignal();
    if (!stash) return;

    localStorage.removeItem(IMPERSONATOR_KEY);
    this.impersonatorStashSignal.set(null);
    this.setSession({ token: stash.token, user: stash.user });
    this.router.navigate(["/admin/companies"]);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  homeRouteForCurrentUser(): string {
    if (this.isClient()) return "/member/home";
    const user = this.currentUserSignal();
    if (user?.role === "admin") return "/admin/companies";
    // A "coach"-role staff uses the dedicated coach shell ("My schedule" /
    // attendance).
    if (user?.staff_role === "coach") return "/coach/today";
    // A freshly-signed-up owner lands on the "Premiers pas" guide until the
    // foundational setup is done (or they skip it).
    const setup = this.config.setup();
    if (user?.role === "owner" && setup && !setup.complete && !setup.dismissed) return "/owner/getting-started";
    // The dashboard needs only the base `reports` permission — the safe
    // universal landing for every other role.
    return "/owner/dashboard";
  }

  // Whether a "coach"-role staff should use the dedicated coach shell.
  coachShellApplies(): boolean {
    return this.currentUserSignal()?.staff_role === "coach";
  }

  // Re-fetches the current user — used after an action that changes something
  // the cached user object doesn't auto-update for, e.g. creating an
  // company (company_id is only known once one exists).
  refreshCurrentUser(): Observable<User> {
    return this.http.get<{ user: User }>(`${API_BASE_URL}/auth/me`).pipe(
      map((res) => res.user),
      tap((user) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.currentUserSignal.set(user);
        this.loadConfiguration();
      })
    );
  }

  private setSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);

    if (res.account_type === "client" && res.client) {
      localStorage.removeItem(USER_KEY);
      localStorage.setItem(CLIENT_KEY, JSON.stringify(res.client));
      this.currentUserSignal.set(null);
      this.currentClientSignal.set(res.client);
      Sentry.setUser({ id: res.client.id, email: res.client.email ?? undefined });
    } else if (res.user) {
      localStorage.removeItem(CLIENT_KEY);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      this.currentClientSignal.set(null);
      this.currentUserSignal.set(res.user);
      this.syncSentryUser(res.user);
    }

    this.loadConfiguration();
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  private readStoredClient(): Client | null {
    const raw = localStorage.getItem(CLIENT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Client;
    } catch {
      return null;
    }
  }

  private readImpersonatorStash(): ImpersonatorStash | null {
    const raw = localStorage.getItem(IMPERSONATOR_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ImpersonatorStash;
    } catch {
      return null;
    }
  }
}
