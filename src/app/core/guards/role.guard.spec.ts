import { TestBed } from "@angular/core/testing";
import { Router, UrlTree } from "@angular/router";
import { AuthService } from "../auth/auth.service";
import { roleGuard } from "./role.guard";

describe("roleGuard", () => {
  let authStub: { isAuthenticated: jasmine.Spy; currentUser: jasmine.Spy; homeRouteForCurrentUser: jasmine.Spy };
  let router: jasmine.SpyObj<Router>;
  let tree: UrlTree;

  beforeEach(() => {
    authStub = {
      isAuthenticated: jasmine.createSpy(),
      currentUser: jasmine.createSpy(),
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

  function run(role: "owner" | "admin") {
    return TestBed.runInInjectionContext(() => roleGuard(role)({} as never, {} as never));
  }

  it("allows a user whose role matches", () => {
    authStub.isAuthenticated.and.returnValue(true);
    authStub.currentUser.and.returnValue({ role: "owner" });
    expect(run("owner")).toBe(true);
  });

  it("redirects to login when not authenticated at all", () => {
    authStub.isAuthenticated.and.returnValue(false);
    expect(run("admin")).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(["/pro/connexion"]);
  });

  it("redirects an authenticated user with the wrong role to their home route", () => {
    authStub.isAuthenticated.and.returnValue(true);
    authStub.currentUser.and.returnValue({ role: "staff" });
    expect(run("owner")).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(["/owner/dashboard"]);
  });
});
