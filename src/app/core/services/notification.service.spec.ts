import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { AuthService } from "../auth/auth.service";
import { API_BASE_URL } from "../models/api-config";
import { AppVersionService } from "./app-version.service";
import { NotificationService } from "./notification.service";

describe("NotificationService", () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  let authStub: { currentUser: jasmine.Spy; getToken: jasmine.Spy; isClient: jasmine.Spy };
  let appVersionStub: jasmine.SpyObj<AppVersionService>;

  beforeEach(() => {
    authStub = {
      currentUser: jasmine.createSpy().and.returnValue({ role: "admin" }),
      getToken: jasmine.createSpy().and.returnValue(null),
      isClient: jasmine.createSpy().and.returnValue(false),
    };
    appVersionStub = jasmine.createSpyObj<AppVersionService>("AppVersionService", ["refresh"]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authStub },
        { provide: AppVersionService, useValue: appVersionStub },
      ],
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("seedUnreadCount sets the badge", () => {
    service.seedUnreadCount(5);
    expect(service.unreadCount()).toBe(5);
  });

  it("seedUnreadCount defaults to 0 for a null/undefined count", () => {
    service.seedUnreadCount(null as unknown as number);
    expect(service.unreadCount()).toBe(0);
  });

  it("connect() does nothing without a token", () => {
    service.connect();
    // no throw / no subscription created — nothing to assert over HTTP, but
    // disconnect() should be safe to call even though nothing connected.
    expect(() => service.disconnect()).not.toThrow();
  });

  it("connect() does nothing for a role that isn't admin/superadmin", () => {
    authStub.currentUser.and.returnValue({ role: "staff" });
    authStub.getToken.and.returnValue("tok");
    service.connect();
    expect(() => service.disconnect()).not.toThrow();
  });

  it("disconnect() resets items/unreadCount/pagination", () => {
    service.seedUnreadCount(3);
    service.disconnect();
    expect(service.unreadCount()).toBe(0);
    expect(service.items()).toEqual([]);
  });

  it("loadFirstPage GETs page 1 and replaces the list", () => {
    service.loadFirstPage();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/notifications`);
    expect(req.request.params.get("page")).toBe("1");
    req.flush({
      notifications: [{ id: "n1" }],
      unread_count: 2,
      meta: { page: 1, total_pages: 3 },
    });
    expect(service.items().length).toBe(1);
    expect(service.unreadCount()).toBe(2);
    expect(service.hasMore()).toBe(true);
  });

  it("loadFirstPage stops loading even when the fetch fails", () => {
    service.loadFirstPage();
    httpMock.expectOne((r) => r.url === `${API_BASE_URL}/notifications`).error(new ProgressEvent("error"));
    expect(service.loading()).toBe(false);
  });

  it("loadMore fetches the next page and appends", () => {
    service.loadFirstPage();
    httpMock.expectOne((r) => r.url === `${API_BASE_URL}/notifications`).flush({
      notifications: [{ id: "n1" }],
      unread_count: 1,
      meta: { page: 1, total_pages: 2 },
    });

    service.loadMore();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/notifications`);
    expect(req.request.params.get("page")).toBe("2");
    req.flush({
      notifications: [{ id: "n2" }],
      unread_count: 0,
      meta: { page: 2, total_pages: 2 },
    });
    expect(service.items().map((n) => n.id)).toEqual(["n1", "n2"]);
    expect(service.hasMore()).toBe(false);
  });

  it("loadMore is a no-op when there is no more to load", () => {
    service.loadMore();
    expect(() => httpMock.expectNone((r) => r.url === `${API_BASE_URL}/notifications`)).not.toThrow();
  });

  it("markRead PATCHes and marks the local item as read, decrementing the count, leaving others untouched", () => {
    service.loadFirstPage();
    httpMock.expectOne((r) => r.url === `${API_BASE_URL}/notifications`).flush({
      notifications: [{ id: "n1", read: false }, { id: "n2", read: false }],
      unread_count: 2,
      meta: { page: 1, total_pages: 1 },
    });

    service.markRead("n1");
    const req = httpMock.expectOne(`${API_BASE_URL}/notifications/n1/read`);
    expect(req.request.method).toBe("PATCH");
    req.flush({ notification: {} });

    expect(service.items()[0].read).toBe(true);
    expect(service.items()[1].read).toBe(false);
    expect(service.unreadCount()).toBe(1);
  });

  it("markRead is a no-op for an already-read item", () => {
    service.loadFirstPage();
    httpMock.expectOne((r) => r.url === `${API_BASE_URL}/notifications`).flush({
      notifications: [{ id: "n1", read: true }],
      unread_count: 0,
      meta: { page: 1, total_pages: 1 },
    });

    service.markRead("n1");
    expect(() => httpMock.expectNone(`${API_BASE_URL}/notifications/n1/read`)).not.toThrow();
  });

  it("markAllRead POSTs, marks every local item read, and clears the unread count", () => {
    service.loadFirstPage();
    httpMock.expectOne((r) => r.url === `${API_BASE_URL}/notifications`).flush({
      notifications: [{ id: "n1", read: false }, { id: "n2", read: false }],
      unread_count: 2,
      meta: { page: 1, total_pages: 1 },
    });

    service.markAllRead();
    const req = httpMock.expectOne(`${API_BASE_URL}/notifications/read_all`);
    expect(req.request.method).toBe("POST");
    req.flush({});
    expect(service.unreadCount()).toBe(0);
    expect(service.items().every((n) => n.read)).toBe(true);
  });

  it("refresh reloads page 1 and the unread count", () => {
    service.refresh();
    httpMock.expectOne((r) => r.url === `${API_BASE_URL}/notifications`).flush({
      notifications: [],
      unread_count: 0,
      meta: { page: 1, total_pages: 1 },
    });
    const countReq = httpMock.expectOne(`${API_BASE_URL}/notifications/unread_count`);
    countReq.flush({ count: 7 });
    expect(service.unreadCount()).toBe(7);
  });

  it("refresh swallows a failure to reload the unread count", () => {
    service.refresh();
    httpMock.expectOne((r) => r.url === `${API_BASE_URL}/notifications`).flush({
      notifications: [],
      unread_count: 0,
      meta: { page: 1, total_pages: 1 },
    });
    expect(() =>
      httpMock.expectOne(`${API_BASE_URL}/notifications/unread_count`).error(new ProgressEvent("error"))
    ).not.toThrow();
  });

  it("get() GETs a single notification", () => {
    service.get("n1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/notifications/n1`);
    expect(req.request.method).toBe("GET");
    req.flush({ notification: {} });
  });

  it("markRead swallows an error from the backend without throwing", () => {
    service.loadFirstPage();
    httpMock.expectOne((r) => r.url === `${API_BASE_URL}/notifications`).flush({
      notifications: [{ id: "n1", read: false }],
      unread_count: 1,
      meta: { page: 1, total_pages: 1 },
    });
    service.markRead("n1");
    expect(() => httpMock.expectOne(`${API_BASE_URL}/notifications/n1/read`).error(new ProgressEvent("error"))).not.toThrow();
  });

  it("markAllRead swallows an error from the backend without throwing", () => {
    service.markAllRead();
    expect(() => httpMock.expectOne(`${API_BASE_URL}/notifications/read_all`).error(new ProgressEvent("error"))).not.toThrow();
  });

  it("connect() opens a real subscription for an admin with a token, and disconnect() tears it down", () => {
    authStub.currentUser.and.returnValue({ role: "admin" });
    authStub.getToken.and.returnValue("tok123");

    service.connect();
    // A second connect() while already connected is a no-op (early return).
    service.connect();
    // One ticket, for the one connection.
    httpMock.expectOne(`${API_BASE_URL}/cable_ticket`).flush({ ticket: "t1" });

    expect(() => service.disconnect()).not.toThrow();
    expect(service.items()).toEqual([]);
    expect(service.unreadCount()).toBe(0);
  });

  it("connect()'s subscription forwards received pushes to onEvent", () => {
    authStub.currentUser.and.returnValue({ role: "admin" });
    authStub.getToken.and.returnValue("tok123");

    service.connect();
    httpMock.expectOne(`${API_BASE_URL}/cable_ticket`).flush({ ticket: "t1" });
    const subscription = (service as unknown as { subscription: { received: (raw: unknown) => void } }).subscription;
    subscription.received({ type: "unread_count", count: 7 });

    expect(service.unreadCount()).toBe(7);
    service.disconnect();
  });

  it("connect() opens the socket with a cable ticket, never the login token", () => {
    authStub.getToken.and.returnValue("login-token");

    service.connect();
    const req = httpMock.expectOne(`${API_BASE_URL}/cable_ticket`);
    expect(req.request.method).toBe("POST");
    req.flush({ ticket: "one-time" });

    const url = (service as unknown as { consumer: { url: string } }).consumer.url;
    expect(url).toContain("ticket=one-time");
    expect(url).not.toContain("login-token");
    service.disconnect();
  });

  it("connect() fetches a fresh ticket when the connection drops", () => {
    authStub.getToken.and.returnValue("tok");
    service.connect();
    httpMock.expectOne(`${API_BASE_URL}/cable_ticket`).flush({ ticket: "first" });

    const subscription = (service as unknown as { subscription: { disconnected: () => void } }).subscription;
    subscription.disconnected();
    httpMock.expectOne(`${API_BASE_URL}/cable_ticket`).flush({ ticket: "second" });

    expect((service as unknown as { consumer: { url: string } }).consumer.url).toContain("ticket=second");
    service.disconnect();
  });

  describe("for a member", () => {
    beforeEach(() => {
      authStub.isClient.and.returnValue(true);
      authStub.currentUser.and.returnValue(null);
    });

    it("reads their own feed under /me", () => {
      service.loadFirstPage();
      httpMock
        .expectOne((r) => r.url === `${API_BASE_URL}/me/notifications`)
        .flush({ notifications: [], meta: { page: 1, per_page: 10, total: 0, total_pages: 0 }, unread_count: 0 });

      service.markAllRead();
      httpMock.expectOne(`${API_BASE_URL}/me/notifications/read_all`).flush(null);
    });

    it("connects too", () => {
      authStub.getToken.and.returnValue("tok");
      service.connect();

      httpMock.expectOne(`${API_BASE_URL}/cable_ticket`).flush({ ticket: "t" });
      expect((service as unknown as { subscription: unknown }).subscription).toBeTruthy();
      service.disconnect();
    });
  });

  describe("onEvent (live ActionCable pushes)", () => {
    function fireEvent(event: unknown): void {
      (service as unknown as { onEvent(e: unknown): void }).onEvent(event);
    }

    it("an unread_count event updates the badge", () => {
      fireEvent({ type: "unread_count", count: 4 });
      expect(service.unreadCount()).toBe(4);
    });

    it("an unread_count event with no count defaults to 0", () => {
      fireEvent({ type: "unread_count" });
      expect(service.unreadCount()).toBe(0);
    });

    it("a created event prepends the notification", () => {
      fireEvent({ type: "created", id: "n1", kind: "document_expiring" });
      expect(service.items()[0].id).toBe("n1");
    });

    it("a created event is ignored if that id is already in the list", () => {
      fireEvent({ type: "created", id: "n1", kind: "document_expiring" });
      fireEvent({ type: "created", id: "n1", kind: "document_expiring" });
      expect(service.items().length).toBe(1);
    });

    it("a created system_update event also refreshes the app version badge", () => {
      fireEvent({ type: "created", id: "n2", kind: "system_update" });
      expect(appVersionStub.refresh).toHaveBeenCalled();
    });

    it("a created event with no id is ignored", () => {
      fireEvent({ type: "created" });
      expect(service.items()).toEqual([]);
    });
  });
});
