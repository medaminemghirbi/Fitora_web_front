import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../auth/auth.service";

// Every admin-area page assumes an company exists (locations, dashboard,
// etc. all scope through it). A freshly registered admin has none yet, so
// this sends them to the setup step first instead of letting every page
// underneath 422 on missing-company.
export const companyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.currentUser()?.company_id == null) {
    return router.createUrlTree(["/admin/setup-company"]);
  }

  return true;
};

// The inverse — once an admin already has an company, the setup page
// has nothing to do there.
export const noCompanyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.currentUser()?.company_id != null) {
    return router.createUrlTree([auth.homeRouteForCurrentUser()]);
  }

  return true;
};
