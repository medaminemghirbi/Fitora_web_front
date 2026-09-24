import { Component, OnInit, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { SuperadminCompany } from "../../../core/models/superadmin-company.model";
import { SuperadminCompaniesService } from "../../../core/services/superadmin-companies.service";
import { PageMeta } from "../../../core/services/sessions.service";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { PaginationComponent } from "../../../shared/components/pagination.component";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { HighlightPipe } from "../../../shared/pipes/highlight.pipe";
import { MoneyPipe } from "../../../shared/pipes/money.pipe";
import { SEARCH_DEBOUNCE_MS } from "../../../shared/utils/client-list";

@Component({
  selector: "app-superadmin-companies",
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    TranslateModule,
    EmptyStateComponent,
    PaginationComponent,
    SpinnerComponent,
    StatusBadgeComponent,
    ErrorStateComponent,
    HighlightPipe,
    MoneyPipe,
  ],
  templateUrl: "./companies.component.html",
  styleUrl: "./companies.component.scss",
})
export class SuperadminCompaniesComponent implements OnInit {
  private readonly companiesService = inject(SuperadminCompaniesService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly companies = signal<SuperadminCompany[]>([]);
  readonly meta = signal<PageMeta | null>(null);
  readonly page = signal(1);
  readonly search = signal("");
  private searchDebounce?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.load();
  }

  // How many gyms have had their access shut. Shown whether or not the list
  // is narrowed to them, so the signal cannot be missed.
  readonly closedCount = signal(0);
  readonly onlyClosed = signal(false);

  toggleClosed(): void {
    this.onlyClosed.update((v) => !v);
    this.page.set(1);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.companiesService.list(this.page(), this.search() || undefined, this.onlyClosed()).subscribe({
      next: (res) => {
        this.companies.set(res.companies);
        this.meta.set(res.meta);
        this.closedCount.set(res.closed_count ?? 0);
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
