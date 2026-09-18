import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AuthService } from "../../core/auth/auth.service";
import { ConfigurationService } from "../../core/configuration/configuration.service";
import { SubscriptionInfo, SubscriptionService } from "../../core/services/subscription.service";
import { AccountLockedComponent } from "./account-locked.component";

describe("AccountLockedComponent", () => {
  let fixture: ComponentFixture<AccountLockedComponent>;
  let component: AccountLockedComponent;
  let authStub: { logout: jasmine.Spy; currentUser: jasmine.Spy };
  let subscriptions: jasmine.SpyObj<SubscriptionService>;

  function build(role = "owner", lockReason: string | null = "payment_overdue"): void {
    TestBed.resetTestingModule();
    authStub = {
      logout: jasmine.createSpy("logout"),
      currentUser: jasmine.createSpy("currentUser").and.returnValue({ role, email: "o@x.test" }),
    };
    subscriptions = jasmine.createSpyObj<SubscriptionService>("SubscriptionService", ["requestUpgrade"]);
    subscriptions.requestUpgrade.and.returnValue(of({} as SubscriptionInfo));

    TestBed.configureTestingModule({
      imports: [AccountLockedComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authStub },
        { provide: SubscriptionService, useValue: subscriptions },
        { provide: ConfigurationService, useValue: { subscription: () => ({ lock_reason: lockReason }) } },
      ],
    });

    fixture = TestBed.createComponent(AccountLockedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it("names the reason the door is shut", () => {
    build("owner", "payment_overdue");
    expect(component.reason()).toBe("payment_overdue");
  });

  it("falls back to the general case rather than showing nothing", () => {
    build("owner", null);
    expect(component.reason()).toBe("suspended");
  });

  // Asking to be activated is how the lock gets lifted, so it cannot live
  // behind the door it closed.
  it("lets the owner ask for activation from here, with no period to choose", () => {
    build("owner");

    component.ask();

    expect(subscriptions.requestUpgrade).toHaveBeenCalledWith();
    expect(component.requested()).toBe(true);
  });

  it("refuses a second request while one is in flight", () => {
    build("owner");
    component.requesting.set(true);

    component.ask();

    expect(subscriptions.requestUpgrade).not.toHaveBeenCalled();
  });

  it("stays asking when the request fails, rather than claiming it was sent", () => {
    build("owner");
    subscriptions.requestUpgrade.and.returnValue(throwError(() => new Error("nope")));

    component.ask();

    expect(component.requested()).toBe(false);
    expect(component.requesting()).toBe(false);
  });

  it("gives staff no action — the money is not theirs to settle", () => {
    build("staff");
    expect(component.isOwner()).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain("locked.ask");
  });

  it("logout delegates to AuthService", () => {
    build();
    component.logout();
    expect(authStub.logout).toHaveBeenCalled();
  });
});
