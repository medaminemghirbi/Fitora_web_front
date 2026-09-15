import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { guestGuard } from "./core/guards/guest.guard";
import { noCompanyGuard, companyGuard } from "./core/guards/company.guard";
import { roleGuard } from "./core/guards/role.guard";
import { capabilityGuard, ownerAreaGuard, settingsAccessGuard, staffRoleGuard } from "./core/guards/staff.guard";

export const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    canActivate: [guestGuard],
    loadComponent: () => import("./features/landing/landing.component").then((m) => m.LandingComponent),
  },
  {
    path: "auth",
    canActivate: [guestGuard],
    children: [
      { path: "login", loadComponent: () => import("./features/auth/login.component").then((m) => m.LoginComponent) },
      { path: "register", loadComponent: () => import("./features/auth/register.component").then((m) => m.RegisterComponent) },
      { path: "forgot-password", loadComponent: () => import("./features/auth/forgot-password.component").then((m) => m.ForgotPasswordComponent) },
      { path: "reset-password", loadComponent: () => import("./features/auth/reset-password.component").then((m) => m.ResetPasswordComponent) },
      { path: "", pathMatch: "full", redirectTo: "login" },
    ],
  },
  {
    // Not under /auth (guest-only) — someone already signed in on this
    // device should still land here from the emailed link and see it
    // succeed, not get bounced by guestGuard.
    path: "verify-email",
    loadComponent: () => import("./features/auth/verify-email.component").then((m) => m.VerifyEmailComponent),
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
      { path: "payments", canActivate: [capabilityGuard("payments")], loadComponent: () => import("./features/owner/payments/payments.component").then((m) => m.OwnerPaymentsComponent) },
      { path: "data-exchange", canActivate: [roleGuard("owner")], loadComponent: () => import("./features/owner/data-exchange/data-exchange.component").then((m) => m.DataExchangeComponent) },
      { path: "team", canActivate: [capabilityGuard("coaches")], loadComponent: () => import("./features/owner/team/team.component").then((m) => m.TeamComponent) },
      // Coaches + Staff were merged into one Team page — keep the old paths working.
      { path: "coaches", pathMatch: "full", redirectTo: "team" },
      { path: "staff", pathMatch: "full", redirectTo: "team" },
      { path: "subscription", canActivate: [roleGuard("owner")], loadComponent: () => import("./features/owner/subscription/subscription.component").then((m) => m.SubscriptionComponent) },
      { path: "notifications", canActivate: [roleGuard("owner")], loadComponent: () => import("./features/owner/notifications/notifications-inbox.component").then((m) => m.NotificationsInboxComponent) },
      { path: "notifications/:id", canActivate: [roleGuard("owner")], loadComponent: () => import("./features/owner/notifications/notification-detail.component").then((m) => m.NotificationDetailComponent) },
      // Settings — persistent left rail + detail panel (Direction A).
      // Bare `/owner/settings` redirects to the first section; `:section` selects one.
      { path: "settings", canActivate: [settingsAccessGuard], loadComponent: () => import("./features/owner/settings/settings-shell.component").then((m) => m.SettingsShellComponent) },
      { path: "settings/:section", canActivate: [settingsAccessGuard], loadComponent: () => import("./features/owner/settings/settings-shell.component").then((m) => m.SettingsShellComponent) },
      // The marketplace is gone — every feature is included in the subscription.
      { path: "modules", pathMatch: "full", redirectTo: "subscription" },
      { path: "updates", canActivate: [roleGuard("owner")], loadComponent: () => import("./features/owner/updates/updates.component").then((m) => m.OwnerUpdatesComponent) },
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
      { path: "pricing", loadComponent: () => import("./features/admin/pricing/pricing.component").then((m) => m.AdminPricingComponent) }, { path: "modules", pathMatch: "full", redirectTo: "pricing" },
      { path: "support", loadComponent: () => import("./features/admin/support/support-tickets.component").then((m) => m.AdminSupportTicketsComponent) },
      { path: "updates", loadComponent: () => import("./features/admin/updates/updates.component").then((m) => m.AdminUpdatesComponent) },
      { path: "", pathMatch: "full", redirectTo: "companies" },
    ],
  },
  { path: "**", redirectTo: "auth/login" },
];
