import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { LibraryFoldersService } from "./library-folders.service";

describe("LibraryFoldersService", () => {
  let service: LibraryFoldersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(LibraryFoldersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("list GETs /library_folders", () => {
    service.list().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/library_folders`);
    expect(req.request.method).toBe("GET");
    req.flush({ folders: [] });
  });

  it("get GETs a single folder", () => {
    service.get("f1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/library_folders/f1`);
    expect(req.request.method).toBe("GET");
    req.flush({ folder: {} });
  });

  it("create POSTs a wrapped payload", () => {
    service.create({ name: "Contracts" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/library_folders`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ library_folder: { name: "Contracts" } });
    req.flush({ folder: {} });
  });

  it("update PATCHes a wrapped payload", () => {
    service.update("f1", { name: "Invoices" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/library_folders/f1`);
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ library_folder: { name: "Invoices" } });
    req.flush({ folder: {} });
  });

  it("destroy DELETEs the folder", () => {
    service.destroy("f1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/library_folders/f1`);
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });
});
