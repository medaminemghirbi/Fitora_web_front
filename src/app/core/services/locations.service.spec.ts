import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { LocationsService } from "./locations.service";

describe("LocationsService", () => {
  let service: LocationsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(LocationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("get GETs the singular /location resource", () => {
    service.get().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/location`);
    expect(req.request.method).toBe("GET");
    req.flush({ location: {} });
  });

  it("update PATCHes a wrapped payload", () => {
    service.update({ name: "Main gym" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/location`);
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ location: { name: "Main gym" } });
    req.flush({ location: {} });
  });
});
