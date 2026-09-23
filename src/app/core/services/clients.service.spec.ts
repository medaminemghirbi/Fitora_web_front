import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { ClientsService } from "./clients.service";

describe("ClientsService", () => {
  let service: ClientsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ClientsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("list GETs with no params by default", () => {
    service.list().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/clients`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ clients: [], meta: {} });
  });

  it("list forwards non-blank filters", () => {
    service.list({ search: "amy", status: "active", page: 2 }).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/clients`);
    expect(req.request.params.get("search")).toBe("amy");
    expect(req.request.params.get("status")).toBe("active");
    expect(req.request.params.get("page")).toBe("2");
    req.flush({ clients: [], meta: {} });
  });

  it("get GETs the client detail bundle", () => {
    service.get("c1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/clients/c1`);
    expect(req.request.method).toBe("GET");
    req.flush({ client: {}, contracts: [], bookings: [], payments: [] });
  });

  it("create POSTs a wrapped payload", () => {
    service.create({ first_name: "A" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/clients`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ client: { first_name: "A" } });
    req.flush({ client: {} });
  });

  it("update PATCHes a wrapped payload", () => {
    service.update("c1", { phone: "123" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/clients/c1`);
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ client: { phone: "123" } });
    req.flush({ client: {} });
  });

});
