import { TestBed } from "@angular/core/testing";
import { Router, UrlTree } from "@angular/router";
import { AuthService } from "../auth/auth.service";
import { guestGuard } from "./guest.guard";

describe("guestGuard", () => {
  let authStub: { isAuthenticated: jasmine.Spy; homeRouteForCurrentUser: jasmine.Spy };
  let router: jasmine.SpyObj<Router>;
  let tree: UrlTree;

  beforeEach(() => {
    authStub = {
      isAuthenticated: jasmine.createSpy(),
      homeRouteForCurrentUser: jasmine.createSpy().and.returnValue("/owner/dashboard"),
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

  function run() {
    return TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
  }

  it("allows an anonymous visitor through", () => {
    authStub.isAuthenticated.and.returnValue(false);
    expect(run()).toBe(true);
  });

  it("redirects an already-logged-in user to their home route", () => {
    authStub.isAuthenticated.and.returnValue(true);
    expect(run()).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(["/owner/dashboard"]);
  });
});
