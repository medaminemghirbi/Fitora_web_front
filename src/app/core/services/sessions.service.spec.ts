import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { SessionsService } from "./sessions.service";

describe("SessionsService", () => {
  let service: SessionsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SessionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("list GETs with non-blank filters only", () => {
    service.list({ activity_id: "a1", status: "" }).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/sessions`);
    expect(req.request.params.get("activity_id")).toBe("a1");
    expect(req.request.params.has("status")).toBe(false);
    req.flush({ sessions: [], meta: {} });
  });

  it("range GETs with from/to and optional filters", () => {
    service.range({ from: "2026-01-01", to: "2026-01-07", coach_id: "c1" }).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/sessions`);
    expect(req.request.params.get("from")).toBe("2026-01-01");
    expect(req.request.params.get("to")).toBe("2026-01-07");
    expect(req.request.params.get("coach_id")).toBe("c1");
    req.flush({ sessions: [] });
  });

  it("create POSTs a wrapped payload, including client_id when given", () => {
    service.create({ activity_id: "a1", client_id: "cl1", starts_at: "t1", ends_at: "t2" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/sessions`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ session: { activity_id: "a1", client_id: "cl1", starts_at: "t1", ends_at: "t2" } });
    req.flush({ session: {} });
  });

  it("update PATCHes a wrapped payload", () => {
    service.update("s1", { coach_id: "c1" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/sessions/s1`);
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ session: { coach_id: "c1" } });
    req.flush({ session: {} });
  });

  it("cancel POSTs to /sessions/:id/cancel", () => {
    service.cancel("s1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/sessions/s1/cancel`);
    expect(req.request.method).toBe("POST");
    req.flush({ session: {} });
  });
});
