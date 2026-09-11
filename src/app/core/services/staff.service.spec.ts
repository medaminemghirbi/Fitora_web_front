import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { StaffService } from "./staff.service";

describe("StaffService", () => {
  let service: StaffService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(StaffService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("list GETs /staff", () => {
    service.list().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/staff`);
    expect(req.request.method).toBe("GET");
    req.flush({ staff: [] });
  });

  it("create POSTs a wrapped payload", () => {
    const payload = { first_name: "A", last_name: "B", email: "a@x.test", password: "pw", role_id: "r1" };
    service.create(payload).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/staff`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ staff_member: payload });
    req.flush({ staff_member: {} });
  });

  it("update PATCHes a wrapped payload", () => {
    service.update("sm1", { active: false }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/staff/sm1`);
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ staff_member: { active: false } });
    req.flush({ staff_member: {} });
  });
});
