import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";
import { ConfigurationService } from "../../core/configuration/configuration.service";
import { AccountLockedComponent } from "./account-locked.component";

describe("AccountLockedComponent", () => {
  let fixture: ComponentFixture<AccountLockedComponent>;
  let component: AccountLockedComponent;
  let authStub: { logout: jasmine.Spy; currentUser: jasmine.Spy };

  function build(role = "owner", lockReason: string | null = "unpaid"): void {
    TestBed.resetTestingModule();
    authStub = {
      logout: jasmine.createSpy("logout"),
      currentUser: jasmine.createSpy("currentUser").and.returnValue({ role, email: "o@x.test" }),
    };

    TestBed.configureTestingModule({
      imports: [AccountLockedComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: ConfigurationService, useValue: { subscription: () => ({ lock_reason: lockReason }) } },
      ],
    });

    fixture = TestBed.createComponent(AccountLockedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it("names which of the two reasons shut the door", () => {
    build("owner", "unpaid");
    expect(component.reason()).toBe("unpaid");

    build("owner", "suspended");
    expect(component.reason()).toBe("suspended");
  });

  it("falls back to suspended rather than showing nothing", () => {
    build("owner", null);
    expect(component.reason()).toBe("suspended");
  });

  // There is nothing to ask for any more: a gym settles with Fitora. What it
  // can still do is read what it owes, so that is the only link.
  it("sends the owner to their invoices, the one place that helps", () => {
    build("owner");
    const link: HTMLAnchorElement | null = fixture.nativeElement.querySelector("a[href]");
    expect(link?.getAttribute("href")).toBe("/owner/subscription");
  });

  it("gives staff no link at all — the money is not theirs to settle", () => {
    build("staff");
    expect(component.isOwner()).toBe(false);
    expect(fixture.nativeElement.querySelector("a[href]")).toBeNull();
  });

  it("logout delegates to AuthService", () => {
    build();
    component.logout();
    expect(authStub.logout).toHaveBeenCalled();
  });
});
