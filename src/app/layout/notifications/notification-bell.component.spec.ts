import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { NotificationService } from "../../core/services/notification.service";
import { NotificationBellComponent } from "./notification-bell.component";

describe("NotificationBellComponent", () => {
  let fixture: ComponentFixture<NotificationBellComponent>;
  let component: NotificationBellComponent;
  let notifications: {
    items: jasmine.Spy;
    unreadCount: jasmine.Spy;
    loading: jasmine.Spy;
    hasMore: jasmine.Spy;
    loadFirstPage: jasmine.Spy;
    loadMore: jasmine.Spy;
    markRead: jasmine.Spy;
    markAllRead: jasmine.Spy;
  };
  let router: Router;

  const notification = {
    id: "n1",
    kind: "system_update" as const,
    data: {},
    url: "/superadmin/updates",
    subject: null,
    read: false,
    created_at: new Date().toISOString(),
  };

  beforeEach(async () => {
    notifications = {
      items: jasmine.createSpy().and.returnValue([notification]),
      unreadCount: jasmine.createSpy().and.returnValue(3),
      loading: jasmine.createSpy().and.returnValue(false),
      hasMore: jasmine.createSpy().and.returnValue(false),
      loadFirstPage: jasmine.createSpy(),
      loadMore: jasmine.createSpy(),
      markRead: jasmine.createSpy(),
      markAllRead: jasmine.createSpy(),
    };

    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: notifications },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, "navigate");
    spyOn(router, "navigateByUrl");
    fixture.detectChanges();
  });

  it("badge shows the exact count at or below 9", () => {
    expect(component.badge()).toBe("3");
  });

  it("badge caps the unread count display at 9+", () => {
    // badge() reads a plain stub function (not a real Signal), so it's only
    // ever (re)computed on its first read — the count must be set before
    // that, i.e. on a fresh component, not the shared one already rendered.
    notifications.unreadCount.and.returnValue(42);
    const fresh = TestBed.createComponent(NotificationBellComponent);
    fresh.detectChanges();
    expect(fresh.componentInstance.badge()).toBe("9+");
  });

  it("toggle() opens the panel and loads the first page when empty", () => {
    component.toggle();
    expect(component.open()).toBe(true);
    expect(notifications.loadFirstPage).not.toHaveBeenCalled(); // items() already has one
  });

  it("toggle() loads the first page when opening with an empty list", () => {
    notifications.items.and.returnValue([]);
    component.toggle();
    expect(notifications.loadFirstPage).toHaveBeenCalled();
  });

  it("toggle() closes when already open", () => {
    component.open.set(true);
    component.toggle();
    expect(component.open()).toBe(false);
  });

  it("onScroll loads more once near the bottom", () => {
    const el = { scrollHeight: 500, scrollTop: 400, clientHeight: 50 } as HTMLElement;
    component.onScroll(el);
    expect(notifications.loadMore).toHaveBeenCalled();
  });

  it("onScroll does nothing while far from the bottom", () => {
    const el = { scrollHeight: 500, scrollTop: 0, clientHeight: 50 } as HTMLElement;
    component.onScroll(el);
    expect(notifications.loadMore).not.toHaveBeenCalled();
  });

  it("select() marks read, closes the panel, and routes to the detail page when set", () => {
    component.open.set(true);
    component.select(notification);
    expect(notifications.markRead).toHaveBeenCalledWith("n1");
    expect(component.open()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(["/admin/notifications", "n1"]);
  });

  it("select() navigates straight to the notification's url when there is no detailRoute", () => {
    component.detailRoute = null;
    component.select(notification);
    expect(router.navigateByUrl).toHaveBeenCalledWith("/superadmin/updates");
  });

  it("markAllRead delegates to the service", () => {
    component.markAllRead();
    expect(notifications.markAllRead).toHaveBeenCalled();
  });

  it("seeAll closes the panel and routes to the inbox when detailRoute is set", () => {
    component.open.set(true);
    component.seeAll();
    expect(component.open()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(["/admin/notifications"]);
  });

  it("seeAll does not navigate when there is no detailRoute", () => {
    component.detailRoute = null;
    component.seeAll();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("closes on an outside click", () => {
    component.open.set(true);
    component.onDocClick({ target: document.body } as unknown as MouseEvent);
    expect(component.open()).toBe(false);
  });

  it("Escape closes the panel", () => {
    component.open.set(true);
    component.onEsc();
    expect(component.open()).toBe(false);
  });

  it("text() delegates to notificationText", () => {
    const result = component.text(notification);
    expect(result.title).toBeTruthy();
  });
});
