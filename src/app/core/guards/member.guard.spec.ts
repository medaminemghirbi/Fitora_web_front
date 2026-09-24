import { TestBed } from "@angular/core/testing";
import { Router, UrlTree } from "@angular/router";
import { AuthService } from "../auth/auth.service";
import { memberGuard } from "./member.guard";

describe("memberGuard", () => {
  let authStub: { isAuthenticated: jasmine.Spy; isClient: jasmine.Spy; homeRouteForCurrentUser: jasmine.Spy };
  let router: jasmine.SpyObj<Router>;
  let tree: UrlTree;

  beforeEach(() => {
    authStub = {
      isAuthenticated: jasmine.createSpy(),
      isClient: jasmine.createSpy(),
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

  function run() {
    return TestBed.runInInjectionContext(() => memberGuard({} as never, {} as never));
  }

  it("allows an authenticated client session", () => {
    authStub.isAuthenticated.and.returnValue(true);
    authStub.isClient.and.returnValue(true);
    expect(run()).toBe(true);
  });

  it("redirects to login when not authenticated at all", () => {
    authStub.isAuthenticated.and.returnValue(false);
    expect(run()).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(["/connexion"]);
  });

  it("redirects a non-client session (e.g. admin) to their own home route", () => {
    authStub.isAuthenticated.and.returnValue(true);
    authStub.isClient.and.returnValue(false);
    expect(run()).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(["/admin/dashboard"]);
  });
});
