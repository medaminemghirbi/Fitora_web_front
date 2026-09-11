import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { ActivitiesService } from "./activities.service";

describe("ActivitiesService", () => {
  let service: ActivitiesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ActivitiesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("list GETs /activities", () => {
    service.list().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/activities`);
    expect(req.request.method).toBe("GET");
    req.flush({ activities: [] });
  });

  it("get GETs a single activity", () => {
    service.get("a1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/activities/a1`);
    expect(req.request.method).toBe("GET");
    req.flush({ activity: {} });
  });

  it("create POSTs a wrapped payload", () => {
    service.create({ name: "Yoga" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/activities`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ activity: { name: "Yoga" } });
    req.flush({ activity: {} });
  });

  it("update PATCHes a wrapped payload", () => {
    service.update("a1", { active: false }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/activities/a1`);
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ activity: { active: false } });
    req.flush({ activity: {} });
  });

  it("deactivate DELETEs the activity", () => {
    service.deactivate("a1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/activities/a1`);
    expect(req.request.method).toBe("DELETE");
    req.flush({ activity: {} });
  });
});
