import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { catchError, map, of } from "rxjs";
import { AuthService } from "../auth/auth.service";
import { ConfigurationService } from "../configuration/configuration.service";
import { StaffRole } from "../models/user.model";

// Entry guard for the /owner shell — the owner, plus staff. A "coach"-role
// staff only gets bounced to the dedicated coach shell when the company runs
// the fitness module; otherwise (a practitioner in a medical/legal/… company)
// they use this shell, filtered by their permissions.
export const ownerAreaGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const config = inject(ConfigurationService);
  const router = inject(Router);
  const user = auth.currentUser();

  if (!user) return router.createUrlTree(["/connexion"]);
  if (user.role === "admin") return router.createUrlTree(["/admin/companies"]);

  return config.ensureLoaded().pipe(
    map(() => (auth.coachShellApplies() ? router.createUrlTree(["/coach/today"]) : true)),
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

    if (!user) return router.createUrlTree(["/connexion"]);

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

// The Settings area is configuration — the owner, or a staff role the owner
// has explicitly granted a catalogue capability. A plain receptionist has
// nothing to configure and is bounced home.
export const settingsAccessGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const config = inject(ConfigurationService);
  const router = inject(Router);
  const user = auth.currentUser();

  if (!user) return router.createUrlTree(["/connexion"]);

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

  if (!user) return router.createUrlTree(["/connexion"]);
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

    if (!user) return router.createUrlTree(["/connexion"]);
    if (user.role !== "staff" || user.staff_role !== role) {
      return router.createUrlTree([auth.homeRouteForCurrentUser()]);
    }
    return config.ensureLoaded().pipe(
      map(() => (auth.coachShellApplies() ? true : router.createUrlTree(["/owner/dashboard"]))),
      catchError(() => of(true))
    );
  };
}
