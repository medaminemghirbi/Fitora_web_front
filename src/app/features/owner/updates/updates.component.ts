import { Component, OnInit, inject, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";
import { AppUpdate } from "../../../core/models/app-update.model";
import { AppUpdatesService } from "../../../core/services/app-updates.service";
import { PageHeaderComponent } from "../../../shared/ui/page-header.component";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { MediaUrlPipe } from "../../../shared/pipes/media-url.pipe";

// Read-only — the owner's view of the platform changelog an admin
// publishes (Api::V1::Admin::AppUpdatesController). Reached from the
// "system_update" notification's link.
@Component({
  selector: "app-owner-updates",
  standalone: true,
  imports: [DatePipe, TranslateModule, PageHeaderComponent, SpinnerComponent, ErrorStateComponent, EmptyStateComponent, MediaUrlPipe],
  templateUrl: "./updates.component.html",
  styleUrl: "./updates.component.scss",
})
export class OwnerUpdatesComponent implements OnInit {
  private readonly service = inject(AppUpdatesService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly updates = signal<AppUpdate[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.service.list().subscribe({
      next: (res) => {
        this.updates.set(res.app_updates);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
