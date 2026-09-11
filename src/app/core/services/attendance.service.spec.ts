import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { AttendanceService } from "./attendance.service";

describe("AttendanceService", () => {
  let service: AttendanceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AttendanceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("forSession GETs with a session_id param", () => {
    service.forSession("s1").subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/attendance`);
    expect(req.request.method).toBe("GET");
    expect(req.request.params.get("session_id")).toBe("s1");
    req.flush({ session: {}, bookings: [] });
  });

  it("mark POSTs booking_id and status", () => {
    service.mark("b1", "present").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/attendance`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ booking_id: "b1", status: "present" });
    req.flush({ attendance: {} });
  });
});
