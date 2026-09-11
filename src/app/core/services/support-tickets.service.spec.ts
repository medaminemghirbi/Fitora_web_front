import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { SupportTicketsService } from "./support-tickets.service";

describe("SupportTicketsService", () => {
  let service: SupportTicketsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SupportTicketsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("list GETs /support_tickets", () => {
    service.list().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/support_tickets`);
    expect(req.request.method).toBe("GET");
    req.flush({ support_tickets: [] });
  });

  it("create POSTs multipart form data with subject/message/attachments", () => {
    const file = new File(["x"], "screenshot.png", { type: "image/png" });
    service.create("Bug", "It broke", [file]).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/support_tickets`);
    expect(req.request.method).toBe("POST");
    const body = req.request.body as FormData;
    expect(body.get("subject")).toBe("Bug");
    expect(body.get("message")).toBe("It broke");
    expect(body.getAll("attachments[]").length).toBe(1);
    req.flush({ support_ticket: {} });
  });
});
