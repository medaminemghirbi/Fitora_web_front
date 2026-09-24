import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { AppUpdatesService } from "./app-updates.service";

describe("AppUpdatesService", () => {
  let service: AppUpdatesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AppUpdatesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("list GETs the admin-facing endpoint", () => {
    service.list().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/app_updates`);
    expect(req.request.method).toBe("GET");
    req.flush({ app_updates: [] });
  });

  it("listSuperadmin GETs the superadmin endpoint", () => {
    service.listSuperadmin().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/superadmin/app_updates`);
    expect(req.request.method).toBe("GET");
    req.flush({ app_updates: [] });
  });

  it("create POSTs multipart form data with version/title/description/media", () => {
    const file = new File(["x"], "shot.png", { type: "image/png" });
    service.create("1.2.0", "New release", "Bug fixes", [file]).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/superadmin/app_updates`);
    expect(req.request.method).toBe("POST");
    const body = req.request.body as FormData;
    expect(body instanceof FormData).toBe(true);
    expect(body.get("app_update[version]")).toBe("1.2.0");
    expect(body.get("app_update[title]")).toBe("New release");
    expect(body.get("app_update[description]")).toBe("Bug fixes");
    expect(body.getAll("media[]").length).toBe(1);
    req.flush({ app_update: {} });
  });
});
