import { HttpClient } from "@angular/common/http";
import { Injectable, computed, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, map, tap } from "rxjs";
import * as Sentry from "@sentry/angular";
import { ConfigurationService } from "../configuration/configuration.service";
import { API_BASE_URL } from "../models/api-config";
import { User } from "../models/user.model";

const TOKEN_KEY = "fitora_token";
const USER_KEY = "fitora_user";
const IMPERSONATOR_KEY = "fitora_impersonator";

interface AuthResponse {
  token: string;
  user: User;
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
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  readonly isOwner = computed(() => this.currentUserSignal()?.role === "owner");
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === "admin");
  readonly isStaff = computed(() => this.currentUserSignal()?.role === "staff");

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
    this.syncSentryUser(this.currentUserSignal());
  }

  private syncSentryUser(user: User | null): void {
    Sentry.setUser(user ? { id: user.id, email: user.email, company_id: user.company_id ?? undefined, role: user.role } : null);
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/auth/login`, { email, password })
      .pipe(tap((res) => this.setSession(res)));
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/auth/register`, payload)
      .pipe(tap((res) => this.setSession(res)));
  }

  // (Re)hydrate ConfigurationService from /bootstrap. Safe to call
  // repeatedly; failures leave the last known value in place. Skipped for a
  // platform admin — the /admin surface isn't tenant-scoped — but the admin
  // still gets the real-time system_update notification feed.
  loadConfiguration(): void {
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

  logout(): void {
    // Logging out of an impersonated session should drop back to the admin
    // account that started it, not destroy that admin's session too — the
    // explicit "exit impersonation" banner action does the same thing, this
    // just makes the ordinary logout button behave sanely in that context.
    if (this.isImpersonating()) {
      this.exitImpersonation();
      return;
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSignal.set(null);
    this.syncSentryUser(null);
    this.config.clear();
    this.router.navigate(["/auth/login"]);
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
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.currentUserSignal.set(res.user);
    this.syncSentryUser(res.user);
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
