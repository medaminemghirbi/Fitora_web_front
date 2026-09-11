import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { CompanyService } from "../../../core/services/company.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { ToastService } from "../../../core/services/toast.service";
import { SettingsMobileComponent } from "./settings-mobile.component";

describe("SettingsMobileComponent", () => {
  let fixture: ComponentFixture<SettingsMobileComponent>;
  let component: SettingsMobileComponent;
  let service: jasmine.SpyObj<CompanyService>;
  let confirmService: ConfirmService;
  let toast: ToastService;

  beforeEach(async () => {
    service = jasmine.createSpyObj<CompanyService>("CompanyService", ["get", "getMobileKeyQr", "regenerateMobileKey"]);
    service.get.and.returnValue(of({ company: { mobile_auth_key: "key123" } as never }));
    service.getMobileKeyQr.and.returnValue(of(new Blob(["x"], { type: "image/png" })));

    await TestBed.configureTestingModule({
      imports: [SettingsMobileComponent, TranslateModule.forRoot()],
      providers: [{ provide: CompanyService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsMobileComponent);
    component = fixture.componentInstance;
    confirmService = TestBed.inject(ConfirmService);
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it("loads the mobile key and its QR code on init", () => {
    expect(component.mobileAuthKey()).toBe("key123");
    expect(component.qrUrl()).toBeTruthy();
    expect(component.loading()).toBe(false);
  });

  it("stops loading even when fetching the company fails", () => {
    service.get.and.returnValue(throwError(() => new Error("nope")));
    fixture = TestBed.createComponent(SettingsMobileComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it("ngOnDestroy revokes the QR object URL", () => {
    spyOn(URL, "revokeObjectURL");
    fixture.destroy();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it("copyKey copies the key and flips the copied flag for 2s", fakeAsync(() => {
    spyOn(navigator.clipboard, "writeText").and.resolveTo();
    component.copyKey();
    tick();
    expect(component.copied()).toBe(true);
    tick(2000);
    expect(component.copied()).toBe(false);
  }));

  it("copyKey does nothing without a key", () => {
    component.mobileAuthKey.set(null);
    spyOn(navigator.clipboard, "writeText");
    component.copyKey();
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it("regenerate does nothing when declined", async () => {
    spyOn(confirmService, "ask").and.resolveTo(false);
    await component.regenerate();
    expect(service.regenerateMobileKey).not.toHaveBeenCalled();
  });

  it("regenerate rolls the key and reloads the QR on confirmation", async () => {
    spyOn(confirmService, "ask").and.resolveTo(true);
    service.regenerateMobileKey.and.returnValue(of({ company: { mobile_auth_key: "newkey" } as never }));
    await component.regenerate();
    expect(component.mobileAuthKey()).toBe("newkey");
    expect(component.regenerating()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("regenerate shows an error toast on failure", async () => {
    spyOn(confirmService, "ask").and.resolveTo(true);
    service.regenerateMobileKey.and.returnValue(throwError(() => new Error("nope")));
    await component.regenerate();
    expect(component.regenerating()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("error");
  });
});
