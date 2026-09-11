import { TestBed } from "@angular/core/testing";
import { Router, UrlTree } from "@angular/router";
import { AuthService } from "../auth/auth.service";
import { authGuard } from "./auth.guard";

describe("authGuard", () => {
  let authStub: { isAuthenticated: jasmine.Spy };
  let router: jasmine.SpyObj<Router>;
  let tree: UrlTree;

  beforeEach(() => {
    authStub = { isAuthenticated: jasmine.createSpy() };
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
    return TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
  }

  it("allows an authenticated user through", () => {
    authStub.isAuthenticated.and.returnValue(true);
    expect(run()).toBe(true);
  });

  it("redirects to /auth/login when not authenticated", () => {
    authStub.isAuthenticated.and.returnValue(false);
    expect(run()).toBe(tree);
    expect(router.createUrlTree).toHaveBeenCalledWith(["/auth/login"]);
  });
});
