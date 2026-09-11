import { Component, OnInit, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AdminCompany } from "../../../core/models/admin-company.model";
import { AdminCompaniesService } from "../../../core/services/admin-companies.service";
import { PageMeta } from "../../../core/services/sessions.service";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { PaginationComponent } from "../../../shared/components/pagination.component";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { PageHeaderComponent } from "../../../shared/ui/page-header.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { HighlightPipe } from "../../../shared/pipes/highlight.pipe";
import { MoneyPipe } from "../../../shared/pipes/money.pipe";
import { SEARCH_DEBOUNCE_MS } from "../../../shared/utils/client-list";

@Component({
  selector: "app-admin-companies",
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    TranslateModule,
    EmptyStateComponent,
    PaginationComponent,
    SpinnerComponent,
    StatusBadgeComponent,
    PageHeaderComponent,
    ErrorStateComponent,
    HighlightPipe,
    MoneyPipe,
  ],
  templateUrl: "./companies.component.html",
  styleUrl: "./companies.component.scss",
})
export class AdminCompaniesComponent implements OnInit {
  private readonly companiesService = inject(AdminCompaniesService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly companies = signal<AdminCompany[]>([]);
  readonly meta = signal<PageMeta | null>(null);
  readonly page = signal(1);
  readonly search = signal("");
  private searchDebounce?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.companiesService.list(this.page(), this.search() || undefined).subscribe({
      next: (res) => {
        this.companies.set(res.companies);
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
      this.load();
    }, SEARCH_DEBOUNCE_MS);
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.load();
  }
}
