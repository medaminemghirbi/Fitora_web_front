import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, convertToParamMap } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AuthService } from "../../../core/auth/auth.service";
import { ConfigurationService } from "../../../core/configuration/configuration.service";
import { Coach } from "../../../core/models/coach.model";
import { StaffMember } from "../../../core/models/staff-member.model";
import { CoachesService } from "../../../core/services/coaches.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { StaffService } from "../../../core/services/staff.service";
import { ToastService } from "../../../core/services/toast.service";
import { TeamComponent, TeamMember } from "./team.component";

const coach: Coach = {
  id: "c1", company_id: "1", first_name: "Sarah", last_name: "Martin", full_name: "Sarah Martin",
  email: "sarah@x.test", phone: null, bio: null, photo_url: null, birthdate: null, active: true,
  has_login: true, login_email: "sarah@x.test", location_ids: [],
};

const receptionist: StaffMember = {
  id: "s1", role: "receptionist", role_key: "receptionist", role_name: "Réception",
  permissions: ["clients", "bookings"], active: true, birthdate: null,
  user: { id: "u1", full_name: "Khaled Zaidi", email: "khaled@x.test", phone: null },
  coach_id: null, location_ids: [],
};

const coachStaff: StaffMember = {
  id: "s2", role: "coach", role_key: "coach", role_name: "Coach", permissions: ["checkin"],
  active: true, birthdate: null, user: { id: "u2", full_name: "Sarah Martin", email: "sarah@x.test", phone: null },
  coach_id: "c1", location_ids: [],
};

const receptionRole = { id: "r1", key: "receptionist", name: "Réception", permissions: ["clients"], builtin: true };
const coachRole = { id: "r2", key: "coach", name: "Coach", permissions: ["checkin"], builtin: true };
const ownerRole = { id: "r3", key: "owner", name: "Owner", permissions: [], builtin: true };

describe("TeamComponent", () => {
  let fixture: ComponentFixture<TeamComponent>;
  let component: TeamComponent;
  let coachesService: jasmine.SpyObj<CoachesService>;
  let staffService: jasmine.SpyObj<StaffService>;
  let confirmService: ConfirmService;
  let toast: ToastService;
  let authStub: { currentUser: jasmine.Spy };

  function build(role: string, queryParams: Record<string, string> = {}): void {
    TestBed.resetTestingModule();
    coachesService = jasmine.createSpyObj("CoachesService", ["list", "create", "update", "deactivate", "setLogin"]);
    staffService = jasmine.createSpyObj("StaffService", ["list", "create", "update"]);
    coachesService.list.and.returnValue(of({ coaches: [coach] }));
    staffService.list.and.returnValue(of({ staff: [receptionist, coachStaff] }));
    authStub = { currentUser: jasmine.createSpy().and.returnValue({ role }) };

    TestBed.configureTestingModule({
      imports: [TeamComponent, TranslateModule.forRoot()],
      providers: [
        { provide: CoachesService, useValue: coachesService },
        { provide: StaffService, useValue: staffService },
        { provide: AuthService, useValue: authStub },
        {
          provide: ConfigurationService,
          useValue: {
            roles: () => [ownerRole, receptionRole, coachRole],
            roleName: (key: string) => ({ coach: "Coach", receptionist: "Réception" })[key] ?? key,
          },
        },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } },
      ],
    });

    fixture = TestBed.createComponent(TeamComponent);
    component = fixture.componentInstance;
    confirmService = TestBed.inject(ConfirmService);
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  }

  beforeEach(() => build("owner"));

  it("merges coaches and back-office staff, hiding the coach's linked staff record", () => {
    expect(component.members().length).toBe(2);
    expect(component.members().find((m) => m.name === "Sarah Martin")?.hasMobile).toBe(true);
    expect(component.members().find((m) => m.name === "Khaled Zaidi")?.hasWeb).toBe(true);
  });

  it("sets the error flag when loading fails", () => {
    coachesService.list.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });

  it("a non-owner does not fetch back-office staff", () => {
    build("staff");
    expect(staffService.list).not.toHaveBeenCalled();
    expect(component.members().every((m) => !!m.coach)).toBe(true);
  });

  it("opens the create drawer automatically for ?action=new", () => {
    build("owner", { action: "new" });
    expect(component.createOpen()).toBe(true);
    expect(component.createKind()).toBe("coach");
  });

  it("opens the backoffice create drawer for ?action=new&type=backoffice, owner only", () => {
    build("owner", { action: "new", type: "backoffice" });
    expect(component.createKind()).toBe("backoffice");
  });

  it("a non-owner always gets the coach create flow regardless of ?type", () => {
    build("staff", { action: "new", type: "backoffice" });
    expect(component.createKind()).toBe("coach");
  });

  it("filtered narrows by tab", () => {
    component.tab.set("coaches");
    expect(component.filtered().every((m) => !!m.coach)).toBe(true);
    component.tab.set("backoffice");
    expect(component.filtered().every((m) => !!m.staff)).toBe(true);
  });

  it("changing tab or search resets to page 1", () => {
    component.page.set(3);
    component.tab.set("coaches");
    fixture.detectChanges();
    expect(component.page()).toBe(1);
  });

  it("tabs includes backoffice only for an owner", () => {
    expect(component.tabs().map((t) => t.id)).toEqual(["all", "coaches", "backoffice"]);
    build("staff");
    expect(component.tabs().map((t) => t.id)).toEqual(["all", "coaches"]);
  });

  it("backofficeRoles excludes coach and owner", () => {
    expect(component.backofficeRoles().map((r) => r.key)).toEqual(["receptionist"]);
  });

  describe("create coach", () => {
    it("openCreate forces coach for a non-owner even if asked for backoffice", () => {
      build("staff");
      component.openCreate("backoffice");
      expect(component.createKind()).toBe("coach");
    });

    it("does not submit with a missing name", () => {
      component.openCreate("coach");
      component.submitCreate();
      expect(coachesService.create).not.toHaveBeenCalled();
    });

    it("requires an email + 8-char password when with_mobile is checked", () => {
      component.openCreate("coach");
      component.coachForm.patchValue({ first_name: "S", last_name: "M", with_mobile: true, email: "", password: "" });
      component.submitCreate();
      expect(coachesService.create).not.toHaveBeenCalled();
      expect(component.createError()).toBeTruthy();
    });

    it("creates a coach without mobile login", () => {
      coachesService.create.and.returnValue(of({ coach }));
      component.openCreate("coach");
      component.coachForm.patchValue({ first_name: "Sarah", last_name: "Martin" });
      component.submitCreate();
      expect(coachesService.create).toHaveBeenCalled();
      expect(coachesService.setLogin).not.toHaveBeenCalled();
      expect(component.createOpen()).toBe(false);
      expect(toast.toasts()[0].kind).toBe("success");
    });

    it("creates a coach and sets up the mobile login", () => {
      coachesService.create.and.returnValue(of({ coach }));
      coachesService.setLogin.and.returnValue(of({ coach }));
      component.openCreate("coach");
      component.coachForm.patchValue({ first_name: "Sarah", last_name: "Martin", with_mobile: true, email: "s@x.test", password: "secret123" });
      component.submitCreate();
      expect(coachesService.setLogin).toHaveBeenCalledWith("c1", "s@x.test", "secret123");
      expect(component.createOpen()).toBe(false);
    });

    it("surfaces an error when the mobile login step fails", () => {
      coachesService.create.and.returnValue(of({ coach }));
      coachesService.setLogin.and.returnValue(throwError(() => new Error("nope")));
      component.openCreate("coach");
      component.coachForm.patchValue({ first_name: "Sarah", last_name: "Martin", with_mobile: true, email: "s@x.test", password: "secret123" });
      component.submitCreate();
      expect(component.createError()).toBeTruthy();
    });

    it("surfaces the backend error when creating the coach fails", () => {
      coachesService.create.and.returnValue(throwError(() => new Error("nope")));
      component.openCreate("coach");
      component.coachForm.patchValue({ first_name: "Sarah", last_name: "Martin" });
      component.submitCreate();
      expect(component.createError()).toBeTruthy();
    });

    it("closeCreate closes the drawer", () => {
      component.createOpen.set(true);
      component.closeCreate();
      expect(component.createOpen()).toBe(false);
    });
  });

  describe("create back-office staff", () => {
    it("does not submit with an invalid form", () => {
      component.openCreate("backoffice");
      component.backofficeForm.reset();
      component.submitCreate();
      expect(staffService.create).not.toHaveBeenCalled();
    });

    it("creates a back-office account", () => {
      staffService.create.and.returnValue(of({ staff_member: receptionist }));
      component.openCreate("backoffice");
      component.backofficeForm.patchValue({ first_name: "K", last_name: "Z", email: "k@x.test", password: "secret123", role_id: "r1" });
      component.submitCreate();
      expect(staffService.create).toHaveBeenCalled();
      expect(component.createOpen()).toBe(false);
    });

    it("surfaces the backend error on failure", () => {
      staffService.create.and.returnValue(throwError(() => new Error("nope")));
      component.openCreate("backoffice");
      component.backofficeForm.patchValue({ first_name: "K", last_name: "Z", email: "k@x.test", password: "secret123", role_id: "r1" });
      component.submitCreate();
      expect(component.createError()).toBeTruthy();
    });
  });

  describe("edit coach profile", () => {
    it("openEditCoach hydrates the form", () => {
      component.openEditCoach(coach);
      expect(component.editingCoach()).toBe(coach);
      expect(component.editCoachForm.value.first_name).toBe("Sarah");
    });

    it("submitEditCoach does nothing without an editing coach", () => {
      component.submitEditCoach();
      expect(coachesService.update).not.toHaveBeenCalled();
    });

    it("submitEditCoach saves and reloads", () => {
      component.openEditCoach(coach);
      coachesService.update.and.returnValue(of({ coach }));
      component.submitEditCoach();
      expect(component.editCoachOpen()).toBe(false);
      expect(toast.toasts()[0].kind).toBe("success");
    });

    it("submitEditCoach shows the backend error on failure", () => {
      component.openEditCoach(coach);
      coachesService.update.and.returnValue(throwError(() => new Error("nope")));
      component.submitEditCoach();
      expect(component.editCoachError()).toBeTruthy();
    });
  });

  describe("role & web access", () => {
    it("openRole hydrates the form from the matching role", () => {
      component.openRole(receptionist);
      expect(component.editingStaff()).toBe(receptionist);
      expect(component.roleForm.value.role_id).toBe("r1");
    });

    it("submitRole does nothing without an editing staff member", () => {
      component.submitRole();
      expect(staffService.update).not.toHaveBeenCalled();
    });

    it("submitRole saves and reloads", () => {
      component.openRole(receptionist);
      staffService.update.and.returnValue(of({ staff_member: receptionist }));
      component.submitRole();
      expect(component.roleOpen()).toBe(false);
      expect(toast.toasts()[0].kind).toBe("success");
    });

    it("submitRole shows the backend error on failure", () => {
      component.openRole(receptionist);
      staffService.update.and.returnValue(throwError(() => new Error("nope")));
      component.submitRole();
      expect(component.roleError()).toBeTruthy();
    });
  });

  describe("mobile login", () => {
    it("openLogin hydrates the form from the coach", () => {
      component.openLogin(coach);
      expect(component.loginTarget()).toBe(coach);
      expect(component.loginForm.value.email).toBe("sarah@x.test");
    });

    it("submitLogin does nothing with an invalid form", () => {
      component.openLogin(coach);
      component.loginForm.reset();
      component.submitLogin();
      expect(coachesService.setLogin).not.toHaveBeenCalled();
    });

    it("submitLogin sets the login and reloads", () => {
      component.openLogin(coach);
      component.loginForm.patchValue({ password: "secret123" });
      coachesService.setLogin.and.returnValue(of({ coach }));
      component.submitLogin();
      expect(component.loginOpen()).toBe(false);
      expect(toast.toasts()[0].kind).toBe("success");
    });

    it("submitLogin shows the backend error on failure", () => {
      component.openLogin(coach);
      component.loginForm.patchValue({ password: "secret123" });
      coachesService.setLogin.and.returnValue(throwError(() => new Error("nope")));
      component.submitLogin();
      expect(component.loginError()).toBeTruthy();
    });
  });

  describe("deactivate", () => {
    const coachMember: TeamMember = { key: "coach:c1", name: "Sarah Martin", email: null, phone: null, active: true, bio: null, hasMobile: true, hasWeb: false, roleName: "Coach", coach, staff: null, staffMemberId: null };
    const staffMember: TeamMember = { key: "staff:s1", name: "Khaled Zaidi", email: null, phone: null, active: true, bio: null, hasMobile: false, hasWeb: true, roleName: "Réception", coach: null, staff: receptionist, staffMemberId: "s1" };

    it("does nothing when declined", async () => {
      spyOn(confirmService, "ask").and.resolveTo(false);
      await component.deactivate(coachMember);
      expect(coachesService.deactivate).not.toHaveBeenCalled();
    });

    it("deactivates a coach on confirmation", async () => {
      spyOn(confirmService, "ask").and.resolveTo(true);
      coachesService.deactivate.and.returnValue(of({ coach }));
      await component.deactivate(coachMember);
      expect(coachesService.deactivate).toHaveBeenCalledWith("c1");
      expect(toast.toasts()[0].kind).toBe("success");
    });

    it("deactivates a staff member on confirmation", async () => {
      spyOn(confirmService, "ask").and.resolveTo(true);
      staffService.update.and.returnValue(of({ staff_member: receptionist }));
      await component.deactivate(staffMember);
      expect(staffService.update).toHaveBeenCalledWith("s1", { active: false });
    });

    it("shows an error toast on failure", async () => {
      spyOn(confirmService, "ask").and.resolveTo(true);
      coachesService.deactivate.and.returnValue(throwError(() => new Error("nope")));
      await component.deactivate(coachMember);
      expect(toast.toasts()[0].kind).toBe("error");
    });
  });
});
