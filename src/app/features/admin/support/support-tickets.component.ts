import { Component, OnInit, inject, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AdminSupportTicketsService } from "../../../core/services/admin-support-tickets.service";
import { AdminSupportTicket, SupportTicketStatus } from "../../../core/models/support-ticket.model";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { ModalComponent } from "../../../shared/components/modal.component";

type FilterStatus = "open" | "all";

@Component({
  selector: "app-admin-support-tickets",
  standalone: true,
  imports: [DatePipe, TranslateModule, SpinnerComponent, ErrorStateComponent, EmptyStateComponent, ModalComponent],
  templateUrl: "./support-tickets.component.html",
  styleUrl: "./support-tickets.component.scss",
})
export class AdminSupportTicketsComponent implements OnInit {
  private readonly service = inject(AdminSupportTicketsService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly tickets = signal<AdminSupportTicket[]>([]);
  readonly filter = signal<FilterStatus>("open");

  readonly selected = signal<AdminSupportTicket | null>(null);
  readonly resolving = signal(false);

  ngOnInit(): void {
    this.load();
  }

  setFilter(filter: FilterStatus): void {
    this.filter.set(filter);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    const status: SupportTicketStatus | undefined = this.filter() === "open" ? "open" : undefined;
    this.service.list(status).subscribe({
      next: (res) => {
        this.tickets.set(res.support_tickets);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  /** A dialable link: separators out, the leading + kept. */
  telHref(phone: string): string {
    return `tel:${phone.replace(/[^\d+]/g, "")}`;
  }

  open(ticket: AdminSupportTicket): void {
    this.selected.set(ticket);
  }

  close(): void {
    this.selected.set(null);
  }

  resolve(ticket: AdminSupportTicket): void {
    this.resolving.set(true);
    this.service.resolve(ticket.id).subscribe({
      next: (res) => {
        this.resolving.set(false);
        this.selected.set(res.support_ticket);
        this.tickets.update((list) =>
          this.filter() === "open" ? list.filter((t) => t.id !== ticket.id) : list.map((t) => (t.id === ticket.id ? res.support_ticket : t))
        );
        this.toast.success(this.translate.instant("admin.support.resolved"));
      },
      error: (err) => {
        this.resolving.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }
}
