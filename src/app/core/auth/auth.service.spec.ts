import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { ConfigurationService } from "../configuration/configuration.service";
import { API_BASE_URL } from "../models/api-config";
import { User } from "../models/user.model";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  let configStub: {
    permissions: jasmine.Spy;
    role: jasmine.Spy;
    setup: jasmine.Spy;
    hasPermission: jasmine.Spy;
    load: jasmine.Spy;
    clear: jasmine.Spy;
    connectAdminNotifications: jasmine.Spy;
  };

  const owner: User = {
    id: "u1", first_name: "S", last_name: "O", full_name: "S O", email: "s@x.test", phone: null,
    role: "owner", locale: "fr", email_verified: true, company_id: "c1", staff_role: null,
  };

  function buildService(): AuthService {
    router = jasmine.createSpyObj<Router>("Router", ["navigate"]);
    configStub = {
      permissions: jasmine.createSpy().and.returnValue([]),
      role: jasmine.createSpy().and.returnValue(null),
      setup: jasmine.createSpy().and.returnValue(null),
      hasPermission: jasmine.createSpy().and.returnValue(false),
      load: jasmine.createSpy().and.returnValue({ subscribe: (o: { error?: () => void }) => o }),
      clear: jasmine.createSpy(),
      connectAdminNotifications: jasmine.createSpy(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
        { provide: ConfigurationService, useValue: configStub },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  }

  afterEach(() => {
    localStorage.clear();
    httpMock?.verify();
  });

  describe("hydration from localStorage", () => {
    it("starts unauthenticated with nothing stored", () => {
      localStorage.clear();
      const auth = buildService();
      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.currentUser()).toBeNull();
    });

    it("restores the stored user on construction", () => {
      localStorage.setItem("fitora_user", JSON.stringify(owner));
      const auth = buildService();
      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.currentUser()).toEqual(owner);
      expect(auth.isOwner()).toBe(true);
      expect(auth.isAdmin()).toBe(false);
      expect(auth.isStaff()).toBe(false);
    });

    it("tolerates corrupt JSON in storage", () => {
      localStorage.setItem("fitora_user", "{not json");
      const auth = buildService();
      expect(auth.currentUser()).toBeNull();
    });

    it("tolerates corrupt JSON in the impersonator stash", () => {
      localStorage.setItem("fitora_impersonator", "{not json");
      const auth = buildService();
      expect(auth.isImpersonating()).toBe(false);
    });
  });

  describe("login / register", () => {
    it("login POSTs credentials and stores the session", () => {
      const auth = buildService();
      let result: unknown;
      auth.login("s@x.test", "secret").subscribe((res) => (result = res));

      const req = httpMock.expectOne(`${API_BASE_URL}/auth/login`);
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual({ email: "s@x.test", password: "secret" });
      req.flush({ token: "tok123", user: owner });

      expect(result).toEqual({ token: "tok123", user: owner });
      expect(auth.getToken()).toBe("tok123");
      expect(auth.currentUser()).toEqual(owner);
      expect(configStub.load).toHaveBeenCalled();
    });

    it("login stores a session for a user with no company_id (e.g. a platform admin)", () => {
      const auth = buildService();
      const admin: User = { ...owner, id: "admin1", role: "admin", company_id: null as unknown as string };
      auth.login("admin@x.test", "secret").subscribe();
      const req = httpMock.expectOne(`${API_BASE_URL}/auth/login`);
      req.flush({ token: "admin-tok", user: admin });
      expect(auth.currentUser()).toEqual(admin);
    });

    it("register POSTs the payload and stores the session", () => {
      const auth = buildService();
      auth.register({ first_name: "S", last_name: "O", email: "s@x.test", password: "secret" }).subscribe();

      const req = httpMock.expectOne(`${API_BASE_URL}/auth/register`);
      expect(req.request.method).toBe("POST");
      req.flush({ token: "tok456", user: owner });

      expect(auth.getToken()).toBe("tok456");
    });
  });

  describe("hasPermission", () => {
    it("is false with no current user", () => {
      const auth = buildService();
      expect(auth.hasPermission("clients")).toBe(false);
    });

    it("is always true for a platform admin", () => {
      localStorage.setItem("fitora_user", JSON.stringify({ ...owner, role: "admin" }));
      const auth = buildService();
      expect(auth.hasPermission("anything")).toBe(true);
      expect(configStub.hasPermission).not.toHaveBeenCalled();
    });

    it("delegates to ConfigurationService for anyone else", () => {
      localStorage.setItem("fitora_user", JSON.stringify(owner));
      const auth = buildService();
      configStub.hasPermission.and.returnValue(true);
      expect(auth.hasPermission("payments")).toBe(true);
      expect(configStub.hasPermission).toHaveBeenCalledWith("payments");
    });
  });

  describe("logout", () => {
    it("clears the session and navigates to login", () => {
      localStorage.setItem("fitora_user", JSON.stringify(owner));
      localStorage.setItem("fitora_token", "tok");
      const auth = buildService();

      auth.logout();

      expect(auth.currentUser()).toBeNull();
      expect(localStorage.getItem("fitora_token")).toBeNull();
      expect(configStub.clear).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(["/auth/login"]);
    });

    it("exits impersonation instead of destroying the admin session", () => {
      localStorage.setItem("fitora_user", JSON.stringify(owner));
      localStorage.setItem("fitora_token", "owner-tok");
      const admin: User = { ...owner, id: "admin1", role: "admin" };
      localStorage.setItem("fitora_impersonator", JSON.stringify({ token: "admin-tok", user: admin, companyName: "Acme" }));
      const auth = buildService();

      expect(auth.isImpersonating()).toBe(true);

      auth.logout();

      // exitImpersonation restores the admin session rather than clearing it
      expect(auth.currentUser()).toEqual(admin);
      expect(auth.getToken()).toBe("admin-tok");
      expect(auth.isImpersonating()).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(["/admin/companies"]);
    });
  });

  describe("impersonation", () => {
    it("startImpersonation stashes the admin session and switches to the owner", () => {
      const admin: User = { ...owner, id: "admin1", role: "admin" };
      localStorage.setItem("fitora_user", JSON.stringify(admin));
      localStorage.setItem("fitora_token", "admin-tok");
      const auth = buildService();

      auth.startImpersonation({ token: "owner-tok", user: owner }, "Acme Gym");

      expect(auth.isImpersonating()).toBe(true);
      expect(auth.impersonatedCompanyName()).toBe("Acme Gym");
      expect(auth.currentUser()).toEqual(owner);
      expect(auth.getToken()).toBe("owner-tok");
      expect(router.navigate).toHaveBeenCalledWith(["/owner/dashboard"]);
    });

    it("impersonatedCompanyName is null when not impersonating", () => {
      const auth = buildService();
      expect(auth.impersonatedCompanyName()).toBeNull();
    });

    it("exitImpersonation is a no-op when not impersonating", () => {
      const auth = buildService();
      auth.exitImpersonation();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe("homeRouteForCurrentUser", () => {
    it("sends a platform admin to /admin/companies", () => {
      localStorage.setItem("fitora_user", JSON.stringify({ ...owner, role: "admin" }));
      const auth = buildService();
      expect(auth.homeRouteForCurrentUser()).toBe("/admin/companies");
    });

    it("sends a coach-kind staff login to /coach/today", () => {
      localStorage.setItem("fitora_user", JSON.stringify({ ...owner, role: "staff", staff_role: "coach" }));
      const auth = buildService();
      expect(auth.homeRouteForCurrentUser()).toBe("/coach/today");
    });

    it("sends a fresh owner with unfinished setup to the getting-started guide", () => {
      localStorage.setItem("fitora_user", JSON.stringify(owner));
      const auth = buildService();
      configStub.setup.and.returnValue({ complete: false, dismissed: false });
      expect(auth.homeRouteForCurrentUser()).toBe("/owner/getting-started");
    });

    it("sends an owner with dismissed/complete setup to the dashboard", () => {
      localStorage.setItem("fitora_user", JSON.stringify(owner));
      const auth = buildService();
      configStub.setup.and.returnValue({ complete: false, dismissed: true });
      expect(auth.homeRouteForCurrentUser()).toBe("/owner/dashboard");
    });

    it("defaults everyone else to the dashboard", () => {
      localStorage.setItem("fitora_user", JSON.stringify({ ...owner, role: "staff", staff_role: "receptionist" }));
      const auth = buildService();
      expect(auth.homeRouteForCurrentUser()).toBe("/owner/dashboard");
    });
  });

  it("coachShellApplies mirrors staff_role === 'coach'", () => {
    localStorage.setItem("fitora_user", JSON.stringify({ ...owner, role: "staff", staff_role: "coach" }));
    const auth = buildService();
    expect(auth.coachShellApplies()).toBe(true);
  });

  describe("refreshCurrentUser", () => {
    it("GETs /auth/me and updates the stored user", () => {
      const auth = buildService();
      let result: User | undefined;
      auth.refreshCurrentUser().subscribe((u) => (result = u));

      const req = httpMock.expectOne(`${API_BASE_URL}/auth/me`);
      expect(req.request.method).toBe("GET");
      req.flush({ user: owner });

      expect(result).toEqual(owner);
      expect(auth.currentUser()).toEqual(owner);
      expect(JSON.parse(localStorage.getItem("fitora_user")!)).toEqual(owner);
    });
  });

  describe("loadConfiguration", () => {
    it("clears config and opens the admin notification feed for an admin login", () => {
      localStorage.setItem("fitora_user", JSON.stringify({ ...owner, role: "admin" }));
      const auth = buildService();

      auth.loadConfiguration();

      expect(configStub.clear).toHaveBeenCalled();
      expect(configStub.connectAdminNotifications).toHaveBeenCalled();
      expect(configStub.load).not.toHaveBeenCalled();
    });

    it("loads the bootstrap for anyone else", () => {
      localStorage.setItem("fitora_user", JSON.stringify(owner));
      const auth = buildService();

      auth.loadConfiguration();

      expect(configStub.load).toHaveBeenCalled();
    });

    it("swallows a bootstrap load failure", () => {
      localStorage.setItem("fitora_user", JSON.stringify(owner));
      const auth = buildService();
      configStub.load.and.returnValue({ subscribe: (o: { error?: () => void }) => o.error?.() });

      expect(() => auth.loadConfiguration()).not.toThrow();
    });
  });

  it("getToken reads the stored JWT", () => {
    localStorage.setItem("fitora_token", "abc");
    const auth = buildService();
    expect(auth.getToken()).toBe("abc");
  });
});
