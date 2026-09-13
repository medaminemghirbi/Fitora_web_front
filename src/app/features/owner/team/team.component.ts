import { Component, OnInit, computed, effect, signal } from "@angular/core";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { forkJoin, of, Observable } from "rxjs";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Coach } from "../../../core/models/coach.model";
import { StaffMember } from "../../../core/models/staff-member.model";
import { CoachesService } from "../../../core/services/coaches.service";
import { StaffService } from "../../../core/services/staff.service";
import { AuthService } from "../../../core/auth/auth.service";
import { ConfigurationService } from "../../../core/configuration/configuration.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { AvatarComponent } from "../../../shared/components/avatar.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { ModalComponent } from "../../../shared/components/modal.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { PageHeaderComponent } from "../../../shared/ui/page-header.component";
import { HighlightPipe } from "../../../shared/pipes/highlight.pipe";
import { PaginationComponent } from "../../../shared/components/pagination.component";
import { clientPageMeta, filterBySearch, pageSlice } from "../../../shared/utils/client-list";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { ActionMenuComponent } from "../../../shared/ui/action-menu.component";
import { DrawerComponent } from "../../../shared/ui/drawer.component";

type Tab = "all" | "coaches" | "backoffice";
type CreateKind = "coach" | "backoffice";

// One entry per person. `coach` = a schedulable trainer (may also hold a
// mobile-app login). `staff` = a back-office (web) account.
// A coach's mobile login is itself a role:"coach" staff record on the backend,
// so those are filtered out of the back-office list — the coach entry already
// represents them.
export interface TeamMember {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  bio: string | null;
  hasMobile: boolean;
  hasWeb: boolean;
  roleName: string;
  coach: Coach | null;
  staff: StaffMember | null;
  // Set for anyone with a staff account (coach mobile login included).
  staffMemberId: string | null;
}

@Component({
  selector: "app-team",
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    AvatarComponent,
    EmptyStateComponent,
    ModalComponent,
    StatusBadgeComponent,
    PageHeaderComponent,
    HighlightPipe,
    PaginationComponent,
    SkeletonComponent,
    ErrorStateComponent,
    ActionMenuComponent,
    DrawerComponent,
  ],
  templateUrl: "./team.component.html",
  styleUrl: "./team.component.scss",
})
export class TeamComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly saving = signal(false);

  readonly coaches = signal<Coach[]>([]);
  readonly staff = signal<StaffMember[]>([]);
  readonly tab = signal<Tab>("all");

  readonly isOwner = computed(() => this.auth.currentUser()?.role === "owner");

  // The company's name for the schedulable "coach" role — "Praticien",
  // "Vétérinaire", "Formateur"… for non-fitness industries (set by the
  // industry preset), "Coach" by default.
  readonly practitionerRole = computed(() => this.config.roleName("coach"));

  readonly members = computed<TeamMember[]>(() => {
    const staffByCoach = new Map(this.staff().filter((s) => s.coach_id).map((s) => [s.coach_id!, s]));

    const fromCoaches: TeamMember[] = this.coaches().map((c) => ({
      key: "coach:" + c.id,
      name: c.full_name,
      email: c.email,
      phone: c.phone,
      active: c.active,
      bio: c.bio,
      hasMobile: c.has_login,
      hasWeb: false,
      roleName: this.practitionerRole(),
      coach: c,
      staff: null,
      staffMemberId: staffByCoach.get(c.id)?.id ?? null,
    }));

    const fromStaff: TeamMember[] = this.staff()
      .filter((s) => s.role !== "coach")
      .map((s) => ({
        key: "staff:" + s.id,
        name: s.user.full_name,
        email: s.user.email,
        phone: s.user.phone,
        active: s.active,
        bio: null,
        hasMobile: false,
        hasWeb: true,
        roleName: this.config.roleName(s.role_key),
        coach: null,
        staff: s,
        staffMemberId: s.id,
      }));

    return [...fromCoaches, ...fromStaff].sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly search = signal("");
  readonly page = signal(1);

  readonly filtered = computed<TeamMember[]>(() => {
    const t = this.tab();
    let list = this.members();
    if (t === "coaches") list = list.filter((m) => m.coach);
    else if (t === "backoffice") list = list.filter((m) => m.staff);
    return filterBySearch(list, this.search(), (m) => [m.name, m.email, m.phone]);
  });

  readonly pagedMembers = computed(() => pageSlice(this.filtered(), this.page()));
  readonly meta = computed(() => clientPageMeta(this.filtered().length, this.page()));

  readonly tabs = computed<{ id: Tab; label: string }[]>(() => {
    const base: { id: Tab; label: string }[] = [
      { id: "all", label: this.translate.instant("team.tab_all") },
      { id: "coaches", label: this.practitionerRole() },
    ];
    if (this.isOwner()) base.push({ id: "backoffice", label: this.translate.instant("team.tab_backoffice") });
    return base;
  });

  // ---- create (drawer) ----
  readonly createOpen = signal(false);
  readonly createKind = signal<CreateKind>("coach");
  readonly createError = signal<string | null>(null);

  readonly coachForm = this.fb.nonNullable.group({
    first_name: ["", Validators.required],
    last_name: ["", Validators.required],
    email: [""],
    phone: [""],
    birthdate: [""],
    bio: [""],
    with_mobile: [false],
    password: [""],
  });

  readonly backofficeForm = this.fb.nonNullable.group({
    first_name: ["", Validators.required],
    last_name: ["", Validators.required],
    email: ["", [Validators.required, Validators.email]],
    phone: [""],
    birthdate: [""],
    password: ["", [Validators.required, Validators.minLength(8)]],
    role_id: ["", Validators.required],
  });

  // ---- edit coach profile (modal) ----
  readonly editCoachOpen = signal(false);
  readonly editingCoach = signal<Coach | null>(null);
  readonly editCoachError = signal<string | null>(null);
  readonly editCoachForm = this.fb.nonNullable.group({
    first_name: ["", Validators.required],
    last_name: ["", Validators.required],
    email: [""],
    phone: [""],
    birthdate: [""],
    bio: [""],
  });

  // ---- role & web access (modal) ----
  readonly roleOpen = signal(false);
  readonly editingStaff = signal<StaffMember | null>(null);
  readonly roleError = signal<string | null>(null);
  readonly roleForm = this.fb.nonNullable.group({
    role_id: ["", Validators.required],
    active: [true],
    birthdate: [""],
  });

  // ---- mobile login (modal) ----
  readonly loginOpen = signal(false);
  readonly loginTarget = signal<Coach | null>(null);
  readonly loginError = signal<string | null>(null);
  readonly loginForm = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(8)]],
  });

  // Roles assignable to a back-office (web) login: every company role except
  // "coach" (its own creation flow) and "owner" (never assigned to staff).
  readonly backofficeRoles = computed(() =>
    this.config.roles().filter((r) => r.key !== "coach" && r.key !== "owner")
  );

  constructor(
    private readonly fb: FormBuilder,
    private readonly coachesService: CoachesService,
    private readonly staffService: StaffService,
    private readonly auth: AuthService,
    private readonly config: ConfigurationService,
    private readonly confirm: ConfirmService,
    private readonly toast: ToastService,
    private readonly translate: TranslateService,
    private readonly route: ActivatedRoute
  ) {
    // Reset to the first page whenever the filter (tab or search) changes.
    effect(() => {
      this.tab();
      this.search();
      this.page.set(1);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.load();
    const q = this.route.snapshot.queryParamMap;
    if (q.get("action") === "new") {
      this.openCreate(q.get("type") === "backoffice" && this.isOwner() ? "backoffice" : "coach");
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    forkJoin({
      coaches: this.coachesService.list(),
      staff: this.isOwner() ? this.staffService.list() : of({ staff: [] as StaffMember[] }),
    }).subscribe({
      next: (res) => {
        this.coaches.set(res.coaches.coaches);
        this.staff.set(res.staff.staff);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  // ---- create ----
  openCreate(kind: CreateKind = "coach"): void {
    this.createKind.set(this.isOwner() ? kind : "coach");
    this.createError.set(null);
    this.coachForm.reset({ with_mobile: false });
    this.backofficeForm.reset({ role_id: this.backofficeRoles()[0]?.id ?? "" });
    this.createOpen.set(true);
  }

  closeCreate(): void {
    this.createOpen.set(false);
  }

  submitCreate(): void {
    if (this.createKind() === "coach") this.submitCreateCoach();
    else this.submitCreateBackoffice();
  }

  private submitCreateCoach(): void {
    const v = this.coachForm.getRawValue();
    if (this.coachForm.controls.first_name.invalid || this.coachForm.controls.last_name.invalid) {
      this.coachForm.markAllAsTouched();
      return;
    }
    if (v.with_mobile && (!v.email || v.password.length < 8)) {
      this.createError.set(this.translate.instant("team.mobile_needs_credentials"));
      return;
    }

    this.saving.set(true);
    this.createError.set(null);
    this.coachesService
      .create({ first_name: v.first_name, last_name: v.last_name, email: v.email || undefined, phone: v.phone || undefined, birthdate: v.birthdate || null, bio: v.bio || undefined })
      .subscribe({
        next: (res) => {
          if (v.with_mobile) {
            this.coachesService.setLogin(res.coach.id, v.email, v.password).subscribe({
              next: () => this.afterCreate(),
              error: (err) => this.createFailed(err),
            });
          } else {
            this.afterCreate();
          }
        },
        error: (err) => this.createFailed(err),
      });
  }

  private submitCreateBackoffice(): void {
    if (this.backofficeForm.invalid) {
      this.backofficeForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.createError.set(null);
    const v = this.backofficeForm.getRawValue();
    this.staffService
      .create({ first_name: v.first_name, last_name: v.last_name, email: v.email, phone: v.phone || undefined, password: v.password, role_id: v.role_id, birthdate: v.birthdate || null })
      .subscribe({
        next: () => this.afterCreate(),
        error: (err) => this.createFailed(err),
      });
  }

  private afterCreate(): void {
    this.saving.set(false);
    this.createOpen.set(false);
    this.toast.success(this.translate.instant("common.save"));
    this.load();
  }

  private createFailed(err: unknown): void {
    this.saving.set(false);
    this.createError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
  }

  // ---- edit coach profile ----
  openEditCoach(coach: Coach): void {
    this.editingCoach.set(coach);
    this.editCoachForm.setValue({
      first_name: coach.first_name,
      last_name: coach.last_name,
      email: coach.email || "",
      phone: coach.phone || "",
      birthdate: coach.birthdate || "",
      bio: coach.bio || "",
    });
    this.editCoachError.set(null);
    this.editCoachOpen.set(true);
  }

  submitEditCoach(): void {
    const coach = this.editingCoach();
    if (!coach || this.editCoachForm.invalid) {
      this.editCoachForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.editCoachError.set(null);
    this.coachesService.update(coach.id, this.editCoachForm.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.editCoachOpen.set(false);
        this.toast.success(this.translate.instant("common.save"));
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.editCoachError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  // ---- role & web access ----
  openRole(staff: StaffMember): void {
    this.editingStaff.set(staff);
    this.roleForm.setValue({
      role_id: this.backofficeRoles().find((r) => r.key === staff.role_key)?.id ?? "",
      active: staff.active,
      birthdate: staff.birthdate || "",
    });
    this.roleError.set(null);
    this.roleOpen.set(true);
  }

  submitRole(): void {
    const staff = this.editingStaff();
    if (!staff || this.roleForm.invalid) return;
    this.saving.set(true);
    this.roleError.set(null);
    this.staffService.update(staff.id, this.roleForm.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.roleOpen.set(false);
        this.toast.success(this.translate.instant("common.save"));
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.roleError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  // ---- mobile login ----
  openLogin(coach: Coach): void {
    this.loginTarget.set(coach);
    this.loginForm.setValue({ email: coach.login_email || coach.email || "", password: "" });
    this.loginError.set(null);
    this.loginOpen.set(true);
  }

  submitLogin(): void {
    const coach = this.loginTarget();
    if (!coach || this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.loginError.set(null);
    const { email, password } = this.loginForm.getRawValue();
    this.coachesService.setLogin(coach.id, email, password).subscribe({
      next: () => {
        this.saving.set(false);
        this.loginOpen.set(false);
        this.toast.success(this.translate.instant("coaches.login_set"));
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.loginError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  // ---- deactivate ----
  async deactivate(member: TeamMember): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.translate.instant("team.deactivate_confirm_title"),
      body: this.translate.instant("team.deactivate_confirm_body"),
      confirmLabel: this.translate.instant("common.deactivate"),
      danger: true,
    });
    if (!ok) return;

    const req: Observable<unknown> = member.coach
      ? this.coachesService.deactivate(member.coach.id)
      : this.staffService.update(member.staff!.id, { active: false });

    req.subscribe({
      next: () => {
        this.toast.success(this.translate.instant("common.deactivate"));
        this.load();
      },
      error: (err: unknown) => this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic"))),
    });
  }
}
