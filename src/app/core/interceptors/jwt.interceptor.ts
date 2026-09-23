import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";
import { AuthService } from "../auth/auth.service";

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  const authorizedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authorizedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && auth.isAuthenticated()) {
        auth.logout();
        router.navigate(["/connexion"]);
      }

      // 402 is the lock signal from Api::V1::BaseController
      // #enforce_trial_lock!, whatever closed the door — an expired trial, a
      // month left unpaid, a suspension. Any of them lands on the same page,
      // rather than leaving a half-loaded screen behind the rejected request.
      if (error.status === 402 && !router.url.startsWith("/account-locked")) {
        router.navigate(["/account-locked"]);
      }

      // An owner whose address is not confirmed yet reaches nothing past
      // sign-up (BaseController#require_confirmed_email!). The guards
      // normally keep them on the waiting screen; this catches a stale tab.
      if (error.status === 403 && error.error?.error === "email_unverified" && !router.url.startsWith("/confirmation-email")) {
        router.navigate(["/confirmation-email"]);
      }

      return throwError(() => error);
    })
  );
};
