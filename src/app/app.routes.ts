import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { guestGuard } from "./core/guards/guest.guard";
import { noCompanyGuard, companyGuard } from "./core/guards/company.guard";
import { roleGuard } from "./core/guards/role.guard";
import { capabilityGuard, deskAreaGuard, ownerAreaGuard, settingsAccessGuard, staffRoleGuard } from "./core/guards/staff.guard";
import { memberGuard } from "./core/guards/member.guard";

/**
 * Fitora is sold to gyms. Everything before signing in is written for one:
 * the landing page, signing up, and a single sign-in.
 *
 * /member is the app a gym gives its own members — the gym's schedule, their
 * bookings, their file. It is reached only by a member whose gym enabled
 * their account: there is no directory to browse, no gym to search for and
 * no way to sign yourself up. /auth/login serves both kinds of account and
 * says which came back, which is why there is still only one door.
 */
export const routes: Routes = [
  {
    path: "",
    canActivate: [guestGuard],
    children: [
      { path: "", pathMatch: "full", loadComponent: () => import("./features/landing/landing.component").then((m) => m.LandingComponent) },
      { path: "connexion", loadComponent: () => import("./features/b2b/auth/pro-login.component").then((m) => m.ProLoginComponent) },
      { path: "inscription", loadComponent: () => import("./features/b2b/auth/register.component").then((m) => m.RegisterComponent) },
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
    // The only page a locked gym sees. Outside /owner on purpose: it has no
    // shell and no navigation, because the point is that the door is shut.
    path: "account-locked",
    canActivate: [authGuard],
    loadComponent: () => import("./features/account-locked/account-locked.component").then((m) => m.AccountLockedComponent),
  },
  { path: "trial-expired", pathMatch: "full", redirectTo: "/account-locked" },
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
      // Plans and activities are one page: a price only exists where the two
      // cross. The old routes still resolve, so a bookmark or an old link
      // lands somewhere sensible rather than on a 404.
      { path: "catalogue", canActivate: [capabilityGuard("contract_types")], loadComponent: () => import("./features/owner/catalogue/catalogue.component").then((m) => m.CatalogueComponent) },
      { path: "contracts/plans", pathMatch: "full", redirectTo: "catalogue" },
      { path: "contracts/activities", pathMatch: "full", redirectTo: "catalogue" },
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
  // The front desk. Its own shell rather than a filtered owner shell: the
  // desk's job is a different shape from running the gym, and hiding menu
  // items from a layout built for someone else is not the same as building
  // the one this job needs.
  {
    path: "desk",
    canActivate: [authGuard, deskAreaGuard, companyGuard],
    loadComponent: () => import("./layout/desk-shell/desk-shell.component").then((m) => m.DeskShellComponent),
    children: [
      { path: "dashboard", loadComponent: () => import("./features/desk/dashboard/desk-dashboard.component").then((m) => m.DeskDashboardComponent) },
      { path: "checkin", loadComponent: () => import("./features/desk/checkin/desk-checkin.component").then((m) => m.DeskCheckinComponent) },
      { path: "", pathMatch: "full", redirectTo: "dashboard" },
    ],
  },
  {
    path: "coach",
    canActivate: [authGuard, staffRoleGuard("coach")],
    loadComponent: () => import("./layout/coach-shell/coach-shell.component").then((m) => m.CoachShellComponent),
    children: [
      { path: "today", loadComponent: () => import("./features/coach/today/today.component").then((m) => m.CoachTodayComponent) },
      { path: "members", loadComponent: () => import("./features/coach/members/coach-members.component").then((m) => m.CoachMembersComponent) },
      { path: "", pathMatch: "full", redirectTo: "today" },
    ],
  },
  {
    path: "admin",
    canActivate: [authGuard, roleGuard("admin")],
    loadComponent: () => import("./layout/admin-shell/admin-shell.component").then((m) => m.AdminShellComponent),
    children: [
      { path: "overview", loadComponent: () => import("./features/admin/overview/admin-overview.component").then((m) => m.AdminOverviewComponent) },
      { path: "companies", loadComponent: () => import("./features/admin/companies/companies.component").then((m) => m.AdminCompaniesComponent) },
      { path: "companies/:id", loadComponent: () => import("./features/admin/company-detail/company-detail.component").then((m) => m.AdminCompanyDetailComponent) },
      { path: "pricing", loadComponent: () => import("./features/admin/pricing/pricing.component").then((m) => m.AdminPricingComponent) },
      { path: "modules", pathMatch: "full", redirectTo: "pricing" },
      { path: "support", loadComponent: () => import("./features/admin/support/support-tickets.component").then((m) => m.AdminSupportTicketsComponent) },
      { path: "updates", loadComponent: () => import("./features/admin/updates/updates.component").then((m) => m.AdminUpdatesComponent) },
      { path: "", pathMatch: "full", redirectTo: "overview" },
    ],
  },

  {
    path: "member",
    canActivate: [authGuard, memberGuard],
    loadComponent: () => import("./layout/member-shell/member-shell.component").then((m) => m.MemberShellComponent),
    children: [
      { path: "home", loadComponent: () => import("./features/member/schedule/member-schedule.component").then((m) => m.MemberScheduleComponent) },
      { path: "bookings", loadComponent: () => import("./features/member/bookings/member-bookings.component").then((m) => m.MemberBookingsComponent) },
      { path: "profile", loadComponent: () => import("./features/member/profile/member-profile.component").then((m) => m.MemberProfileComponent) },
      { path: "", pathMatch: "full", redirectTo: "home" },
    ],
  },

  // ---- where the earlier layouts put these -------------------------------
  { path: "pro", pathMatch: "full", redirectTo: "" },
  { path: "pro/connexion", pathMatch: "full", redirectTo: "/connexion" },
  { path: "pro/mot-de-passe-oublie", pathMatch: "full", redirectTo: "/mot-de-passe-oublie" },
  { path: "auth/login", pathMatch: "full", redirectTo: "/connexion" },
  { path: "auth/register", pathMatch: "full", redirectTo: "/inscription" },
  { path: "auth/forgot-password", pathMatch: "full", redirectTo: "/mot-de-passe-oublie" },
  // A gym is joined, never found: the directory the member sign-up fed is
  // not coming back. /inscription is the gym's own sign-up now.
  { path: "gyms", redirectTo: "" },

  { path: "**", redirectTo: "" },
];
