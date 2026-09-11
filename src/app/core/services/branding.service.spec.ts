import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { BrandingService, CompanyBranding } from "./branding.service";

describe("BrandingService", () => {
  let service: BrandingService;
  let httpMock: HttpTestingController;

  const branding: CompanyBranding = {
    name: "Acme Gym",
    primary_color: "#ff0000",
    logo_url: "/logos/acme.png",
    locale: "fr",
    currency: "EUR",
    currency_symbol: "€",
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(BrandingService);
    httpMock = TestBed.inject(HttpTestingController);
    document.documentElement.style.removeProperty("--color-primary");
  });

  afterEach(() => {
    httpMock.verify();
    document.documentElement.style.removeProperty("--color-primary");
  });

  it("load() GETs /branding and applies the result", () => {
    service.load();
    const req = httpMock.expectOne(`${API_BASE_URL}/branding`);
    expect(req.request.method).toBe("GET");
    req.flush({ branding });

    expect(service.branding()).toEqual(branding);
  });

  it("load() failing keeps the default (null) branding", () => {
    service.load();
    const req = httpMock.expectOne(`${API_BASE_URL}/branding`);
    req.error(new ProgressEvent("error"));

    expect(service.branding()).toBeNull();
  });

  it("apply() sets the signal and the primary-color CSS variables", () => {
    service.apply(branding);
    expect(service.branding()).toEqual(branding);
    expect(document.documentElement.style.getPropertyValue("--color-primary")).toBe("#ff0000");
  });

  it("apply() skips CSS variables when there is no primary_color", () => {
    service.apply({ ...branding, primary_color: null });
    expect(document.documentElement.style.getPropertyValue("--color-primary")).toBe("");
  });

  it("logoUrl() prefixes the logo path with API_ORIGIN", () => {
    service.apply(branding);
    expect(service.logoUrl()).toContain("/logos/acme.png");
  });

  it("logoUrl() returns null when there is no logo", () => {
    service.apply({ ...branding, logo_url: null });
    expect(service.logoUrl()).toBeNull();
  });

  it("logoUrl() accepts an explicit branding argument", () => {
    expect(service.logoUrl(branding)).toContain("/logos/acme.png");
  });
});
