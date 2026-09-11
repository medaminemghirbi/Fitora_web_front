import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { BookingsService } from "./bookings.service";

describe("BookingsService", () => {
  let service: BookingsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(BookingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("list GETs with no params by default", () => {
    service.list().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/bookings`);
    expect(req.request.method).toBe("GET");
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ bookings: [], meta: {} });
  });

  it("list omits blank/undefined filter values", () => {
    service.list({ q: "", status: undefined, activity_id: "a1", page: 2 }).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/bookings`);
    expect(req.request.params.has("q")).toBe(false);
    expect(req.request.params.has("status")).toBe(false);
    expect(req.request.params.get("activity_id")).toBe("a1");
    expect(req.request.params.get("page")).toBe("2");
    req.flush({ bookings: [], meta: {} });
  });

  it("create POSTs client_id and session_id", () => {
    service.create("c1", "s1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/bookings`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ client_id: "c1", session_id: "s1" });
    req.flush({ booking: {} });
  });

  it("cancel POSTs to /bookings/:id/cancel", () => {
    service.cancel("b1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/bookings/b1/cancel`);
    expect(req.request.method).toBe("POST");
    req.flush({ booking: {} });
  });

  it("remind POSTs to /bookings/:id/remind", () => {
    service.remind("b1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/bookings/b1/remind`);
    expect(req.request.method).toBe("POST");
    req.flush({ status: "sent" });
  });
});
