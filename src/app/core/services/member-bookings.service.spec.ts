import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { MemberBookingsService } from "./member-bookings.service";

describe("MemberBookingsService", () => {
  let service: MemberBookingsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(MemberBookingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("list defaults to when=upcoming", () => {
    service.list().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/me/bookings`);
    expect(req.request.params.get("when")).toBe("upcoming");
    req.flush({ bookings: [] });
  });

  it("list passes when=past", () => {
    service.list("past").subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/me/bookings`);
    expect(req.request.params.get("when")).toBe("past");
    req.flush({ bookings: [] });
  });

  it("create POSTs the session_id", () => {
    service.create("s1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/me/bookings`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ session_id: "s1" });
    req.flush({ booking: {} });
  });

  it("cancel POSTs to /me/bookings/:id/cancel", () => {
    service.cancel("b1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/me/bookings/b1/cancel`);
    expect(req.request.method).toBe("POST");
    req.flush({ booking: {} });
  });
});
