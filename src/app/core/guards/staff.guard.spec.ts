import { TestBed } from "@angular/core/testing";
import { Router, UrlTree } from "@angular/router";
import { firstValueFrom, isObservable, of, throwError } from "rxjs";
import { AuthService } from "../auth/auth.service";
import { ConfigurationService } from "../configuration/configuration.service";
import { User } from "../models/user.model";
import { capabilityGuard, deskAreaGuard, ownerAreaGuard, settingsAccessGuard, staffManagerGuard, staffRoleGuard } from "./staff.guard";

describe("staff.guard", () => {
  let authStub: {
    isAuthenticated: jasmine.Spy;
    currentUser: jasmine.Spy;
    homeRouteForCurrentUser: jasmine.Spy;
    coachShellApplies: jasmine.Spy;
    hasPermission: jasmine.Spy;
  };
  let configStub: { subscription: jasmine.Spy; ensureLoaded: jasmine.Spy; ready: jasmine.Spy };
  let router: jasmine.SpyObj<Router>;
  let tree: UrlTree;

  beforeEach(() => {
    authStub = {
      currentUser: jasmine.createSpy(),
      isAuthenticated: jasmine.createSpy().and.returnValue(false),
      homeRouteForCurrentUser: jasmine.createSpy().and.returnValue("/owner/dashboard"),
      coachShellApplies: jasmine.createSpy().and.returnValue(false),
      hasPermission: jasmine.createSpy().and.returnValue(false),
    };
    configStub = {
      ensureLoaded: jasmine.createSpy().and.returnValue(of(null)),
      ready: jasmine.createSpy().and.returnValue(true),
      subscription: jasmine.createSpy().and.returnValue({ locked: false }),
    };
    tree = {} as UrlTree;
    router = jasmine.createSpyObj<Router>("Router", ["createUrlTree"]);
    router.createUrlTree.and.returnValue(tree);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authStub },
        { provide: ConfigurationService, useValue: configStub },
        { provide: Router, useValue: router },
      ],
    });
  });

  // The guards return `boolean | UrlTree | Observable<boolean | UrlTree>` —
  // normalize to a promise so every branch can be asserted the same way.
  async function resolve(result: unknown): Promise<boolean | UrlTree> {
    return (isObservable(result) ? firstValueFrom(result) : result) as Promise<boolean | UrlTree> | boolean | UrlTree;
  }

  describe("ownerAreaGuard", () => {
    function run() {
      return TestBed.runInInjectionContext(() => ownerAreaGuard({} as never, {} as never));
    }

    it("redirects to login with no user", async () => {
      authStub.currentUser.and.returnValue(null);
      expect(await resolve(run())).toBe(tree);
      expect(router.createUrlTree).toHaveBeenCalledWith(["/connexion"]);
    });

    it("redirects a platform admin to /admin/companies", async () => {
      authStub.currentUser.and.returnValue({ role: "admin" } as User);
      expect(await resolve(run())).toBe(tree);
      expect(router.createUrlTree).toHaveBeenCalledWith(["/admin/overview"]);
    });

    it("lets an owner/staff login through when the coach shell doesn't apply", async () => {
      authStub.currentUser.and.returnValue({ role: "owner" } as User);
      authStub.coachShellApplies.and.returnValue(false);
      expect(await resolve(run())).toBe(true);
    });

    it("bounces a coach-kind staff login to /coach/today", async () => {
      authStub.currentUser.and.returnValue({ role: "staff", staff_role: "coach", is_coach: true } as User);
      authStub.coachShellApplies.and.returnValue(true);
      expect(await resolve(run())).toBe(tree);
      expect(router.createUrlTree).toHaveBeenCalledWith(["/coach/today"]);
    });

    it("fails open (allows through) when the bootstrap load errors", async () => {
      authStub.currentUser.and.returnValue({ role: "owner" } as User);
      configStub.ensureLoaded.and.returnValue(throwError(() => new Error("network")));
      expect(await resolve(run())).toBe(true);
    });
  });

  describe("capabilityGuard", () => {
    function run(permission: string) {
      return TestBed.runInInjectionContext(() => capabilityGuard(permission)({} as never, {} as never));
    }

    it("redirects to login with no user", async () => {
      authStub.currentUser.and.returnValue(null);
      expect(await resolve(run("clients"))).toBe(tree);
    });

    it("allows through when the config hasn't hydrated yet (fail open)", async () => {
      authStub.currentUser.and.returnValue({ role: "staff" } as User);
      configStub.ready.and.returnValue(false);
      expect(await resolve(run("clients"))).toBe(true);
    });

    it("allows a staff login that has the permission", async () => {
      authStub.currentUser.and.returnValue({ role: "staff" } as User);
      authStub.hasPermission.and.returnValue(true);
      expect(await resolve(run("clients"))).toBe(true);
    });

    it("redirects a staff login without the permission to their home route", async () => {
      authStub.currentUser.and.returnValue({ role: "staff" } as User);
      authStub.hasPermission.and.returnValue(false);
      expect(await resolve(run("clients"))).toBe(tree);
      expect(router.createUrlTree).toHaveBeenCalledWith(["/owner/dashboard"]);
    });

    it("fails open (allows through) when the bootstrap load errors", async () => {
      authStub.currentUser.and.returnValue({ role: "staff" } as User);
      configStub.ensureLoaded.and.returnValue(throwError(() => new Error("network")));
      expect(await resolve(run("clients"))).toBe(true);
    });
  });

  describe("settingsAccessGuard", () => {
    function run() {
      return TestBed.runInInjectionContext(() => settingsAccessGuard({} as never, {} as never));
    }

    it("redirects to login with no user", async () => {
      authStub.currentUser.and.returnValue(null);
      expect(await resolve(run())).toBe(tree);
    });

    it("allows the owner through regardless of permissions", async () => {
      authStub.currentUser.and.returnValue({ role: "owner" } as User);
      expect(await resolve(run())).toBe(true);
    });

    it("allows a staff login with the activities capability", async () => {
      authStub.currentUser.and.returnValue({ role: "staff" } as User);
      authStub.hasPermission.and.callFake((k: string) => k === "activities");
      expect(await resolve(run())).toBe(true);
    });

    it("allows a staff login with the contract_types capability", async () => {
      authStub.currentUser.and.returnValue({ role: "staff" } as User);
      authStub.hasPermission.and.callFake((k: string) => k === "contract_types");
      expect(await resolve(run())).toBe(true);
    });

    it("bounces a plain receptionist home", async () => {
      authStub.currentUser.and.returnValue({ role: "staff" } as User);
      authStub.hasPermission.and.returnValue(false);
      expect(await resolve(run())).toBe(tree);
    });

    it("fails open (allows through) when the bootstrap load errors", async () => {
      authStub.currentUser.and.returnValue({ role: "staff" } as User);
      configStub.ensureLoaded.and.returnValue(throwError(() => new Error("network")));
      expect(await resolve(run())).toBe(true);
    });
  });

  describe("staffManagerGuard", () => {
    it("redirects to login with no user", () => {
      authStub.currentUser.and.returnValue(null);
      expect(TestBed.runInInjectionContext(() => staffManagerGuard({} as never, {} as never))).toBe(tree);
    });

    it("allows the owner", () => {
      authStub.currentUser.and.returnValue({ role: "owner" } as User);
      expect(TestBed.runInInjectionContext(() => staffManagerGuard({} as never, {} as never))).toBe(true);
    });

    it("bounces any non-owner home", () => {
      authStub.currentUser.and.returnValue({ role: "staff" } as User);
      expect(TestBed.runInInjectionContext(() => staffManagerGuard({} as never, {} as never))).toBe(tree);
    });
  });

  describe("staffRoleGuard", () => {
    function run() {
      return TestBed.runInInjectionContext(() => staffRoleGuard("coach")({} as never, {} as never));
    }

    it("redirects to login with no user", async () => {
      authStub.currentUser.and.returnValue(null);
      expect(await resolve(run())).toBe(tree);
    });

    it("bounces home a staff login of the wrong kind", async () => {
      authStub.currentUser.and.returnValue({ role: "staff", staff_role: "receptionist", is_coach: false } as User);
      expect(await resolve(run())).toBe(tree);
      expect(router.createUrlTree).toHaveBeenCalledWith(["/owner/dashboard"]);
    });

    it("bounces home a non-staff user even with a matching staff_role field", async () => {
      authStub.currentUser.and.returnValue({ role: "owner", staff_role: "coach", is_coach: true } as User);
      expect(await resolve(run())).toBe(tree);
    });

    it("lets a coach into the coach shell once the coach module applies", async () => {
      authStub.currentUser.and.returnValue({ role: "staff", staff_role: "coach", is_coach: true } as User);
      authStub.coachShellApplies.and.returnValue(true);
      expect(await resolve(run())).toBe(true);
    });

    it("sends a coach-kind login without the coach module to the owner dashboard", async () => {
      authStub.currentUser.and.returnValue({ role: "staff", staff_role: "coach", is_coach: true } as User);
      authStub.coachShellApplies.and.returnValue(false);
      expect(await resolve(run())).toBe(tree);
      expect(router.createUrlTree).toHaveBeenCalledWith(["/owner/dashboard"]);
    });

    it("fails open (allows through) when the bootstrap load errors", async () => {
      authStub.currentUser.and.returnValue({ role: "staff", staff_role: "coach", is_coach: true } as User);
      configStub.ensureLoaded.and.returnValue(throwError(() => new Error("network")));
      expect(await resolve(run())).toBe(true);
    });
  });

  // A signed-in member has an account, just not one for this half. Sending
  // them to the sign-in page would send them straight back here.
  describe("a signed-in member reaching a staff page", () => {
    it("goes to their own home, not to the sign-in page", () => {
      authStub.currentUser.and.returnValue(null);
      authStub.isAuthenticated.and.returnValue(true);
      authStub.homeRouteForCurrentUser.and.returnValue("/member/home");

      TestBed.runInInjectionContext(() => ownerAreaGuard({} as never, {} as never));

      expect(router.createUrlTree).toHaveBeenCalledWith(["/member/home"]);
    });
  });

  // A locked gym gets one page and no navigation — caught here rather than
  // waiting for a request to come back 402 and empty a loaded screen.
  describe("a gym whose access is closed", () => {
    it("never reaches the owner area", async () => {
      authStub.currentUser.and.returnValue({ role: "owner" } as User);
      configStub.subscription.and.returnValue({ locked: true });

      const result = TestBed.runInInjectionContext(() => ownerAreaGuard({} as never, {} as never));
      const resolved = isObservable(result) ? await firstValueFrom(result) : result;

      expect(resolved).toBe(tree);
      expect(router.createUrlTree).toHaveBeenCalledWith(["/account-locked"]);
    });

    it("lets an unlocked gym straight through", async () => {
      authStub.currentUser.and.returnValue({ role: "owner" } as User);
      configStub.subscription.and.returnValue({ locked: false });

      const result = TestBed.runInInjectionContext(() => ownerAreaGuard({} as never, {} as never));
      const resolved = isObservable(result) ? await firstValueFrom(result) : result;

      expect(resolved).toBe(true);
    });
  });

  describe("deskAreaGuard", () => {
    function run() {
      return TestBed.runInInjectionContext(() => deskAreaGuard({} as never, {} as never));
    }

    function deskStaff() {
      authStub.currentUser.and.returnValue({ role: "staff", is_coach: false } as User);
      authStub.hasPermission.and.callFake((p: string) => p === "checkin" || p === "bookings");
    }

    it("redirects to login with no user", async () => {
      authStub.currentUser.and.returnValue(null);

      expect(await resolve(run())).toBe(tree);
      expect(router.createUrlTree).toHaveBeenCalledWith(["/connexion"]);
    });

    it("lets in staff who can check people in and book them", async () => {
      deskStaff();

      expect(await resolve(run())).toBe(true);
    });

    it("turns away staff who can check in but not book — that is a coach", async () => {
      authStub.currentUser.and.returnValue({ role: "staff", is_coach: false } as User);
      authStub.hasPermission.and.callFake((p: string) => p === "checkin");

      expect(await resolve(run())).toBe(tree);
      expect(router.createUrlTree).toHaveBeenCalledWith(["/owner/dashboard"]);
    });

    it("turns away a coach even when their role grants both", async () => {
      authStub.currentUser.and.returnValue({ role: "staff", is_coach: true } as User);
      authStub.hasPermission.and.returnValue(true);

      expect(await resolve(run())).toBe(tree);
    });

    it("turns away an owner — their own shell is a superset of the desk", async () => {
      authStub.currentUser.and.returnValue({ role: "owner", is_coach: false } as User);
      authStub.hasPermission.and.returnValue(true);

      expect(await resolve(run())).toBe(tree);
    });

    it("turns away a platform admin", async () => {
      authStub.currentUser.and.returnValue({ role: "admin", is_coach: false } as User);
      authStub.hasPermission.and.returnValue(true);

      expect(await resolve(run())).toBe(tree);
    });

    it("sends a locked company to the locked screen before anything else", async () => {
      deskStaff();
      configStub.subscription.and.returnValue({ locked: true });

      expect(await resolve(run())).toBe(tree);
      expect(router.createUrlTree).toHaveBeenCalledWith(["/account-locked"]);
    });

    it("lets staff through before permissions have loaded rather than bouncing them", async () => {
      authStub.currentUser.and.returnValue({ role: "staff", is_coach: false } as User);
      authStub.hasPermission.and.returnValue(false);
      configStub.ready.and.returnValue(false);

      expect(await resolve(run())).toBe(true);
    });

    it("fails open when the bootstrap load errors", async () => {
      deskStaff();
      configStub.ensureLoaded.and.returnValue(throwError(() => new Error("offline")));

      expect(await resolve(run())).toBe(true);
    });
  });
});
