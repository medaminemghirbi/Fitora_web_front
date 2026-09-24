import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { NotificationService } from "../../../core/services/notification.service";
import { AppNotification } from "../../../core/models/notification.model";
import { notificationText } from "../../../shared/utils/notification-text";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { TimeAgoPipe } from "../../../shared/pipes/time-ago.pipe";
import { NotificationArtComponent } from "../../../layout/notifications/notification-art.component";

@Component({
  selector: "app-notifications-inbox",
  standalone: true,
  imports: [RouterLink, TranslateModule, EmptyStateComponent, TimeAgoPipe, NotificationArtComponent],
  templateUrl: "./notifications-inbox.component.html",
  styleUrl: "./notifications-inbox.component.scss",
})
export class NotificationsInboxComponent implements OnInit {
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  readonly filter = signal<"all" | "unread">("all");
  readonly loading = this.notifications.loading;
  readonly hasMore = this.notifications.hasMore;
  readonly unreadCount = this.notifications.unreadCount;

  readonly visible = computed(() => {
    const all = this.notifications.items();
    return this.filter() === "unread" ? all.filter((n) => !n.read) : all;
  });

  ngOnInit(): void {
    this.notifications.loadFirstPage();
  }

  text(n: AppNotification): { title: string; body: string } {
    return notificationText(this.translate, n);
  }

  loadMore(): void {
    this.notifications.loadMore();
  }

  markRead(n: AppNotification, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.notifications.markRead(n.id);
  }

  markAllRead(): void {
    this.notifications.markAllRead();
  }
}
