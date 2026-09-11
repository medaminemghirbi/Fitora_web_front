import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { AppVersionService } from "./app-version.service";

describe("AppVersionService", () => {
  let service: AppVersionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AppVersionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("load fetches the version once and sets current()", () => {
    service.load();
    const req = httpMock.expectOne(`${API_BASE_URL}/app_version`);
    req.flush({ version: "1.0.0" });
    expect(service.current()).toBe("1.0.0");
  });

  it("load is a no-op once already loaded", () => {
    service.load();
    httpMock.expectOne(`${API_BASE_URL}/app_version`).flush({ version: "1.0.0" });

    service.load();
    expect(() => httpMock.expectNone(`${API_BASE_URL}/app_version`)).not.toThrow();
  });

  it("refresh always re-fetches, bypassing the loaded cache", () => {
    service.load();
    httpMock.expectOne(`${API_BASE_URL}/app_version`).flush({ version: "1.0.0" });

    service.refresh();
    const req = httpMock.expectOne(`${API_BASE_URL}/app_version`);
    req.flush({ version: "1.1.0" });
    expect(service.current()).toBe("1.1.0");
  });

  it("on error, resets loaded so a later load() retries", () => {
    service.load();
    httpMock.expectOne(`${API_BASE_URL}/app_version`).error(new ProgressEvent("error"));
    expect(service.current()).toBeNull();

    service.load();
    httpMock.expectOne(`${API_BASE_URL}/app_version`).flush({ version: "2.0.0" });
    expect(service.current()).toBe("2.0.0");
  });
});
