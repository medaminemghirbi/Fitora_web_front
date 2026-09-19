import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { catchError, map, of } from "rxjs";
import { AuthService } from "../auth/auth.service";
import { ConfigurationService } from "../configuration/configuration.service";
import { StaffRole } from "../models/user.model";

/**
 * Where to send someone who reached a staff page without a staff account.
 *
 * A signed-in member has an account, just not one for this half, so they go
 * to their own home. Sending them to the sign-in page instead would bounce
 * them straight back here — the loop that once left the app hanging on a
 * blank screen.
 */
function elsewhereFor(auth: AuthService, router: Router) {
  return router.createUrlTree([auth.isAuthenticated() ? auth.homeRouteForCurrentUser() : "/connexion"]);
}

// Entry guard for the /owner shell — the owner, plus staff. A "coach"-role
// staff only gets bounced to the dedicated coach shell when the company runs
// the fitness module; otherwise (a practitioner in a medical/legal/… company)
// they use this shell, filtered by their permissions.
export const ownerAreaGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const config = inject(ConfigurationService);
  const router = inject(Router);
  const user = auth.currentUser();

  if (!user) return elsewhereFor(auth, router);
  if (user.role === "admin") return router.createUrlTree(["/admin/overview"]);

  return config.ensureLoaded().pipe(
    map(() => {
      // A locked gym gets one page and no navigation. Caught here rather
      // than waiting for a request to come back 402, so nobody watches a
      // screen load and then empty itself.
      if (config.subscription()?.locked) return router.createUrlTree(["/account-locked"]);

      return auth.coachShellApplies() ? router.createUrlTree(["/coach/today"]) : true;
    }),
    catchError(() => of(true))
  );
};

// Per-page guard mirroring BaseController#require_capability! — resolves the
// permission from /bootstrap (owners already come back with the full set).
export function capabilityGuard(permission: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const config = inject(ConfigurationService);
    const router = inject(Router);
    const user = auth.currentUser();

    if (!user) return elsewhereFor(auth, router);

    return config.ensureLoaded().pipe(
      map(() =>
        !config.ready() || auth.hasPermission(permission)
          ? true
          : router.createUrlTree([auth.homeRouteForCurrentUser()])
      ),
      catchError(() => of(true))
    );
  };
}

/**
 * A page that only exists for a company that turned the feature on.
 *
 * The mirror of the backend's own refusal (SpacesController answers 404 for
 * a gym without rooms), not a substitute for it: this only spares someone
 * an empty screen. Pairs with capabilityGuard, which asks the other
 * question — the product offers this, but may YOU use it.
 */
export function featureGuard(feature: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const config = inject(ConfigurationService);
    const router = inject(Router);
    const user = auth.currentUser();

    if (!user) return elsewhereFor(auth, router);

    return config.ensureLoaded().pipe(
      map(() =>
        !config.ready() || config.features()[feature] === true
          ? true
          : router.createUrlTree([auth.homeRouteForCurrentUser()])
      ),
      catchError(() => of(true))
    );
  };
}

/**
 * Entry guard for the front desk.
 *
 * The desk is for the people who work it: staff who can check members in and
 * book them. Not coaches (whose own shell is their day, and who hold only
 * `checkin`), and not the owner, whose shell is a superset of this one —
 * sending an owner here would hide half their product behind a back button.
 *
 * `checkin` alone is not enough: a coach has it. The test is checking people
 * in AND booking them, which is the desk's actual job.
 */
export const deskAreaGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const config = inject(ConfigurationService);
  const router = inject(Router);
  const user = auth.currentUser();

  if (!user) return elsewhereFor(auth, router);

  return config.ensureLoaded().pipe(
    map(() => {
      if (config.subscription()?.locked) return router.createUrlTree(["/account-locked"]);
      if (user.role !== "staff" || user.is_coach) {
        return router.createUrlTree([auth.homeRouteForCurrentUser()]);
      }

      // Before the permission list has loaded, let them through rather than
      // bouncing them somewhere they will have to navigate back from — the
      // backend refuses anything they may not do regardless.
      if (!config.ready()) return true;

      return auth.hasPermission("checkin") && auth.hasPermission("bookings")
        ? true
        : router.createUrlTree([auth.homeRouteForCurrentUser()]);
    }),
    catchError(() => of(true))
  );
};

// The Settings area is configuration — the owner, or a staff role the owner
// has explicitly granted a catalogue capability. A plain receptionist has
// nothing to configure and is bounced home.
export const settingsAccessGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const config = inject(ConfigurationService);
  const router = inject(Router);
  const user = auth.currentUser();

  if (!user) return elsewhereFor(auth, router);

  return config.ensureLoaded().pipe(
    map(() =>
      !config.ready() ||
      user.role === "owner" ||
      auth.hasPermission("activities") ||
      auth.hasPermission("contract_types")
        ? true
        : router.createUrlTree([auth.homeRouteForCurrentUser()])
    ),
    catchError(() => of(true))
  );
};

// Staff management is owner-only.
export const staffManagerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser();

  if (!user) return elsewhereFor(auth, router);
  if (user.role === "owner") return true;

  return router.createUrlTree([auth.homeRouteForCurrentUser()]);
};

// Entry guard for the coach shell — a "coach"-role staff, and only while the
// company runs the fitness module (otherwise the coach shell has nothing to
// show; the practitioner belongs in the owner shell).
export function staffRoleGuard(role: StaffRole): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const config = inject(ConfigurationService);
    const router = inject(Router);
    const user = auth.currentUser();

    if (!user) return elsewhereFor(auth, router);
    // "coach" is about coaching, not about what the role is named — a coach
    // on a custom role still belongs in the coach shell.
    const holdsRole = role === "coach" ? user.is_coach : user.staff_role === role;
    if (user.role !== "staff" || !holdsRole) {
      return router.createUrlTree([auth.homeRouteForCurrentUser()]);
    }
    return config.ensureLoaded().pipe(
      map(() => (auth.coachShellApplies() ? true : router.createUrlTree(["/owner/dashboard"]))),
      catchError(() => of(true))
    );
  };
}
