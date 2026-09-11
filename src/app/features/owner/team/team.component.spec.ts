import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of } from "rxjs";
import { Coach } from "../../../core/models/coach.model";
import { StaffMember } from "../../../core/models/staff-member.model";
import { CoachesService } from "../../../core/services/coaches.service";
import { StaffService } from "../../../core/services/staff.service";
import { AuthService } from "../../../core/auth/auth.service";
import { TeamComponent } from "./team.component";

const coach: Coach = {
  id: "c1",
  company_id: "1",
  first_name: "Sarah",
  last_name: "Martin",
  full_name: "Sarah Martin",
  email: null,
  phone: null,
  bio: null,
  photo_url: null,
  birthdate: null,
  active: true,
  has_login: true,
  login_email: "sarah@x.test",
  location_ids: [],
};

const receptionist: StaffMember = {
  id: "s1",
  role: "receptionist",
  role_key: "receptionist",
  role_name: "Réception",
  permissions: ["clients", "bookings"],
  active: true,
  birthdate: null,
  user: { id: "u1", full_name: "Khaled Zaidi", email: "khaled@x.test", phone: null },
  coach_id: null,
  location_ids: [],
};

const coachStaff: StaffMember = {
  id: "s2",
  role: "coach",
  role_key: "coach",
  role_name: "Coach",
  permissions: ["checkin"],
  active: true,
  birthdate: null,
  user: { id: "u2", full_name: "Sarah Martin", email: "sarah@x.test", phone: null },
  coach_id: "c1",
  location_ids: [],
};

describe("TeamComponent", () => {
  let fixture: ComponentFixture<TeamComponent>;
  let coachesService: jasmine.SpyObj<CoachesService>;
  let staffService: jasmine.SpyObj<StaffService>;

  beforeEach(async () => {
    coachesService = jasmine.createSpyObj("CoachesService", ["list", "create", "update", "deactivate", "setLogin"]);
    staffService = jasmine.createSpyObj("StaffService", ["list", "create", "update"]);
    coachesService.list.and.returnValue(of({ coaches: [coach] }));
    staffService.list.and.returnValue(of({ staff: [receptionist, coachStaff] }));

    await TestBed.configureTestingModule({
      imports: [TeamComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CoachesService, useValue: coachesService },
        { provide: StaffService, useValue: staffService },
        { provide: AuthService, useValue: { currentUser: () => ({ role: "owner" }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamComponent);
    fixture.detectChanges();
  });

  it("merges coaches and back-office staff, hiding the coach's linked staff record", () => {
    // 1 coach + 1 receptionist; the role:'coach' staff row is folded into the coach entry.
    expect(fixture.componentInstance.members().length).toBe(2);
    expect(fixture.componentInstance.members().find((m) => m.name === "Sarah Martin")?.hasMobile).toBe(true);
    expect(fixture.componentInstance.members().find((m) => m.name === "Khaled Zaidi")?.hasWeb).toBe(true);
  });

  it("creates a coach", () => {
    coachesService.create.and.returnValue(of({ coach } as any));

    fixture.componentInstance.openCreate("coach");
    fixture.componentInstance.coachForm.patchValue({ first_name: "Sarah", last_name: "Martin" });
    fixture.componentInstance.submitCreate();

    expect(coachesService.create).toHaveBeenCalled();
  });
});
