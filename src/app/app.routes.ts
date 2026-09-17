import { Routes } from "@angular/router";
import { b2bRoutes } from "./b2b.routes";
import { b2cRoutes } from "./b2c.routes";

/**
 * Two zones that never mix.
 *
 * - b2c.routes.ts — Fitora and the person who trains: the directory at the
 *   root, their sign-in, their sign-up, and /member.
 * - b2b.routes.ts — a gym and the people who run it: everything under /pro,
 *   then /owner, /coach and /admin.
 *
 * Only the two routes below are shared, and only because a link in an email
 * points at them: a password reset and an address confirmation reach the same
 * page whichever kind of account asked for it.
 */
export const routes: Routes = [
  ...b2cRoutes,
  ...b2bRoutes,

  {
    // Not guest-only: someone already signed in on this device should still
    // land here from the emailed link and see it succeed.
    path: "verify-email",
    loadComponent: () => import("./features/auth/verify-email.component").then((m) => m.VerifyEmailComponent),
  },
  {
    path: "auth/reset-password",
    loadComponent: () => import("./features/auth/reset-password.component").then((m) => m.ResetPasswordComponent),
  },

  // ---- where the old single-tree paths went -------------------------------
  { path: "auth/login", pathMatch: "full", redirectTo: "/pro/connexion" },
  { path: "auth/register", pathMatch: "full", redirectTo: "/pro/demo" },
  { path: "auth/register/member", pathMatch: "full", redirectTo: "/inscription" },
  { path: "auth/forgot-password", pathMatch: "full", redirectTo: "/pro/mot-de-passe-oublie" },
  { path: "auth/demo", pathMatch: "full", redirectTo: "/pro/demo" },
  { path: "auth/devis", pathMatch: "full", redirectTo: "/pro/devis" },
  { path: "auth/gyms", pathMatch: "full", redirectTo: "/gyms" },
  { path: "demo", pathMatch: "full", redirectTo: "/pro/demo" },
  { path: "devis", pathMatch: "full", redirectTo: "/pro/devis" },

  // A stranger who mistypes a URL is far more likely to be looking for a gym
  // than for a gym's back office.
  { path: "**", redirectTo: "" },
];
