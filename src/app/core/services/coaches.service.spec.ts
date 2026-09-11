import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { CoachesService } from "./coaches.service";

describe("CoachesService", () => {
  let service: CoachesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CoachesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("list GETs /coaches", () => {
    service.list().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/coaches`);
    expect(req.request.method).toBe("GET");
    req.flush({ coaches: [] });
  });

  it("get GETs a single coach", () => {
    service.get("c1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/coaches/c1`);
    expect(req.request.method).toBe("GET");
    req.flush({ coach: {} });
  });

  it("create POSTs a wrapped payload", () => {
    service.create({ first_name: "A" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/coaches`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ coach: { first_name: "A" } });
    req.flush({ coach: {} });
  });

  it("update PATCHes a wrapped payload", () => {
    service.update("c1", { active: false }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/coaches/c1`);
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ coach: { active: false } });
    req.flush({ coach: {} });
  });

  it("deactivate DELETEs the coach", () => {
    service.deactivate("c1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/coaches/c1`);
    expect(req.request.method).toBe("DELETE");
    req.flush({ coach: {} });
  });

  it("setLogin POSTs email/password", () => {
    service.setLogin("c1", "e@x.test", "pw").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/coaches/c1/login`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ email: "e@x.test", password: "pw" });
    req.flush({ coach: {} });
  });
});
