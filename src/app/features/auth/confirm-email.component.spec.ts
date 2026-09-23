import { HttpErrorResponse } from "@angular/common/http";
import { signal } from "@angular/core";
import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AccountRecoveryService } from "../../core/auth/account-recovery.service";
import { AuthService } from "../../core/auth/auth.service";
import { User } from "../../core/models/user.model";
import {
  CONTINUE_DELAY_MS,
  ConfirmEmailComponent,
  POLL_MS,
  RESEND_COOLDOWN_SECONDS,
  mailboxFor,
} from "./confirm-email.component";

describe("ConfirmEmailComponent", () => {
  let fixture: ComponentFixture<ConfirmEmailComponent>;
  let component: ConfirmEmailComponent;
  let recovery: jasmine.SpyObj<AccountRecoveryService>;
  let router: Router;
  let user: ReturnType<typeof signal<User | null>>;
  let authStub: {
    currentUser: () => User | null;
    fetchCurrentUser: jasmine.Spy;
    loadConfiguration: jasmine.Spy;
    homeRouteForCurrentUser: jasmine.Spy;
    logout: jasmine.Spy;
  };

  const pending: User = {
    id: "u1", first_name: "A", last_name: "M", full_name: "A M", email: "amine@gmail.com", phone: null,
    role: "owner", locale: "fr", email_verified: false, email_verification_resend_in: 0,
    company_id: null, staff_role: null, is_coach: false,
  };

  function build(patch: Partial<User> = {}): void {
    TestBed.resetTestingModule();
    user = signal<User | null>({ ...pending, ...patch });
    recovery = jasmine.createSpyObj<AccountRecoveryService>("AccountRecoveryService", ["resendVerification"]);
    recovery.resendVerification.and.returnValue(of(undefined));
    authStub = {
      currentUser: () => user(),
      fetchCurrentUser: jasmine.createSpy().and.callFake(() => of(user()!)),
      loadConfiguration: jasmine.createSpy(),
      homeRouteForCurrentUser: jasmine.createSpy().and.returnValue("/owner/dashboard"),
      logout: jasmine.createSpy(),
    };

    TestBed.configureTestingModule({
      imports: [ConfirmEmailComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: AccountRecoveryService, useValue: recovery },
        { provide: AuthService, useValue: authStub },
      ],
    });

    router = TestBed.inject(Router);
    spyOn(router, "navigateByUrl").and.resolveTo(true);
    fixture = TestBed.createComponent(ConfirmEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => fixture?.destroy());

  it("says where the link went", () => {
    build();
    expect(fixture.nativeElement.querySelector(".auth-subtitle b").textContent).toContain("amine@gmail.com");
  });

  it("offers a button straight to the inbox for a big webmail", () => {
    build();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector("a.btn-primary");
    expect(link.getAttribute("href")).toContain("mail.google.com");
  });

  it("knows the big webmails, and nothing else", () => {
    expect(mailboxFor("a@hotmail.fr")?.name).toBe("Outlook");
    expect(mailboxFor("a@yahoo.fr")?.name).toBe("Yahoo Mail");
    expect(mailboxFor("a@my-gym.tn")).toBeNull();
  });

  // The link can be clicked on a phone: this screen must notice by itself.
  it("asks every few seconds and moves on once the link is clicked", fakeAsync(() => {
    build();

    tick(POLL_MS);
    expect(authStub.fetchCurrentUser).toHaveBeenCalledTimes(1);
    expect(component.phase()).toBe("waiting");

    user.set({ ...pending, email_verified: true });
    tick(POLL_MS);
    expect(component.phase()).toBe("confirmed");
    expect(component.stage()).toBe("confirmed");
    expect(authStub.loadConfiguration).toHaveBeenCalled();

    tick(CONTINUE_DELAY_MS);
    expect(router.navigateByUrl).toHaveBeenCalledWith("/owner/setup-company");

    // Stops asking once there is nothing left to wait for.
    const calls = authStub.fetchCurrentUser.calls.count();
    tick(POLL_MS * 3);
    expect(authStub.fetchCurrentUser.calls.count()).toBe(calls);
  }));

  it("checks at once when the tab comes back into focus", fakeAsync(() => {
    build();
    window.dispatchEvent(new Event("focus"));
    expect(authStub.fetchCurrentUser).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));

  it("lets the owner skip the wait once confirmed", fakeAsync(() => {
    build();
    user.set({ ...pending, email_verified: true });
    component.check();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector("button.btn-primary") as HTMLButtonElement).click();
    expect(router.navigateByUrl).toHaveBeenCalledWith("/owner/setup-company");

    // …and does not navigate a second time when the delay runs out.
    tick(CONTINUE_DELAY_MS);
    expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
  }));

  describe("sending the link again", () => {
    it("sends, says only the newest works, and counts down before the next one", fakeAsync(() => {
      build();
      component.resend();
      fixture.detectChanges();

      expect(recovery.resendVerification).toHaveBeenCalled();
      expect(component.notice()).toBe("sent");
      expect(component.stage()).toBe("sending");
      expect(component.resendIn()).toBe(RESEND_COOLDOWN_SECONDS);

      tick(1000);
      expect(component.resendIn()).toBe(RESEND_COOLDOWN_SECONDS - 1);

      component.resend();
      expect(recovery.resendVerification).toHaveBeenCalledTimes(1);

      tick(RESEND_COOLDOWN_SECONDS * 1000);
      expect(component.resendIn()).toBe(0);
      discardPeriodicTasks();
    }));

    // A reload must not hand out a fresh sixty seconds.
    it("picks the countdown up where the server says it is", fakeAsync(() => {
      build({ email_verification_resend_in: 42 });
      expect(component.resendIn()).toBe(42);
      discardPeriodicTasks();
    }));

    it("takes the server's word when it says it is too soon", fakeAsync(() => {
      build();
      recovery.resendVerification.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 429, error: { error: "too_soon", retry_in: 17 } }))
      );
      component.resend();
      expect(component.resendIn()).toBe(17);
      expect(component.notice()).toBeNull();
      discardPeriodicTasks();
    }));

    it("checks instead when the address was confirmed in the meantime", fakeAsync(() => {
      build();
      recovery.resendVerification.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 422, error: { error: "already_verified" } }))
      );
      user.set({ ...pending, email_verified: true });
      component.resend();
      expect(component.phase()).toBe("confirmed");
      tick(CONTINUE_DELAY_MS);
    }));
  });

  it("starts sign-up over for a mistyped address", fakeAsync(() => {
    build();
    component.restart();
    expect(authStub.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith("/inscription");
  }));
});
