import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { MemberSessionsService } from "./member-sessions.service";

describe("MemberSessionsService", () => {
  let service: MemberSessionsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(MemberSessionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("list GETs /me/sessions with no params by default", () => {
    service.list().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/me/sessions`);
    expect(req.request.method).toBe("GET");
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ sessions: [] });
  });

  it("list passes a date filter when given", () => {
    service.list("2026-09-15").subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/me/sessions`);
    expect(req.request.params.get("date")).toBe("2026-09-15");
    req.flush({ sessions: [] });
  });
});
