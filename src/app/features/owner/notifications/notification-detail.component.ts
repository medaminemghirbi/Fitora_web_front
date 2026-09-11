import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { DatePipe } from "@angular/common";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { NotificationService } from "../../../core/services/notification.service";
import { AppNotification } from "../../../core/models/notification.model";
import { notificationText, notificationCtaKey } from "../../../shared/utils/notification-text";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { NotificationArtComponent } from "../../../layout/notifications/notification-art.component";

@Component({
  selector: "app-notification-detail",
  standalone: true,
  imports: [RouterLink, DatePipe, TranslateModule, SpinnerComponent, ErrorStateComponent, NotificationArtComponent],
  templateUrl: "./notification-detail.component.html",
  styleUrl: "./notification-detail.component.scss",
})
export class NotificationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly notification = signal<AppNotification | null>(null);

  readonly text = computed(() => {
    const n = this.notification();
    return n ? notificationText(this.translate, n) : { title: "", body: "" };
  });
  readonly ctaKey = computed(() => {
    const n = this.notification();
    return n ? notificationCtaKey(n) : "";
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get("id")!;
    this.loading.set(true);
    this.error.set(false);
    this.notifications.get(id).subscribe({
      next: (res) => {
        this.notification.set(res.notification);
        this.loading.set(false);
        this.notifications.markRead(id);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
