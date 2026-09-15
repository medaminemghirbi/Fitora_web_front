import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { DataExchangeService } from "./data-exchange.service";

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
    req.flush({ created: 1, errors: [] });
  });
});
