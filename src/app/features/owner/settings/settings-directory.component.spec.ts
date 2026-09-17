import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Company } from "../../../core/models/company.model";
import { CompanyService } from "../../../core/services/company.service";
import { ToastService } from "../../../core/services/toast.service";
import { SettingsDirectoryComponent } from "./settings-directory.component";

describe("SettingsDirectoryComponent", () => {
  let fixture: ComponentFixture<SettingsDirectoryComponent>;
  let component: SettingsDirectoryComponent;
  let companyService: jasmine.SpyObj<CompanyService>;
  let toast: ToastService;

  const company = {
    id: "c1", name: "Power Gym", city: "Tunis", country: "Tunisie", address: "12 rue X",
    description: "Une salle", phone: "+216 20 000000", listed_at: null,
  } as unknown as Company;

  function build(listed: string | null = null): void {
    TestBed.resetTestingModule();
    companyService = jasmine.createSpyObj<CompanyService>("CompanyService", ["get", "publish"]);
    companyService.get.and.returnValue(of({ company: { ...company, listed_at: listed } }));

    TestBed.configureTestingModule({
      imports: [SettingsDirectoryComponent, TranslateModule.forRoot()],
      providers: [{ provide: CompanyService, useValue: companyService }],
    });

    fixture = TestBed.createComponent(SettingsDirectoryComponent);
    component = fixture.componentInstance;
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  }

  it("starts unpublished when the gym has never been listed", () => {
    build();
    expect(component.listed()).toBe(false);
  });

  it("reflects a gym that is already listed", () => {
    build("2026-09-18T10:00:00Z");
    expect(component.listed()).toBe(true);
  });

  it("publishes the gym and says so", () => {
    build();
    companyService.publish.and.returnValue(of({ company: { ...company, listed_at: "2026-09-18T10:00:00Z" } }));

    component.toggle(true);

    expect(companyService.publish).toHaveBeenCalledWith(true);
    expect(component.listed()).toBe(true);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("puts the switch back when the call fails, so it never lies about being listed", () => {
    build();
    companyService.publish.and.returnValue(throwError(() => new Error("nope")));

    component.toggle(true);

    expect(component.listed()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("error");
  });

  it("names what the public page is still missing", () => {
    build();
    companyService.get.and.returnValue(of({ company: { ...company, city: null, description: null } as unknown as Company }));
    fixture = TestBed.createComponent(SettingsDirectoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.missingFields().length).toBe(2);
  });
});
