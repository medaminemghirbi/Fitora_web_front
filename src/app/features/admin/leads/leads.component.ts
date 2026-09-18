import { Component, computed, inject, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AdminLeadsService, Lead, LeadConversion, LeadStatus } from "../../../core/services/leads.service";
import { AdminCompaniesService } from "../../../core/services/admin-companies.service";
import { AdminCompany } from "../../../core/models/admin-company.model";
import { ToastService } from "../../../core/services/toast.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { ModalComponent } from "../../../shared/components/modal.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { PageHeaderComponent } from "../../../shared/ui/page-header.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";

/**
 * Fitora's inbox: everyone waiting on an answer, in one place.
 *
 * Two queues, because a gym asks twice. First to get in — a demo or a
 * quote, converted here into an account and its 14 days. Then, once the 14
 * days run out, to carry on: that request used to surface only on the
 * company's own page, where it was found by whoever happened to open it.
 *
 * Activations lead, because that is the one with money behind it and a gym
 * already using the product at the other end.
 */
@Component({
  selector: "app-admin-leads",
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    FormsModule,
    TranslateModule,
    EmptyStateComponent,
    ModalComponent,
    StatusBadgeComponent,
    PageHeaderComponent,
    SkeletonComponent,
    ErrorStateComponent,
  ],
  templateUrl: "./leads.component.html",
  styleUrl: "./leads.component.scss",
})
export class AdminLeadsComponent {
  private readonly service = inject(AdminLeadsService);
  private readonly companies = inject(AdminCompaniesService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly translate = inject(TranslateService);

  /** Which queue is on screen. Activations first — see the class comment. */
  readonly queue = signal<"activations" | "leads">("activations");

  readonly activations = signal<AdminCompany[]>([]);
  readonly activationsLoading = signal(true);
  readonly activationsError = signal(false);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly leads = signal<Lead[]>([]);
  readonly counts = signal<Record<string, number>>({});
  readonly statusFilter = signal<LeadStatus | "">("");
  readonly busy = signal<string | null>(null);

  /** The one screen this is shown on, and the only time it is shown at all. */
  readonly conversion = signal<LeadConversion | null>(null);
  readonly openLead = signal<Lead | null>(null);
  readonly notes = signal("");

  readonly statusOptions: { value: LeadStatus | ""; labelKey: string; countKey: string }[] = [
    { value: "", labelKey: "clients.filter_all", countKey: "all" },
    { value: "new_request", labelKey: "admin.leads.status_new_request", countKey: "new_request" },
    { value: "contacted", labelKey: "admin.leads.status_contacted", countKey: "contacted" },
    { value: "converted", labelKey: "admin.leads.status_converted", countKey: "converted" },
    { value: "dropped", labelKey: "admin.leads.status_dropped", countKey: "dropped" },
  ];

  /** How many requests nobody has dealt with — the number that matters. */
  readonly pendingCount = computed(
    () => (this.counts()["new_request"] ?? 0) + (this.counts()["contacted"] ?? 0)
  );

  constructor() {
    this.loadActivations();
    this.load();
  }

  showQueue(queue: "activations" | "leads"): void {
    this.queue.set(queue);
  }

  loadActivations(): void {
    this.activationsLoading.set(true);
    this.activationsError.set(false);
    this.companies.activationRequests().subscribe({
      next: (res) => {
        this.activations.set(res.companies);
        this.activationsLoading.set(false);
      },
      error: () => {
        this.activationsError.set(true);
        this.activationsLoading.set(false);
      },
    });
  }

  /** How long a gym has been waiting, in whole days. */
  waitingDays(company: AdminCompany): number {
    const asked = company.subscription?.upgrade_requested_at;
    if (!asked) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(asked).getTime()) / 86_400_000));
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.service.list(this.statusFilter()).subscribe({
      next: (res) => {
        this.leads.set(res.leads);
        this.counts.set(res.counts ?? {});
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  filterBy(status: LeadStatus | ""): void {
    if (this.statusFilter() === status) return;
    this.statusFilter.set(status);
    this.load();
  }

  open(lead: Lead): void {
    this.openLead.set(lead);
    this.notes.set(lead.internal_notes ?? "");
  }

  close(): void {
    this.openLead.set(null);
  }

  /** Moving it along the funnel, and keeping a note of what was said. */
  save(status?: LeadStatus): void {
    const lead = this.openLead();
    if (!lead || this.busy()) return;

    this.busy.set(lead.id);
    this.service.update(lead.id, { status: status ?? lead.status, internal_notes: this.notes() }).subscribe({
      next: () => {
        this.busy.set(null);
        this.close();
        this.toast.success(this.translate.instant("common.saved"));
        this.load();
      },
      error: (err) => {
        this.busy.set(null);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  async convert(lead: Lead): Promise<void> {
    if (this.busy()) return;

    const confirmed = await this.confirm.ask({
      title: this.translate.instant("admin.leads.convert_confirm_title"),
      body: this.translate.instant("admin.leads.convert_confirm_body", { gym: lead.gym_name, email: lead.email }),
    });
    if (!confirmed) return;

    this.busy.set(lead.id);
    this.service.convert(lead.id).subscribe({
      next: (res) => {
        this.busy.set(null);
        this.close();
        // Held on screen until dismissed: the password is not recoverable.
        this.conversion.set(res);
        this.load();
      },
      error: (err) => {
        this.busy.set(null);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  dismissConversion(): void {
    this.conversion.set(null);
  }

  copyCredentials(): void {
    const res = this.conversion();
    if (!res) return;

    const text = this.translate.instant("admin.leads.credentials_clipboard", {
      gym: res.company.name,
      email: res.owner.email,
      password: res.temporary_password,
    });
    navigator.clipboard
      ?.writeText(text)
      .then(() => this.toast.success(this.translate.instant("admin.leads.copied")))
      .catch(() => this.toast.error(this.translate.instant("common.error_generic")));
  }
}
