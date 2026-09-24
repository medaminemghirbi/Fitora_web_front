import { TestBed } from "@angular/core/testing";
import { Router, UrlTree } from "@angular/router";
import { AuthService } from "../auth/auth.service";
import { emailConfirmedGuard, emailPendingGuard } from "./email.guard";

describe("email.guard", () => {
  let authStub: { emailConfirmationPending: jasmine.Spy; homeRouteForCurrentUser: jasmine.Spy };
  let router: jasmine.SpyObj<Router>;
  let tree: UrlTree;

  beforeEach(() => {
    authStub = {
      emailConfirmationPending: jasmine.createSpy(),
      homeRouteForCurrentUser: jasmine.createSpy().and.returnValue("/admin/dashboard"),
    };
    tree = {} as UrlTree;
    router = jasmine.createSpyObj<Router>("Router", ["createUrlTree"]);
    router.createUrlTree.and.returnValue(tree);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authStub },
        { provide: Router, useValue: router },
      ],
    });
  });

  describe("emailConfirmedGuard", () => {
    const run = () => TestBed.runInInjectionContext(() => emailConfirmedGuard({} as never, {} as never));

    it("sends an admin with an unconfirmed address to the waiting screen", () => {
      authStub.emailConfirmationPending.and.returnValue(true);
      expect(run()).toBe(tree);
      expect(router.createUrlTree).toHaveBeenCalledWith(["/confirmation-email"]);
    });

    it("lets everyone else through", () => {
      authStub.emailConfirmationPending.and.returnValue(false);
      expect(run()).toBe(true);
    });
  });

  describe("emailPendingGuard", () => {
    const run = () => TestBed.runInInjectionContext(() => emailPendingGuard({} as never, {} as never));

    it("opens the waiting screen while the address is unconfirmed", () => {
      authStub.emailConfirmationPending.and.returnValue(true);
      expect(run()).toBe(true);
    });

    it("sends someone already confirmed home instead", () => {
      authStub.emailConfirmationPending.and.returnValue(false);
      expect(run()).toBe(tree);
      expect(router.createUrlTree).toHaveBeenCalledWith(["/admin/dashboard"]);
    });
  });
});
