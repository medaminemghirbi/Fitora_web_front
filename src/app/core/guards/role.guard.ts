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

    if (auth.currentUser()?.role !== role) {
      return router.createUrlTree([auth.homeRouteForCurrentUser()]);
    }

    return true;
  };
}
