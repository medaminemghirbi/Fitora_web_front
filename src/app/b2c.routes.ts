import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { guestGuard } from "./core/guards/guest.guard";
import { memberGuard } from "./core/guards/member.guard";

/**
 * The B2C half: Fitora and the person who trains.
 *
 * The root belongs to them — someone looking for a gym should land on the
 * directory, not on a pitch written for gym owners (that one lives at /pro).
 * Browsing needs no account; joining is what asks for one.
 */
export const b2cRoutes: Routes = [
  {
    // The front door: it asks who you are rather than pitching one audience.
    path: "",
    pathMatch: "full",
    canActivate: [guestGuard],
    loadComponent: () => import("./features/public/home/public-home.component").then((m) => m.PublicHomeComponent),
  },
  { path: "gyms", pathMatch: "full", loadComponent: () => import("./features/public/gym/gym-search.component").then((m) => m.GymSearchComponent) },
  { path: "gyms/:id", loadComponent: () => import("./features/public/gym/gym-page.component").then((m) => m.GymPageComponent) },
  {
    path: "connexion",
    canActivate: [guestGuard],
    loadComponent: () => import("./features/b2c/auth/member-login.component").then((m) => m.MemberLoginComponent),
  },
  {
    path: "inscription",
    canActivate: [guestGuard],
    loadComponent: () => import("./features/auth/register.component").then((m) => m.RegisterComponent),
  },
  {
    path: "mot-de-passe-oublie",
    canActivate: [guestGuard],
    loadComponent: () => import("./features/auth/forgot-password.component").then((m) => m.ForgotPasswordComponent),
  },
  {
    path: "member",
    canActivate: [authGuard, memberGuard],
    loadComponent: () => import("./layout/member-shell/member-shell.component").then((m) => m.MemberShellComponent),
    children: [
      { path: "home", loadComponent: () => import("./features/member/home/member-home.component").then((m) => m.MemberHomeComponent) },
      { path: "explore", loadComponent: () => import("./features/member/explore/member-explore.component").then((m) => m.MemberExploreComponent) },
      { path: "sessions/:id", loadComponent: () => import("./features/member/session-detail/member-session-detail.component").then((m) => m.MemberSessionDetailComponent) },
      { path: "bookings/:id/confirmed", loadComponent: () => import("./features/member/booking-confirmation/member-booking-confirmation.component").then((m) => m.MemberBookingConfirmationComponent) },
      { path: "bookings", loadComponent: () => import("./features/member/bookings/member-bookings.component").then((m) => m.MemberBookingsComponent) },
      { path: "gyms", loadComponent: () => import("./features/member/gyms/member-gyms.component").then((m) => m.MemberGymsComponent) },
      { path: "progress", loadComponent: () => import("./features/member/progress/member-progress.component").then((m) => m.MemberProgressComponent) },
      { path: "profile", loadComponent: () => import("./features/member/profile/member-profile.component").then((m) => m.MemberProfileComponent) },
      { path: "", pathMatch: "full", redirectTo: "home" },
    ],
  },
];
