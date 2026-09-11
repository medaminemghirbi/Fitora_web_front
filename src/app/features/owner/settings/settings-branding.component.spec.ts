import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { API_ORIGIN } from "../../../core/models/api-config";
import { Company } from "../../../core/models/company.model";
import { BrandingService } from "../../../core/services/branding.service";
import { CompanyService } from "../../../core/services/company.service";
import { ToastService } from "../../../core/services/toast.service";
import { SettingsBrandingComponent } from "./settings-branding.component";

describe("SettingsBrandingComponent", () => {
  let fixture: ComponentFixture<SettingsBrandingComponent>;
  let component: SettingsBrandingComponent;
  let companyService: jasmine.SpyObj<CompanyService>;
  let brandingService: jasmine.SpyObj<BrandingService>;
  let toast: ToastService;

  const company = { slug: "acme", primary_color: "#ff0000", logo_url: "/logos/acme.png" } as Company;

  beforeEach(async () => {
    companyService = jasmine.createSpyObj<CompanyService>("CompanyService", ["get", "updateBranding"]);
    brandingService = jasmine.createSpyObj<BrandingService>("BrandingService", ["load"]);
    companyService.get.and.returnValue(of({ company }));

    await TestBed.configureTestingModule({
      imports: [SettingsBrandingComponent, TranslateModule.forRoot()],
      providers: [
        { provide: CompanyService, useValue: companyService },
        { provide: BrandingService, useValue: brandingService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsBrandingComponent);
    component = fixture.componentInstance;
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it("loads the company's branding on init", () => {
    expect(component.form.value.slug).toBe("acme");
    expect(component.logoUrl()).toBe(`${API_ORIGIN}/logos/acme.png`);
    expect(component.loading()).toBe(false);
  });

  it("stops loading even when the fetch fails", () => {
    companyService.get.and.returnValue(throwError(() => new Error("nope")));
    fixture = TestBed.createComponent(SettingsBrandingComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it("onLogoSelected previews the chosen file", (done) => {
    const file = new File(["x"], "logo.png", { type: "image/png" });
    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: [file] });

    component.onLogoSelected({ target: input } as unknown as Event);
    expect(component.selectedLogo()).toBe(file);

    setTimeout(() => {
      expect(component.logoPreview()).toBeTruthy();
      done();
    }, 50);
  });

  it("onLogoSelected clears the preview when no file is chosen", () => {
    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: [] });
    component.onLogoSelected({ target: input } as unknown as Event);
    expect(component.selectedLogo()).toBeNull();
    expect(component.logoPreview()).toBeNull();
  });

  it("submit saves the branding, refreshes the shell, and shows a success toast", () => {
    companyService.updateBranding.and.returnValue(of({ company: { ...company, logo_url: "/logos/new.png" } }));
    component.submit();
    expect(component.saving()).toBe(false);
    expect(component.logoUrl()).toBe(`${API_ORIGIN}/logos/new.png`);
    expect(brandingService.load).toHaveBeenCalled();
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("submit shows the backend error on failure", () => {
    companyService.updateBranding.and.returnValue(throwError(() => new Error("nope")));
    component.submit();
    expect(component.formError()).toBeTruthy();
  });
});
