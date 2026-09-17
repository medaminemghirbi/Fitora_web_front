import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { GymDetail, MyGym } from "../../../core/models/gym.model";
import { GymsService } from "../../../core/services/gyms.service";
import { AuthService } from "../../../core/auth/auth.service";
import { ToastService } from "../../../core/services/toast.service";
import { GymPageComponent } from "./gym-page.component";

describe("GymPageComponent", () => {
  let fixture: ComponentFixture<GymPageComponent>;
  let component: GymPageComponent;
  let gymsService: jasmine.SpyObj<GymsService>;
  let router: Router;
  let toast: ToastService;

  const gym = {
    id: "g1", name: "Power Gym", city: "Tunis", address: "12 rue X", description: "Une salle",
    activities: [{ id: "a1", name: "Boxe", emoji: null, session_format: "collective" }],
    sessions: [
      { id: "s1", activity_name: "Boxe", activity_emoji: null, coach_name: "Karim", starts_at: "2026-09-21T18:00:00Z", ends_at: "2026-09-21T19:00:00Z", capacity: 12, spots_left: 3, full: false },
      { id: "s2", activity_name: "Pilates", activity_emoji: null, coach_name: null, starts_at: "2026-09-21T19:30:00Z", ends_at: "2026-09-21T20:30:00Z", capacity: 10, spots_left: 0, full: true },
      { id: "s3", activity_name: "Boxe", activity_emoji: null, coach_name: "Karim", starts_at: "2026-09-22T18:00:00Z", ends_at: "2026-09-22T19:00:00Z", capacity: 12, spots_left: 12, full: false },
    ],
    phone: "+216 20 000000", email: "hello@gym.tn", primary_color: null,
  } as unknown as GymDetail;

  function build(isClient: boolean, mine: MyGym[] = [], fails = false): void {
    TestBed.resetTestingModule();
    gymsService = jasmine.createSpyObj<GymsService>("GymsService", ["get", "join"], { mine: (() => mine) as never });
    gymsService.get.and.returnValue(fails ? throwError(() => new Error("nope")) : of({ gym }));

    TestBed.configureTestingModule({
      imports: [GymPageComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: GymsService, useValue: gymsService },
        { provide: AuthService, useValue: { isClient: () => isClient } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: "g1" }) } } },
      ],
    });

    fixture = TestBed.createComponent(GymPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    toast = TestBed.inject(ToastService);
    spyOn(router, "navigate");
    fixture.detectChanges();
  }

  it("loads the gym from the route, for a visitor with no account", () => {
    build(false);
    expect(gymsService.get).toHaveBeenCalledWith("g1");
    expect(component.gym()).toEqual(gym);
  });

  it("shows an error state when the gym is not published, rather than a blank page", () => {
    build(false, [], true);
    expect(component.error()).toBe(true);
  });

  it("sends a visitor with no account to the member sign-up instead of failing", () => {
    build(false);

    component.join();

    expect(gymsService.join).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(["/register/member"], { queryParams: { gym: "g1" } });
  });

  it("joins straight away for someone already signed in", () => {
    build(true);
    gymsService.join.and.returnValue(of({ gym: { ...gym, joined_at: "2026-01-01" } as unknown as MyGym }));

    component.join();

    expect(gymsService.join).toHaveBeenCalledWith("g1");
    expect(toast.toasts()[0].kind).toBe("success");
    expect(router.navigate).toHaveBeenCalledWith(["/member/gyms"]);
  });

  it("recognises a gym the person already belongs to", () => {
    build(true, [{ ...gym, joined_at: "2026-01-01" } as unknown as MyGym]);
    expect(component.isMember()).toBe(true);
  });

  it("shows the week ahead to a visitor with no account and no membership", () => {
    build(false);

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll(".gp-day").length).toBe(2);
    expect(el.querySelectorAll(".gp-day li").length).toBe(3);
  });

  it("groups the sessions by day, in order", () => {
    build(false);

    expect(component.scheduleByDay().map((d) => d.day)).toEqual(["2026-09-21", "2026-09-22"]);
    expect(component.scheduleByDay()[0].sessions.length).toBe(2);
  });

  it("tells a visitor that booking needs joining, and drops that line for a member", () => {
    build(false);
    expect(fixture.nativeElement.querySelector(".gp-join-note")).toBeTruthy();

    build(true, [{ ...gym, joined_at: "2026-01-01" } as unknown as MyGym]);
    expect(fixture.nativeElement.querySelector(".gp-join-note")).toBeNull();
  });
});
