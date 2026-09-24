import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed, fakeAsync, tick } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { DataExchangeService, IMPORT_POLL_MS, ImportResult } from "./data-exchange.service";

describe("DataExchangeService", () => {
  let service: DataExchangeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(DataExchangeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("template GETs a CSV blob for the entity", () => {
    service.template("clients").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/data_exchange/clients/template`);
    expect(req.request.method).toBe("GET");
    expect(req.request.responseType).toBe("blob");
    req.flush(new Blob());
  });

  it("export GETs a CSV blob for the entity", () => {
    service.export("payments").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/data_exchange/payments/export`);
    expect(req.request.method).toBe("GET");
    expect(req.request.responseType).toBe("blob");
    req.flush(new Blob());
  });

  it("import POSTs the file as multipart form data", () => {
    const file = new File(["a,b\n1,2"], "import.csv", { type: "text/csv" });
    service.import("activities", file).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/data_exchange/activities/import`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body instanceof FormData).toBe(true);
    expect((req.request.body as FormData).get("file")).toBe(file);
    req.flush({ id: "imp-1", status: "done", finished: true, created: 1, errors: [], message: null });
  });

  it("import follows a background import to its result", fakeAsync(() => {
    const file = new File(["a,b\n1,2"], "import.csv", { type: "text/csv" });
    let result: ImportResult | undefined;
    service.import("clients", file).subscribe((r) => (result = r));

    httpMock
      .expectOne(`${API_BASE_URL}/data_exchange/clients/import`)
      .flush({ id: "imp-1", status: "queued", finished: false, created: 0, errors: [], message: null });
    expect(result).toBeUndefined();

    tick(IMPORT_POLL_MS);
    httpMock
      .expectOne(`${API_BASE_URL}/data_exchange/imports/imp-1`)
      .flush({ id: "imp-1", status: "done", finished: true, created: 3, errors: [{ row: 4, message: "bad" }], message: null });

    expect(result).toEqual({ created: 3, errors: [{ row: 4, message: "bad" }] });
  }));

  it("import errors with the backend's reason when the import failed", fakeAsync(() => {
    const file = new File(["x"], "import.csv", { type: "text/csv" });
    let message = "";
    service.import("clients", file).subscribe({ error: (err) => (message = err.error.error) });

    httpMock
      .expectOne(`${API_BASE_URL}/data_exchange/clients/import`)
      .flush({ id: "imp-2", status: "failed", finished: true, created: 0, errors: [], message: "Split the file." });

    expect(message).toBe("Split the file.");
  }));
});
