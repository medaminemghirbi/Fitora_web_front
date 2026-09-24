import { Component, HostListener, Input, computed, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { NotificationService } from "../../core/services/notification.service";
import { AppNotification } from "../../core/models/notification.model";
import { notificationText } from "../../shared/utils/notification-text";
import { TimeAgoPipe } from "../../shared/pipes/time-ago.pipe";
import { NotificationArtComponent } from "./notification-art.component";

@Component({
  selector: "app-notification-bell",
  standalone: true,
  imports: [TranslateModule, TimeAgoPipe, NotificationArtComponent],
  templateUrl: "./notification-bell.component.html",
  styleUrl: "./notification-bell.component.scss",
})
export class NotificationBellComponent {
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  // Admin has a full notifications inbox (/admin/notifications/:id); superadmin
  // doesn't — clicking a system_update just deep-links straight to n.url
  // (e.g. /superadmin/updates) instead.
  @Input() detailRoute: string | null = "/admin/notifications";

  readonly open = signal(false);
  readonly items = this.notifications.items;
  readonly unreadCount = this.notifications.unreadCount;
  readonly loading = this.notifications.loading;
  readonly hasMore = this.notifications.hasMore;
  readonly badge = computed(() => {
    const n = this.unreadCount();
    return n > 9 ? "9+" : String(n);
  });

  toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next && this.items().length === 0) this.notifications.loadFirstPage();
  }

  text(n: AppNotification): { title: string; body: string } {
    return notificationText(this.translate, n);
  }

  onScroll(el: HTMLElement): void {
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) this.notifications.loadMore();
  }

  select(n: AppNotification): void {
    this.notifications.markRead(n.id);
    this.open.set(false);
    if (this.detailRoute) {
      this.router.navigate([this.detailRoute, n.id]);
    } else {
      this.router.navigateByUrl(n.url);
    }
  }

  markAllRead(): void {
    this.notifications.markAllRead();
  }

  seeAll(): void {
    this.open.set(false);
    if (this.detailRoute) this.router.navigate([this.detailRoute]);
  }

  @HostListener("document:click", ["$event"])
  onDocClick(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest("app-notification-bell")) this.open.set(false);
  }

  @HostListener("document:keydown.escape")
  onEsc(): void {
    this.open.set(false);
  }
}
