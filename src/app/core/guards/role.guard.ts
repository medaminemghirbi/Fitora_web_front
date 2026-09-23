import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../auth/auth.service";
import { UserRole } from "../models/user.model";

export function roleGuard(role: UserRole): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(["/connexion"]);
    }

    // A member is authenticated but has no role at all; homeRouteForCurrentUser
    // sends them to their own half rather than back to the sign-in page.
    if (auth.currentUser()?.role !== role) {
      return router.createUrlTree([auth.homeRouteForCurrentUser()]);
    }

    return true;
  };
}
