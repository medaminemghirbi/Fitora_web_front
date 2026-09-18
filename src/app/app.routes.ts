import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { guestGuard } from "./core/guards/guest.guard";
import { noCompanyGuard, companyGuard } from "./core/guards/company.guard";
import { roleGuard } from "./core/guards/role.guard";
import { capabilityGuard, ownerAreaGuard, settingsAccessGuard, staffRoleGuard } from "./core/guards/staff.guard";

/**
 * One zone: a gym and the people who run it.
 *
 * Fitora is sold to gyms. A gym's members are records its staff manage —
 * they have no account here and no page of their own, so there is a single
 * sign-in and a single front door. The /pro prefix that used to separate
 * this half from a member-facing half is gone; the old paths redirect.
 */
export const routes: Routes = [
  {
    path: "",
    canActivate: [guestGuard],
    children: [
      { path: "", pathMatch: "full", loadComponent: () => import("./features/landing/landing.component").then((m) => m.LandingComponent) },
      { path: "connexion", loadComponent: () => import("./features/b2b/auth/pro-login.component").then((m) => m.ProLoginComponent) },
      { path: "demo", data: { kind: "demo" }, loadComponent: () => import("./features/b2b/contact/request-access.component").then((m) => m.RequestAccessComponent) },
      { path: "devis", data: { kind: "quote" }, loadComponent: () => import("./features/b2b/contact/request-access.component").then((m) => m.RequestAccessComponent) },
      { path: "mot-de-passe-oublie", loadComponent: () => import("./features/auth/forgot-password.component").then((m) => m.ForgotPasswordComponent) },
    ],
  },

  // Reached from a link in an email, so not guest-only: someone already
  // signed in on this device should still land here and see it succeed.
  {
    path: "verify-email",
    loadComponent: () => import("./features/auth/verify-email.component").then((m) => m.VerifyEmailComponent),
  },
  {
    path: "auth/reset-password",
    loadComponent: () => import("./features/auth/reset-password.component").then((m) => m.ResetPasswordComponent),
  },

  {
    path: "trial-expired",
    canActivate: [authGuard],
    loadComponent: () => import("./features/trial-expired/trial-expired.component").then((m) => m.TrialExpiredComponent),
  },
  {
    path: "owner/setup-company",
    canActivate: [authGuard, roleGuard("owner"), noCompanyGuard],
    loadComponent: () =>
      import("./features/owner/onboarding/company-setup.component").then((m) => m.CompanySetupComponent),
  },
  {
    path: "owner",
    canActivate: [authGuard, ownerAreaGuard, companyGuard],
    loadComponent: () => import("./layout/owner-shell/owner-shell.component").then((m) => m.OwnerShellComponent),
    children: [
      { path: "dashboard", canActivate: [capabilityGuard("reports")], loadComponent: () => import("./features/owner/dashboard/dashboard.component").then((m) => m.DashboardComponent) },
      { path: "getting-started", canActivate: [roleGuard("owner")], loadComponent: () => import("./features/owner/getting-started/getting-started.component").then((m) => m.GettingStartedComponent) },
      { path: "clients", canActivate: [capabilityGuard("clients")], loadComponent: () => import("./features/owner/clients/clients-list.component").then((m) => m.ClientsListComponent) },
      { path: "clients/:id", canActivate: [capabilityGuard("clients")], loadComponent: () => import("./features/owner/clients/client-profile.component").then((m) => m.ClientProfileComponent) },
      { path: "calendar", loadComponent: () => import("./features/owner/calendar/calendar.component").then((m) => m.CalendarComponent) },
      { path: "bookings", canActivate: [capabilityGuard("bookings")], loadComponent: () => import("./features/owner/bookings/bookings.component").then((m) => m.OwnerBookingsComponent) },
      { path: "contracts", canActivate: [capabilityGuard("contracts")], loadComponent: () => import("./features/owner/contracts/contracts.component").then((m) => m.ContractsComponent) },
      // The catalogue left Settings: a plan and an activity are seasonal
      // business objects, not one-off configuration.
      { path: "contracts/plans", canActivate: [capabilityGuard("contract_types")], loadComponent: () => import("./features/owner/plans/plans.component").then((m) => m.PlansComponent) },
      { path: "contracts/activities", canActivate: [capabilityGuard("activities")], loadComponent: () => import("./features/owner/activities/activities.component").then((m) => m.ActivitiesComponent) },
      { path: "payments", canActivate: [capabilityGuard("payments")], loadComponent: () => import("./features/owner/payments/payments.component").then((m) => m.OwnerPaymentsComponent) },
      // Import/export moved under Settings; the old link keeps working.
      { path: "data-exchange", redirectTo: "settings/data-exchange", pathMatch: "full" },
      { path: "team", canActivate: [capabilityGuard("coaches")], loadComponent: () => import("./features/owner/team/team.component").then((m) => m.TeamComponent) },
      // Coaches + Staff were merged into one Team page — keep the old paths working.
      { path: "coaches", pathMatch: "full", redirectTo: "team" },
      { path: "staff", pathMatch: "full", redirectTo: "team" },
      { path: "subscription", canActivate: [roleGuard("owner")], loadComponent: () => import("./features/owner/subscription/subscription.component").then((m) => m.SubscriptionComponent) },
      { path: "notifications", canActivate: [roleGuard("owner")], loadComponent: () => import("./features/owner/notifications/notifications-inbox.component").then((m) => m.NotificationsInboxComponent) },
      { path: "notifications/:id", canActivate: [roleGuard("owner")], loadComponent: () => import("./features/owner/notifications/notification-detail.component").then((m) => m.NotificationDetailComponent) },
      { path: "settings", canActivate: [settingsAccessGuard], loadComponent: () => import("./features/owner/settings/settings-shell.component").then((m) => m.SettingsShellComponent) },
      { path: "settings/:section", canActivate: [settingsAccessGuard], loadComponent: () => import("./features/owner/settings/settings-shell.component").then((m) => m.SettingsShellComponent) },
      // The marketplace is gone — every feature is included in the subscription.
      { path: "modules", pathMatch: "full", redirectTo: "subscription" },
      { path: "", pathMatch: "full", redirectTo: "dashboard" },
    ],
  },
  {
    path: "coach",
    canActivate: [authGuard, staffRoleGuard("coach")],
    loadComponent: () => import("./layout/coach-shell/coach-shell.component").then((m) => m.CoachShellComponent),
    children: [
      { path: "today", loadComponent: () => import("./features/coach/today/today.component").then((m) => m.CoachTodayComponent) },
      { path: "", pathMatch: "full", redirectTo: "today" },
    ],
  },
  {
    path: "admin",
    canActivate: [authGuard, roleGuard("admin")],
    loadComponent: () => import("./layout/admin-shell/admin-shell.component").then((m) => m.AdminShellComponent),
    children: [
      { path: "companies", loadComponent: () => import("./features/admin/companies/companies.component").then((m) => m.AdminCompaniesComponent) },
      { path: "companies/:id", loadComponent: () => import("./features/admin/company-detail/company-detail.component").then((m) => m.AdminCompanyDetailComponent) },
      { path: "pricing", loadComponent: () => import("./features/admin/pricing/pricing.component").then((m) => m.AdminPricingComponent) },
      { path: "modules", pathMatch: "full", redirectTo: "pricing" },
      { path: "support", loadComponent: () => import("./features/admin/support/support-tickets.component").then((m) => m.AdminSupportTicketsComponent) },
      { path: "updates", loadComponent: () => import("./features/admin/updates/updates.component").then((m) => m.AdminUpdatesComponent) },
      { path: "", pathMatch: "full", redirectTo: "companies" },
    ],
  },

  // ---- where the earlier layouts put these -------------------------------
  { path: "pro", pathMatch: "full", redirectTo: "" },
  { path: "pro/connexion", pathMatch: "full", redirectTo: "/connexion" },
  { path: "pro/demo", pathMatch: "full", redirectTo: "/demo" },
  { path: "pro/devis", pathMatch: "full", redirectTo: "/devis" },
  { path: "pro/mot-de-passe-oublie", pathMatch: "full", redirectTo: "/mot-de-passe-oublie" },
  { path: "auth/login", pathMatch: "full", redirectTo: "/connexion" },
  { path: "auth/register", pathMatch: "full", redirectTo: "/demo" },
  { path: "auth/forgot-password", pathMatch: "full", redirectTo: "/mot-de-passe-oublie" },
  { path: "auth/demo", pathMatch: "full", redirectTo: "/demo" },
  { path: "auth/devis", pathMatch: "full", redirectTo: "/devis" },
  // The member half of the app is gone; so are the gym directory and the
  // member sign-up that fed it.
  { path: "inscription", pathMatch: "full", redirectTo: "" },
  { path: "gyms", redirectTo: "" },
  { path: "member", redirectTo: "" },

  { path: "**", redirectTo: "" },
];
