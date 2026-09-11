import { Component, OnInit, computed, signal } from "@angular/core";
import { DatePipe, DecimalPipe } from "@angular/common";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Activity } from "../../../core/models/activity.model";
import { Booking } from "../../../core/models/booking.model";
import { ClientDetail } from "../../../core/models/client.model";
import { Contract } from "../../../core/models/contract.model";
import { Payment } from "../../../core/models/payment.model";
import { ContractType } from "../../../core/models/contract-type.model";
import { Session } from "../../../core/models/session.model";
import { ActivitiesService } from "../../../core/services/activities.service";
import { AttendanceService } from "../../../core/services/attendance.service";
import { BookingsService } from "../../../core/services/bookings.service";
import { ClientsService, ClientPayload } from "../../../core/services/clients.service";
import { downloadBlob } from "../../../core/services/download.util";
import { ContractTypesService } from "../../../core/services/contract-types.service";
import { ContractsService } from "../../../core/services/contracts.service";
import { PaymentsService } from "../../../core/services/payments.service";
import { SessionsService } from "../../../core/services/sessions.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { AvatarComponent } from "../../../shared/components/avatar.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { ModalComponent } from "../../../shared/components/modal.component";
import { MoneyPipe } from "../../../shared/pipes/money.pipe";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { KpiCardComponent } from "../../../shared/ui/kpi-card.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { ActionMenuComponent } from "../../../shared/ui/action-menu.component";

type Tab = "overview" | "contracts" | "bookings" | "attendance" | "payments" | "notes";

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

@Component({
  selector: "app-client-profile",
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    DecimalPipe,
    RouterLink,
    TranslateModule,
    AvatarComponent,
    EmptyStateComponent,
    ModalComponent,
    MoneyPipe,
    SpinnerComponent,
    StatusBadgeComponent,
    KpiCardComponent,
    SkeletonComponent,
    ErrorStateComponent,
    ActionMenuComponent,
  ],
  templateUrl: "./client-profile.component.html",
  styleUrl: "./client-profile.component.scss",
})
export class ClientProfileComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly saving = signal(false);
  readonly client = signal<ClientDetail | null>(null);
  readonly contracts = signal<Contract[]>([]);
  readonly bookings = signal<Booking[]>([]);
  readonly payments = signal<Payment[]>([]);
  readonly activeTab = signal<Tab>("overview");
  readonly contractProgress = signal<{ percent: number; tone: "success" | "warning" | "danger" } | null>(null);
  readonly tabs: Tab[] = ["overview", "contracts", "bookings", "attendance", "payments", "notes"];

  readonly contractTypes = signal<ContractType[]>([]);
  readonly activities = signal<Activity[]>([]);
  readonly availableSessions = signal<Session[]>([]);

  // One display row per abonnement — progress captured once (computed only
  // re-runs when contracts() changes, so no ECAIHBC from Date.now()).
  readonly aboRows = computed(() => {
    const now = Date.now();
    return this.contracts().map((c) => {
      const start = new Date(c.starts_at ?? 0).getTime();
      const end = new Date(c.expires_at ?? 0).getTime();
      const span = end - start;
      const percent = span > 0 ? Math.min(100, Math.max(0, ((now - start) / span) * 100)) : 100;
      const daysLeft = Math.max(0, Math.ceil((end - now) / 86_400_000));
      const remaining = c.remaining_bookings;
      const sessionCount = c.plan.session_count;
      return { contract: c, percent, daysLeft, remaining, sessionCount };
    });
  });

  readonly contractModalOpen = signal(false);
  readonly editModalOpen = signal(false);
  readonly editingContract = signal<Contract | null>(null);
  readonly bookingModalOpen = signal(false);
  readonly paymentModalOpen = signal(false);
  readonly notesSaving = signal(false);
  readonly formError = signal<string | null>(null);

  // Fitora only takes cash payments in the gym — there is no method selector.
  // No part payments: "Encaisser maintenant" records the full price.
  readonly contractForm = this.fb.nonNullable.group({
    contract_type_id: [null as string | null, Validators.required],
    starts_on: [toDateInputValue(new Date()), Validators.required],
    discount: [0],
    collect_payment: [false],
  });

  readonly editForm = this.fb.nonNullable.group({
    starts_on: ["", Validators.required],
    expires_on: ["", Validators.required],
    discount: [0],
  });

  readonly bookingForm = this.fb.nonNullable.group({
    activity_id: [null as string | null, Validators.required],
    date: [toDateInputValue(new Date()), Validators.required],
    session_id: [null as string | null, Validators.required],
  });

  readonly paymentPayableOptions = signal<{ kind: "contract" | "booking"; id: string; label: string; amountDue: number }[]>([]);
  readonly paymentForm = this.fb.nonNullable.group({
    payable_key: ["", Validators.required],
    notes: [""],
  });

  readonly notesForm = this.fb.nonNullable.group({ notes: [""] });

  readonly loginModalOpen = signal(false);
  readonly loginSaving = signal(false);
  readonly loginFormError = signal<string | null>(null);
  readonly loginForm = this.fb.nonNullable.group({ password: ["", [Validators.required, Validators.minLength(8)]] });

  private clientId!: string;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly clientsService: ClientsService,
    private readonly contractTypesService: ContractTypesService,
    private readonly contractsService: ContractsService,
    private readonly activitiesService: ActivitiesService,
    private readonly sessionsService: SessionsService,
    private readonly bookingsService: BookingsService,
    private readonly paymentsService: PaymentsService,
    private readonly attendanceService: AttendanceService,
    private readonly confirm: ConfirmService,
    private readonly toast: ToastService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get("id")!;
    this.contractTypesService.list().subscribe((res) => this.contractTypes.set(res.plans));
    this.activitiesService.list().subscribe((res) => this.activities.set(res.activities));
    this.load();

    this.bookingForm.controls.activity_id.valueChanges.subscribe(() => this.onBookingFiltersChange());
    this.bookingForm.controls.date.valueChanges.subscribe(() => this.onBookingFiltersChange());
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.clientsService.get(this.clientId).subscribe({
      next: (res) => {
        this.client.set(res.client);
        this.contracts.set(res.contracts);
        this.bookings.set(res.bookings);
        this.payments.set(res.payments);
        this.notesForm.setValue({ notes: res.client.notes || "" });
        this.contractProgress.set(res.client.current_contract ? this.computeContractProgress(res.client.current_contract) : null);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  bookingsWithAttendance(): Booking[] {
    return this.bookings().filter((b) => b.status === "confirmed" || b.status === "completed" || b.status === "no_show");
  }

  balanceTone(balance: number): "success" | "danger" {
    return balance > 0 ? "danger" : "success";
  }

  // Renewal urgency shown as a progress bar on the overview tab, so an owner
  // glancing at a client's profile can spot an expiring contract without
  // opening the Contrats tab. Computed once per load() (not in the template)
  // since it's Date.now()-based and would otherwise drift between change
  // detection passes and trip ExpressionChangedAfterItHasBeenCheckedError.
  private computeContractProgress(contract: { starts_at: string | null; expires_at: string | null }): { percent: number; tone: "success" | "warning" | "danger" } {
    const start = new Date(contract.starts_at ?? 0).getTime();
    const end = new Date(contract.expires_at ?? 0).getTime();
    const total = end - start;
    const percent = total > 0 ? Math.min(100, Math.max(0, ((Date.now() - start) / total) * 100)) : 100;
    const remaining = 100 - percent;
    const tone = remaining < 10 ? "danger" : remaining < 30 ? "warning" : "success";
    return { percent, tone };
  }

  // === Abonnements ===
  selectedPlan(): ContractType | null {
    const id = this.contractForm.controls.contract_type_id.value;
    return this.contractTypes().find((p) => p.id === id) ?? null;
  }

  // Price after the discount typed in the create form, clamped at 0.
  contractFormTotal(): number {
    const plan = this.selectedPlan();
    if (!plan) return 0;
    return Math.max(0, Number(plan.price) - (this.contractForm.controls.discount.value || 0));
  }

  openContractModal(): void {
    this.contractForm.reset({ starts_on: toDateInputValue(new Date()), discount: 0, collect_payment: false });
    this.formError.set(null);
    this.contractModalOpen.set(true);
  }

  closeContractModal(): void {
    this.contractModalOpen.set(false);
  }

  submitContract(): void {
    if (this.contractForm.invalid) {
      this.contractForm.markAllAsTouched();
      return;
    }

    const { contract_type_id, starts_on, discount, collect_payment } = this.contractForm.getRawValue();
    this.saving.set(true);
    this.formError.set(null);

    this.contractsService
      .create({
        client_id: this.clientId,
        contract_type_id: contract_type_id!,
        starts_on,
        discount: discount || 0,
        collect_payment: collect_payment || undefined,
        payment_method: collect_payment ? "cash" : undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.contractModalOpen.set(false);
          this.toast.success(this.translate.instant("common.save"));
          this.load();
        },
        error: (err) => {
          this.saving.set(false);
          this.formError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
        },
      });
  }

  openEditModal(contract: Contract): void {
    this.editingContract.set(contract);
    this.editForm.reset({
      starts_on: (contract.starts_at ?? "").slice(0, 10),
      expires_on: (contract.expires_at ?? "").slice(0, 10),
      discount: parseFloat(contract.discount) || 0,
    });
    if (contract.payment_status === "paid") this.editForm.controls.discount.disable();
    else this.editForm.controls.discount.enable();
    this.formError.set(null);
    this.editModalOpen.set(true);
  }

  closeEditModal(): void {
    this.editModalOpen.set(false);
    this.editingContract.set(null);
  }

  submitEdit(): void {
    const contract = this.editingContract();
    if (!contract || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const { starts_on, expires_on, discount } = this.editForm.getRawValue();
    this.saving.set(true);
    this.formError.set(null);

    this.contractsService
      .update(contract.id, {
        starts_on,
        expires_on,
        discount: this.editForm.controls.discount.disabled ? undefined : discount || 0,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.closeEditModal();
          this.toast.success(this.translate.instant("common.save"));
          this.load();
        },
        error: (err) => {
          this.saving.set(false);
          this.formError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
        },
      });
  }

  async collectPayment(contract: Contract): Promise<void> {
    if (!contract.current_period_id) return;
    const confirmed = await this.confirm.ask({
      title: this.translate.instant("clients.collect_confirm_title"),
      body: this.translate.instant("clients.collect_confirm_body", { amount: contract.amount_due }),
    });
    if (!confirmed) return;

    this.paymentsService
      .record({ client_id: this.clientId, payment_method: "cash", contract_period_id: contract.current_period_id })
      .subscribe({
        next: () => {
          this.toast.success(this.translate.instant("common.save"));
          this.load();
        },
        error: (err) => this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic"))),
      });
  }

  downloadReceipt(contract: Contract): void {
    this.contractsService.receipt(contract.id).subscribe({
      next: (blob) => downloadBlob(blob, `recu-${contract.id}.pdf`),
      error: () => this.toast.error(this.translate.instant("common.error_generic")),
    });
  }

  async renewContract(contract: Contract): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.translate.instant("contracts.renew_confirm_title"),
      body: this.translate.instant("contracts.renew_confirm_body"),
    });
    if (!confirmed) return;

    this.contractsService.renew(contract.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant("common.save"));
        this.load();
      },
      error: (err) => this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic"))),
    });
  }

  async cancelContract(contract: Contract): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.translate.instant("contracts.cancel_confirm_title"),
      body: this.translate.instant("contracts.cancel_confirm_body"),
      danger: true,
    });
    if (!confirmed) return;

    this.contractsService.cancel(contract.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant("common.confirm"));
        this.load();
      },
      error: (err) => this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic"))),
    });
  }

  async deleteContract(contract: Contract): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.translate.instant("contracts.delete_confirm_title"),
      body: this.translate.instant("contracts.delete_confirm_body"),
      danger: true,
    });
    if (!confirmed) return;

    this.contractsService.destroy(contract.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant("common.confirm"));
        this.load();
      },
      error: (err) => this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic"))),
    });
  }

  // === Booking ===
  openBookingModal(): void {
    this.bookingForm.reset({ date: toDateInputValue(new Date()) });
    this.availableSessions.set([]);
    this.formError.set(null);
    this.bookingModalOpen.set(true);
  }

  closeBookingModal(): void {
    this.bookingModalOpen.set(false);
  }

  onBookingFiltersChange(): void {
    const { activity_id, date } = this.bookingForm.getRawValue();
    this.bookingForm.patchValue({ session_id: null }, { emitEvent: false });
    if (!activity_id || !date) {
      this.availableSessions.set([]);
      return;
    }
    this.sessionsService.list({ activity_id, date, status: "scheduled" }).subscribe((res) => this.availableSessions.set(res.sessions));
  }

  submitBooking(): void {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    this.bookingsService.create(this.clientId, this.bookingForm.getRawValue().session_id!).subscribe({
      next: () => {
        this.saving.set(false);
        this.bookingModalOpen.set(false);
        this.toast.success(this.translate.instant("common.save"));
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  async cancelBooking(booking: Booking): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.translate.instant("bookings.cancel_confirm_title"),
      body: this.translate.instant("bookings.cancel_confirm_body"),
      danger: true,
    });
    if (!confirmed) return;

    this.bookingsService.cancel(booking.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant("common.confirm"));
        this.load();
      },
      error: (err) => this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic"))),
    });
  }

  // === Payment (bookings & one-offs — abonnements are settled from their card) ===
  openPaymentModal(): void {
    this.paymentForm.reset();
    const options = this.bookings()
      .filter((b) => b.payment_status !== "paid" && b.amount > 0)
      .map((b) => ({ kind: "booking" as const, id: b.id, label: `${this.translate.instant("bookings.title")} — ${b.session.activity_name}`, amountDue: b.amount }));
    this.paymentPayableOptions.set(options);
    this.formError.set(null);
    this.paymentModalOpen.set(true);
  }

  closePaymentModal(): void {
    this.paymentModalOpen.set(false);
  }

  submitPayment(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const { payable_key, notes } = this.paymentForm.getRawValue();
    const [kind, id] = payable_key.split(":");

    this.saving.set(true);
    this.formError.set(null);

    this.paymentsService
      .record({
        client_id: this.clientId,
        payment_method: "cash",
        notes: notes || undefined,
        contract_period_id: kind === "contract" ? id : undefined,
        booking_id: kind === "booking" ? id : undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.paymentModalOpen.set(false);
          this.toast.success(this.translate.instant("common.save"));
          this.load();
        },
        error: (err) => {
          this.saving.set(false);
          this.formError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
        },
      });
  }

  // === Check-in ===
  checkIn(): void {
    const today = toDateInputValue(new Date());
    const todaysBooking = this.bookings().find((b) => b.status === "confirmed" && b.session.starts_at.slice(0, 10) === today);

    if (!todaysBooking) {
      this.toast.info(this.translate.instant("clients.no_session_today"));
      return;
    }

    this.attendanceService.mark(todaysBooking.id, "present").subscribe({
      next: () => {
        this.toast.success(this.translate.instant("coach.attendance_present"));
        this.load();
      },
      error: (err) => this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic"))),
    });
  }

  // === Notes ===
  saveNotes(): void {
    this.notesSaving.set(true);
    const payload: ClientPayload = { notes: this.notesForm.getRawValue().notes };

    this.clientsService.update(this.clientId, payload).subscribe({
      next: () => {
        this.notesSaving.set(false);
        this.toast.success(this.translate.instant("common.save"));
      },
      error: (err) => {
        this.notesSaving.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  // === Mobile login ===
  openLoginModal(): void {
    this.loginForm.reset();
    this.loginFormError.set(null);
    this.loginModalOpen.set(true);
  }

  closeLoginModal(): void {
    this.loginModalOpen.set(false);
  }

  submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loginSaving.set(true);
    this.loginFormError.set(null);

    this.clientsService.setLogin(this.clientId, this.loginForm.getRawValue().password).subscribe({
      next: () => {
        this.loginSaving.set(false);
        this.loginModalOpen.set(false);
        this.toast.success(this.translate.instant("clients.login_set"));
        this.load();
      },
      error: (err) => {
        this.loginSaving.set(false);
        this.loginFormError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }
}
