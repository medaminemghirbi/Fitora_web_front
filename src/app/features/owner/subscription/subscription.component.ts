import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { SubscriptionInfo, SubscriptionService } from "../../../core/services/subscription.service";
import { BillingPeriod } from "../../../core/models/subscription.model";
import { moduleIcon } from "../../../core/configuration/module-icons";
import { SupportTicket } from "../../../core/models/support-ticket.model";
import { SupportTicketsService } from "../../../core/services/support-tickets.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { PageHeaderComponent } from "../../../shared/ui/page-header.component";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { MoneyPipe } from "../../../shared/pipes/money.pipe";

type Tab = "subscription" | "contact";

// The 9 included features, grouped for the "everything included" section.
// Keys match ModuleCatalog::KEYS / module-icons.ts; labels + descriptions
// are i18n'd as modules.<key>.name / .desc.
const FEATURE_GROUPS: { label: string; keys: string[] }[] = [
  { label: "subscription.group_members", keys: ["clients", "classes", "bookings"] },
  { label: "subscription.group_billing", keys: ["memberships", "billing"] },
  { label: "subscription.group_hr", keys: ["hr", "payroll"] },
  { label: "subscription.group_docs", keys: ["ged", "suppliers"] },
];

const MAX_FILES = 5;
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "video/mp4", "video/quicktime", "video/webm"];

@Component({
  selector: "app-subscription",
  standalone: true,
  imports: [FormsModule, DatePipe, TranslateModule, PageHeaderComponent, SpinnerComponent, SkeletonComponent, ErrorStateComponent, MoneyPipe],
  templateUrl: "./subscription.component.html",
  styleUrl: "./subscription.component.scss",
})
export class SubscriptionComponent implements OnInit {
  private readonly service = inject(SubscriptionService);
  private readonly ticketsService = inject(SupportTicketsService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly tab = signal<Tab>("subscription");
  readonly info = signal<SubscriptionInfo | null>(null);

  readonly featureGroups = FEATURE_GROUPS;
  readonly preferredPeriod = signal<BillingPeriod>("monthly");
  readonly requesting = signal(false);

  readonly sub = computed(() => this.info()?.subscription ?? null);
  readonly onTrial = computed(() => this.info()?.on_trial ?? true);
  readonly upgradeRequested = computed(() => !!this.sub()?.upgrade_requested_at);
  readonly billingPeriod = computed<BillingPeriod | null>(() => this.sub()?.billing_period ?? null);

  // ---- Contact tab: support tickets ----
  readonly tickets = signal<SupportTicket[]>([]);
  readonly loadingTickets = signal(false);
  private ticketsLoaded = false;
  readonly ticketSubject = signal("");
  readonly ticketMessage = signal("");
  readonly ticketFiles = signal<File[]>([]);
  readonly ticketFileError = signal<string | null>(null);
  readonly submittingTicket = signal(false);

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get("tab") === "contact") this.setTab("contact");
    this.load();
  }

  iconFor(key: string): string {
    return moduleIcon(key);
  }

  featureName(key: string): string {
    return `modules.${key}.name`;
  }

  featureDesc(key: string): string {
    return `modules.${key}.desc`;
  }

  setTab(tab: Tab): void {
    this.tab.set(tab);
    if (tab === "contact" && !this.ticketsLoaded) this.loadTickets();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.service.get().subscribe({
      next: (res) => {
        this.info.set(res);
        if (res.subscription?.upgrade_requested_period) this.preferredPeriod.set(res.subscription.upgrade_requested_period);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  requestUpgrade(): void {
    this.requesting.set(true);
    this.service.requestUpgrade(this.preferredPeriod()).subscribe({
      next: (res) => {
        this.requesting.set(false);
        this.info.set(res);
        this.toast.success(this.translate.instant("subscription.request_sent_toast"));
      },
      error: (err) => {
        this.requesting.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  cancelRequest(): void {
    this.requesting.set(true);
    this.service.cancelUpgradeRequest().subscribe({
      next: (res) => {
        this.requesting.set(false);
        this.info.set(res);
      },
      error: (err) => {
        this.requesting.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  loadTickets(): void {
    this.loadingTickets.set(true);
    this.ticketsService.list().subscribe({
      next: (res) => {
        this.tickets.set(res.support_tickets);
        this.ticketsLoaded = true;
        this.loadingTickets.set(false);
      },
      error: () => this.loadingTickets.set(false),
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const picked = Array.from(input.files ?? []);
    input.value = "";

    const combined = [...this.ticketFiles(), ...picked];
    if (combined.length > MAX_FILES) {
      this.ticketFileError.set(this.translate.instant("modules_page.contact.too_many_files", { max: MAX_FILES }));
      return;
    }
    const invalid = picked.find((f) => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_FILE_SIZE);
    if (invalid) {
      this.ticketFileError.set(this.translate.instant("modules_page.contact.invalid_file", { name: invalid.name }));
      return;
    }

    this.ticketFileError.set(null);
    this.ticketFiles.set(combined);
  }

  removeFile(index: number): void {
    this.ticketFiles.update((files) => files.filter((_, i) => i !== index));
    this.ticketFileError.set(null);
  }

  submitTicket(): void {
    const subject = this.ticketSubject().trim();
    const message = this.ticketMessage().trim();
    if (!subject || !message) return;

    this.submittingTicket.set(true);
    this.ticketsService.create(subject, message, this.ticketFiles()).subscribe({
      next: (res) => {
        this.submittingTicket.set(false);
        this.tickets.update((list) => [res.support_ticket, ...list]);
        this.ticketSubject.set("");
        this.ticketMessage.set("");
        this.ticketFiles.set([]);
        this.toast.success(this.translate.instant("modules_page.contact.sent"));
      },
      error: (err) => {
        this.submittingTicket.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }
}
