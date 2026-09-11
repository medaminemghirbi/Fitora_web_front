import { TestBed } from "@angular/core/testing";
import { Router, UrlTree } from "@angular/router";
import { AuthService } from "../auth/auth.service";
import { companyGuard, noCompanyGuard } from "./company.guard";

describe("company.guard", () => {
  let authStub: { currentUser: jasmine.Spy; homeRouteForCurrentUser: jasmine.Spy };
  let router: jasmine.SpyObj<Router>;
  let tree: UrlTree;

  beforeEach(() => {
    authStub = {
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

  describe("companyGuard", () => {
    function run() {
      return TestBed.runInInjectionContext(() => companyGuard({} as never, {} as never));
    }

    it("lets an owner with a company through", () => {
      authStub.currentUser.and.returnValue({ company_id: "c1" });
      expect(run()).toBe(true);
    });

    it("sends an owner with no company yet to setup", () => {
      authStub.currentUser.and.returnValue({ company_id: null });
      expect(run()).toBe(tree);
      expect(router.createUrlTree).toHaveBeenCalledWith(["/owner/setup-company"]);
    });

    it("treats no current user the same as no company", () => {
      authStub.currentUser.and.returnValue(null);
      expect(run()).toBe(tree);
    });
  });

  describe("noCompanyGuard", () => {
    function run() {
      return TestBed.runInInjectionContext(() => noCompanyGuard({} as never, {} as never));
    }

    it("lets a company-less owner reach the setup page", () => {
      authStub.currentUser.and.returnValue({ company_id: null });
      expect(run()).toBe(true);
    });

    it("redirects an owner who already has a company away from setup", () => {
      authStub.currentUser.and.returnValue({ company_id: "c1" });
      expect(run()).toBe(tree);
      expect(router.createUrlTree).toHaveBeenCalledWith(["/owner/dashboard"]);
    });
  });
});
