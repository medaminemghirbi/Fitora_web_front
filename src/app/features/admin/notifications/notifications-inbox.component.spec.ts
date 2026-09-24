import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AppNotification } from "../../../core/models/notification.model";
import { NotificationService } from "../../../core/services/notification.service";
import { NotificationsInboxComponent } from "./notifications-inbox.component";

describe("NotificationsInboxComponent", () => {
  let fixture: ComponentFixture<NotificationsInboxComponent>;
  let component: NotificationsInboxComponent;
  let notifications: {
    items: jasmine.Spy; loading: jasmine.Spy; hasMore: jasmine.Spy; unreadCount: jasmine.Spy;
    loadFirstPage: jasmine.Spy; loadMore: jasmine.Spy; markRead: jasmine.Spy; markAllRead: jasmine.Spy;
  };

  const readN = { id: "n1", kind: "system_update", data: { version: "1.0" }, read: true } as unknown as AppNotification;
  const unreadN = { id: "n2", kind: "system_update", data: { version: "1.1" }, read: false } as unknown as AppNotification;

  beforeEach(async () => {
    notifications = {
      items: jasmine.createSpy().and.returnValue([readN, unreadN]),
      loading: jasmine.createSpy().and.returnValue(false),
      hasMore: jasmine.createSpy().and.returnValue(false),
      unreadCount: jasmine.createSpy().and.returnValue(1),
      loadFirstPage: jasmine.createSpy(),
      loadMore: jasmine.createSpy(),
      markRead: jasmine.createSpy(),
      markAllRead: jasmine.createSpy(),
    };

    await TestBed.configureTestingModule({
      imports: [NotificationsInboxComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: NotificationService, useValue: notifications }],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsInboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("loads the first page on init", () => {
    expect(notifications.loadFirstPage).toHaveBeenCalled();
  });

  it("visible() shows everything by default", () => {
    expect(component.visible().length).toBe(2);
  });

  it("visible() shows only unread when filtered", () => {
    component.filter.set("unread");
    expect(component.visible()).toEqual([unreadN]);
  });

  it("loadMore delegates to the service", () => {
    component.loadMore();
    expect(notifications.loadMore).toHaveBeenCalled();
  });

  it("markRead stops the click and marks it read", () => {
    const event = new Event("click");
    spyOn(event, "preventDefault");
    spyOn(event, "stopPropagation");
    component.markRead(unreadN, event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(notifications.markRead).toHaveBeenCalledWith("n2");
  });

  it("markAllRead delegates to the service", () => {
    component.markAllRead();
    expect(notifications.markAllRead).toHaveBeenCalled();
  });

  it("text() delegates to notificationText", () => {
    expect(component.text(unreadN).title).toBeTruthy();
  });
});
