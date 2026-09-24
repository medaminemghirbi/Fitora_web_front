import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../auth/auth.service";

/**
 * Nothing past sign-up opens until the admin has clicked the emailed link.
 * The backend refuses it anyway (`email_unverified`); this sends them to the
 * screen that waits for the click instead of a page full of failed requests.
 */
export const emailConfirmedGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.emailConfirmationPending() ? router.createUrlTree(["/confirmation-email"]) : true;
};

/** The inverse — once confirmed, the waiting screen has nothing to wait for. */
export const emailPendingGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.emailConfirmationPending() ? true : router.createUrlTree([auth.homeRouteForCurrentUser()]);
};
