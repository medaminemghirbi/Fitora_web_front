import { HttpClient } from "@angular/common/http";
import { Injectable, computed, inject, signal } from "@angular/core";
import { createConsumer, Consumer, Subscription } from "@rails/actioncable";
import { API_BASE_URL, API_ORIGIN } from "../models/api-config";
import { AppNotification, NotificationPage } from "../models/notification.model";
import { AuthService } from "../auth/auth.service";
import { AppVersionService } from "./app-version.service";

interface ChannelEvent {
  type: "created" | "unread_count";
  count?: number;
  // when type === "created", the rest of the payload is an AppNotification
  id?: string;
  kind?: AppNotification["kind"];
  data?: AppNotification["data"];
  url?: string;
  subject?: AppNotification["subject"];
  read?: boolean;
  created_at?: string;
}

/**
 * The signed-in user's notification feed — the owner's own, or a Fitora
 * admin's (system_update). Live pushes come over an ActionCable
 * subscription (NotificationChannel); history + read-state go over REST.
 * Connected/disconnected by ConfigurationService.load / AuthService.logout.
 */
@Injectable({ providedIn: "root" })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly appVersion = inject(AppVersionService);

  readonly items = signal<AppNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly loading = signal(false);
  private readonly page = signal(1);
  private readonly totalPages = signal(1);
  readonly hasMore = computed(() => this.page() < this.totalPages());

  private consumer: Consumer | null = null;
  private subscription: Subscription | null = null;

  /** Seed the badge from the bootstrap payload before the socket / first fetch. */
  seedUnreadCount(count: number): void {
    this.unreadCount.set(count ?? 0);
  }

  connect(): void {
    const role = this.auth.currentUser()?.role;
    if (this.subscription || (role !== "owner" && role !== "admin")) return;
    const token = this.auth.getToken();
    if (!token) return;

    const wsBase = API_ORIGIN.replace(/^http/, "ws");
    this.consumer = createConsumer(`${wsBase}/cable?token=${encodeURIComponent(token)}`);
    this.subscription = this.consumer.subscriptions.create("NotificationChannel", {
      received: (raw: unknown) => this.onEvent(raw as ChannelEvent),
    });
  }

  disconnect(): void {
    this.subscription?.unsubscribe();
    this.consumer?.disconnect();
    this.subscription = null;
    this.consumer = null;
    this.items.set([]);
    this.unreadCount.set(0);
    this.page.set(1);
    this.totalPages.set(1);
  }

  loadFirstPage(): void {
    this.page.set(1);
    this.fetch(1, true);
  }

  loadMore(): void {
    if (this.loading() || !this.hasMore()) return;
    this.fetch(this.page() + 1, false);
  }

  get(id: string) {
    return this.http.get<{ notification: AppNotification }>(`${API_BASE_URL}/notifications/${id}`);
  }

  markRead(id: string): void {
    const target = this.items().find((n) => n.id === id);
    if (target && target.read) return;
    this.http.patch<{ notification: AppNotification }>(`${API_BASE_URL}/notifications/${id}/read`, {}).subscribe({
      next: () => {
        this.items.update((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
        this.unreadCount.update((c) => Math.max(0, c - 1));
      },
      error: () => {},
    });
  }

  markAllRead(): void {
    this.http.post(`${API_BASE_URL}/notifications/read_all`, {}).subscribe({
      next: () => {
        this.items.update((list) => list.map((n) => ({ ...n, read: true })));
        this.unreadCount.set(0);
      },
      error: () => {},
    });
  }

  refresh(): void {
    this.loadFirstPage();
    this.http.get<{ count: number }>(`${API_BASE_URL}/notifications/unread_count`).subscribe({
      next: (r) => this.unreadCount.set(r.count),
      error: () => {},
    });
  }

  private fetch(page: number, replace: boolean): void {
    this.loading.set(true);
    this.http.get<NotificationPage>(`${API_BASE_URL}/notifications`, { params: { page: String(page) } }).subscribe({
      next: (res) => {
        this.page.set(res.meta.page);
        this.totalPages.set(res.meta.total_pages);
        this.unreadCount.set(res.unread_count);
        this.items.update((list) => (replace ? res.notifications : [...list, ...res.notifications]));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private onEvent(event: ChannelEvent): void {
    if (event.type === "unread_count") {
      this.unreadCount.set(event.count ?? 0);
      return;
    }
    if (event.type === "created" && event.id) {
      const incoming = event as unknown as AppNotification;
      this.items.update((list) => (list.some((n) => n.id === incoming.id) ? list : [incoming, ...list]));
      // The version badge has no push of its own — piggyback on this one so
      // it updates live instead of waiting for a reload.
      if (incoming.kind === "system_update") this.appVersion.refresh();
    }
  }
}
