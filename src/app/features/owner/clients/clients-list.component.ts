import { Component, OnInit, computed, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Client } from "../../../core/models/client.model";
import { ClientsService, ClientStatusFilter } from "../../../core/services/clients.service";
import { PageMeta } from "../../../core/services/sessions.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { AvatarComponent } from "../../../shared/components/avatar.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { ModalComponent } from "../../../shared/components/modal.component";
import { PaginationComponent } from "../../../shared/components/pagination.component";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { PageHeaderComponent } from "../../../shared/ui/page-header.component";
import { HighlightPipe } from "../../../shared/pipes/highlight.pipe";
import { SEARCH_DEBOUNCE_MS } from "../../../shared/utils/client-list";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { FilterRailComponent } from "../../../shared/ui/filter-rail.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";

@Component({
  selector: "app-clients-list",
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    AvatarComponent,
    EmptyStateComponent,
    ModalComponent,
    PaginationComponent,
    SpinnerComponent,
    StatusBadgeComponent,
    PageHeaderComponent,
    HighlightPipe,
    SkeletonComponent,
    ErrorStateComponent,
    FilterRailComponent,
  ],
  templateUrl: "./clients-list.component.html",
})
export class ClientsListComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly saving = signal(false);
  readonly clients = signal<Client[]>([]);
  readonly meta = signal<PageMeta | null>(null);
  readonly search = signal("");
  readonly statusFilter = signal<ClientStatusFilter | "">("");
  readonly page = signal(1);

  readonly statusOptions: { value: ClientStatusFilter | ""; labelKey: string }[] = [
    { value: "", labelKey: "clients.filter_all" },
    { value: "active", labelKey: "common.active" },
    { value: "inactive", labelKey: "common.inactive" },
    { value: "contract_active", labelKey: "clients.filter_contract_active" },
    { value: "contract_expired", labelKey: "clients.filter_contract_expired" },
    { value: "no_contract", labelKey: "clients.filter_no_contract" },
  ];

  readonly createModalOpen = signal(false);
  readonly formError = signal<string | null>(null);

  private searchDebounce?: ReturnType<typeof setTimeout>;

  readonly createForm = this.fb.nonNullable.group({
    first_name: ["", Validators.required],
    last_name: ["", Validators.required],
    phone: ["", Validators.required],
    email: [""],
    date_of_birth: [""],
    gender: [""],
    emergency_contact_name: [""],
    emergency_contact_phone: [""],
    notes: [""],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly clientsService: ClientsService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly toast: ToastService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.load();
    if (this.route.snapshot.queryParamMap.get("action") === "new") this.openCreate();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.clientsService
      .list({ search: this.search() || undefined, status: (this.statusFilter() as ClientStatusFilter) || undefined, page: this.page() })
      .subscribe({
        next: (res) => {
          this.clients.set(res.clients);
          this.meta.set(res.meta);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  hasFilters(): boolean {
    return this.search() !== "" || this.statusFilter() !== "";
  }

  readonly filterChips = computed(() => {
    const chips: { label: string; clear: () => void }[] = [];
    if (this.search()) chips.push({ label: `« ${this.search()} »`, clear: () => this.onSearchChange("") });
    const st = this.statusFilter();
    if (st) {
      const opt = this.statusOptions.find((o) => o.value === st);
      if (opt) chips.push({ label: this.translate.instant(opt.labelKey), clear: () => this.applyStatusFilter("") });
    }
    return chips;
  });

  clearFilters(): void {
    this.search.set("");
    this.statusFilter.set("");
    this.page.set(1);
    this.load();
  }

  onSearchChange(term: string): void {
    this.search.set(term);
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.page.set(1);
      this.load();
    }, SEARCH_DEBOUNCE_MS);
  }

  applyStatusFilter(status: ClientStatusFilter | ""): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.load();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.load();
  }

  openClient(client: Client): void {
    this.router.navigate(["/owner/clients", client.id]);
  }

  openCreate(): void {
    this.createForm.reset();
    this.formError.set(null);
    this.createModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.createModalOpen.set(false);
  }

  submitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    this.clientsService.create(this.createForm.getRawValue()).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.createModalOpen.set(false);
        this.toast.success(this.translate.instant("clients.created"));
        this.router.navigate(["/owner/clients", res.client.id]);
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }
}
