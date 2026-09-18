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

      // 402 + this specific error code is the trial-lock signal from
      // Api::V1::BaseController#enforce_trial_lock! — redirect to a
      // dedicated page instead of leaving a half-loaded, broken screen
      // behind whatever request just got rejected.
      if (error.status === 402 && error.error?.error === "trial_expired" && !router.url.startsWith("/trial-expired")) {
        router.navigate(["/trial-expired"]);
      }

      return throwError(() => error);
    })
  );
};
