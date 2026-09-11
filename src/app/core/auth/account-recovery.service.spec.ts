import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { AccountRecoveryService } from "./account-recovery.service";

describe("AccountRecoveryService", () => {
  let service: AccountRecoveryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AccountRecoveryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("requestPasswordReset POSTs the email", () => {
    service.requestPasswordReset("s@x.test").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/password_resets`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ email: "s@x.test" });
    req.flush(null);
  });

  it("resetPassword PATCHes the token with the new password", () => {
    service.resetPassword("tok123", "newpass").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/password_resets/tok123`);
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ password: "newpass" });
    req.flush(null);
  });

  it("verifyEmail PATCHes the verification token", () => {
    service.verifyEmail("tok456").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/email_verifications/tok456`);
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({});
    req.flush(null);
  });

  it("resendVerification POSTs with no body", () => {
    service.resendVerification().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/email_verifications`);
    expect(req.request.method).toBe("POST");
    req.flush(null);
  });
});
