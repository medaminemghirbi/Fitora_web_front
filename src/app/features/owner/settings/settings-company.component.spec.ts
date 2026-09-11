import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Company } from "../../../core/models/company.model";
import { CompanyService } from "../../../core/services/company.service";
import { ToastService } from "../../../core/services/toast.service";
import { SettingsCompanyComponent } from "./settings-company.component";

describe("SettingsCompanyComponent", () => {
  let fixture: ComponentFixture<SettingsCompanyComponent>;
  let component: SettingsCompanyComponent;
  let companyService: jasmine.SpyObj<CompanyService>;
  let toast: ToastService;

  const company = {
    name: "Acme Gym", description: null, phone: null, email: null, country: "TN", city: "Tunis",
    address: null, timezone: "Africa/Tunis", currency: "TND", currency_symbol: "DT", locale: "fr",
  } as Company;

  beforeEach(async () => {
    companyService = jasmine.createSpyObj<CompanyService>("CompanyService", ["get", "update"]);
    companyService.get.and.returnValue(of({ company }));

    await TestBed.configureTestingModule({
      imports: [SettingsCompanyComponent, TranslateModule.forRoot()],
      providers: [{ provide: CompanyService, useValue: companyService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsCompanyComponent);
    component = fixture.componentInstance;
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it("loads and hydrates the company profile on init", () => {
    expect(component.form.value.name).toBe("Acme Gym");
    expect(component.currency()).toBe("TND");
    expect(component.loading()).toBe(false);
  });

  it("falls back to the browser timezone and an empty city when the company has neither", () => {
    companyService.get.and.returnValue(of({ company: { ...company, timezone: "", city: null } }));
    fixture = TestBed.createComponent(SettingsCompanyComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.value.timezone).toBeTruthy();
    expect(fixture.componentInstance.form.value.city).toBe("");
  });

  it("stops loading if the company doesn't exist yet", () => {
    companyService.get.and.returnValue(of({ company: null as unknown as Company }));
    fixture = TestBed.createComponent(SettingsCompanyComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it("stops loading even when the fetch fails", () => {
    companyService.get.and.returnValue(throwError(() => new Error("nope")));
    fixture = TestBed.createComponent(SettingsCompanyComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it("changing the country re-aligns the timezone only after hydration", () => {
    component.form.controls.country.setValue("FR");
    expect(component.form.value.timezone).toContain("Paris");
  });

  it("submit does nothing with an invalid form", () => {
    component.form.controls.name.setValue("");
    component.submit();
    expect(companyService.update).not.toHaveBeenCalled();
  });

  it("submit saves and shows a success toast", () => {
    companyService.update.and.returnValue(of({ company }));
    component.submit();
    expect(component.saving()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("submit shows an error toast on failure", () => {
    companyService.update.and.returnValue(throwError(() => new Error("nope")));
    component.submit();
    expect(toast.toasts()[0].kind).toBe("error");
  });
});
