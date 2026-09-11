import { Component, OnInit, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { Contract, ContractStatus } from "../../../core/models/contract.model";
import { ContractType } from "../../../core/models/contract-type.model";
import { ContractTypesService } from "../../../core/services/contract-types.service";
import { ContractsService } from "../../../core/services/contracts.service";
import { PageMeta } from "../../../core/services/sessions.service";
import { AvatarComponent } from "../../../shared/components/avatar.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { PaginationComponent } from "../../../shared/components/pagination.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { PageHeaderComponent } from "../../../shared/ui/page-header.component";
import { HighlightPipe } from "../../../shared/pipes/highlight.pipe";
import { SEARCH_DEBOUNCE_MS } from "../../../shared/utils/client-list";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { ActionMenuComponent } from "../../../shared/ui/action-menu.component";

@Component({
  selector: "app-contracts",
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    RouterLink,
    TranslateModule,
    AvatarComponent,
    EmptyStateComponent,
    PaginationComponent,
    StatusBadgeComponent,
    PageHeaderComponent,
    HighlightPipe,
    SkeletonComponent,
    ErrorStateComponent,
    ActionMenuComponent,
  ],
  templateUrl: "./contracts.component.html",
})
export class ContractsComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly contracts = signal<Contract[]>([]);
  readonly meta = signal<PageMeta | null>(null);
  readonly page = signal(1);
  readonly contractStatusFilter = signal<ContractStatus | "">("");
  readonly contractTypeFilter = signal<string | "">("");
  readonly search = signal("");
  private searchDebounce?: ReturnType<typeof setTimeout>;

  // Only needed to populate the "Contrat" filter dropdown — managing types
  // themselves now lives at Settings > Types de contrat.
  readonly plans = signal<ContractType[]>([]);

  readonly statusOptions: { value: ContractStatus | ""; labelKey: string }[] = [
    { value: "", labelKey: "clients.filter_all" },
    { value: "active", labelKey: "contract.status_active" },
    { value: "expired", labelKey: "contract.status_expired" },
    { value: "cancelled", labelKey: "contract.status_cancelled" },
  ];

  constructor(
    private readonly contractsService: ContractsService,
    private readonly contractTypesService: ContractTypesService
  ) {}

  ngOnInit(): void {
    this.loadContracts();
    this.contractTypesService.list().subscribe((res) => this.plans.set(res.plans));
  }

  loadContracts(): void {
    this.loading.set(true);
    this.error.set(false);
    this.contractsService
      .list({
        status: this.contractStatusFilter() || undefined,
        contract_type_id: this.contractTypeFilter() || undefined,
        q: this.search() || undefined,
        page: this.page(),
      })
      .subscribe({
        next: (res) => {
          this.contracts.set(res.contracts);
          this.meta.set(res.meta);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  onSearchChange(term: string): void {
    this.search.set(term);
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.page.set(1);
      this.loadContracts();
    }, SEARCH_DEBOUNCE_MS);
  }

  applyContractFilter(status: ContractStatus | ""): void {
    this.contractStatusFilter.set(status);
    this.page.set(1);
    this.loadContracts();
  }

  applyContractTypeFilter(contractTypeId: string | ""): void {
    this.contractTypeFilter.set(contractTypeId);
    this.page.set(1);
    this.loadContracts();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.loadContracts();
  }

  resetFilters(): void {
    this.contractStatusFilter.set("");
    this.contractTypeFilter.set("");
    this.search.set("");
    this.page.set(1);
    this.loadContracts();
  }

  hasFilters(): boolean {
    return this.contractStatusFilter() !== "" || this.contractTypeFilter() !== "" || this.search() !== "";
  }
}
