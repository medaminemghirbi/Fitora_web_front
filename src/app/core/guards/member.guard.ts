import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../auth/auth.service";

// Gates the /member area (a Client's own mobile-style login) — the
// counterpart to roleGuard for the other kind of session, which carries no
// `role` at all (see AuthService.isClient).
export const memberGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(["/pro/connexion"]);
  }

  if (!auth.isClient()) {
    return router.createUrlTree([auth.homeRouteForCurrentUser()]);
  }

  return true;
};
