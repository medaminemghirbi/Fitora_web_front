import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL, API_ORIGIN } from "../models/api-config";
import { LibraryDocument } from "../models/library-document.model";
import { LibraryDocumentsService } from "./library-documents.service";

describe("LibraryDocumentsService", () => {
  let service: LibraryDocumentsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(LibraryDocumentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("list GETs with no params by default", () => {
    service.list().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/library_documents`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ documents: [], meta: {} });
  });

  it("list forwards non-blank filters", () => {
    service.list({ folder_id: "f1", status: "active", q: "lease" }).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/library_documents`);
    expect(req.request.params.get("folder_id")).toBe("f1");
    expect(req.request.params.get("status")).toBe("active");
    expect(req.request.params.get("q")).toBe("lease");
    req.flush({ documents: [], meta: {} });
  });

  it("create POSTs multipart form data under the library_document[] namespace", () => {
    const file = new File(["x"], "lease.pdf", { type: "application/pdf" });
    service.create({ title: "Lease", file }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/library_documents`);
    expect(req.request.method).toBe("POST");
    const body = req.request.body as FormData;
    expect(body.get("library_document[title]")).toBe("Lease");
    expect(body.has("library_document[file]")).toBe(true);
    req.flush({ document: {} });
  });

  it("update PATCHes multipart form data", () => {
    service.update("d1", { title: "Lease 2026" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/library_documents/d1`);
    expect(req.request.method).toBe("PATCH");
    const body = req.request.body as FormData;
    expect(body.get("library_document[title]")).toBe("Lease 2026");
    req.flush({ document: {} });
  });

  it("update omits null/undefined fields from the form data", () => {
    service.update("d1", { title: "Lease 2026", notes: null, expires_on: undefined }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/library_documents/d1`);
    const body = req.request.body as FormData;
    expect(body.has("library_document[notes]")).toBe(false);
    expect(body.has("library_document[expires_on]")).toBe(false);
    req.flush({ document: {} });
  });

  it("destroy DELETEs the document", () => {
    service.destroy("d1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/library_documents/d1`);
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });

  it("downloadFile GETs the attachment URL as a blob, against API_ORIGIN", () => {
    const doc = { file: { url: "/rails/blobs/abc" } } as unknown as LibraryDocument;
    service.downloadFile(doc).subscribe();
    const req = httpMock.expectOne(`${API_ORIGIN}/rails/blobs/abc`);
    expect(req.request.responseType).toBe("blob");
    req.flush(new Blob());
  });
});
