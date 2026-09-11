import { Component, OnInit, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Booking } from "../../../core/models/booking.model";
import { BookingsService } from "../../../core/services/bookings.service";
import { PageMeta } from "../../../core/services/sessions.service";
import { ToastService } from "../../../core/services/toast.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { PaginationComponent } from "../../../shared/components/pagination.component";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { AvatarComponent } from "../../../shared/components/avatar.component";
import { PageHeaderComponent } from "../../../shared/ui/page-header.component";
import { HighlightPipe } from "../../../shared/pipes/highlight.pipe";
import { SEARCH_DEBOUNCE_MS } from "../../../shared/utils/client-list";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { ActionMenuComponent } from "../../../shared/ui/action-menu.component";

@Component({
  selector: "app-owner-bookings",
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    TranslateModule,
    EmptyStateComponent,
    PaginationComponent,
    SpinnerComponent,
    StatusBadgeComponent,
    AvatarComponent,
    PageHeaderComponent,
    HighlightPipe,
    SkeletonComponent,
    ErrorStateComponent,
    ActionMenuComponent,
  ],
  templateUrl: "./bookings.component.html",
})
export class OwnerBookingsComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly bookings = signal<Booking[]>([]);
  readonly meta = signal<PageMeta | null>(null);
  readonly statusFilter = signal<string>("");
  readonly dateFilter = signal<string>("");
  readonly search = signal("");
  readonly page = signal(1);
  readonly remindingId = signal<string | null>(null);
  private searchDebounce?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly bookingsService: BookingsService,
    private readonly toast: ToastService,
    private readonly confirm: ConfirmService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.bookingsService
      .list({
        status: this.statusFilter() || undefined,
        date: this.dateFilter() || undefined,
        q: this.search() || undefined,
        page: this.page(),
      })
      .subscribe({
        next: (res) => {
          this.bookings.set(res.bookings);
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

  hasFilters(): boolean {
    return this.statusFilter() !== "" || this.dateFilter() !== "" || this.search() !== "";
  }

  resetFilters(): void {
    this.statusFilter.set("");
    this.dateFilter.set("");
    this.search.set("");
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.load();
  }

  async cancel(booking: Booking): Promise<void> {
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

  remind(booking: Booking): void {
    this.remindingId.set(booking.id);
    this.bookingsService.remind(booking.id).subscribe({
      next: () => {
        this.remindingId.set(null);
        this.toast.success(this.translate.instant("bookings.reminder_sent"));
      },
      error: (err) => {
        this.remindingId.set(null);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }
}
