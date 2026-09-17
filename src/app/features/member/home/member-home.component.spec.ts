import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Booking } from "../../../core/models/booking.model";
import { Session } from "../../../core/models/session.model";
import { AuthService } from "../../../core/auth/auth.service";
import { BrandingService } from "../../../core/services/branding.service";
import { MemberBookingsService } from "../../../core/services/member-bookings.service";
import { MemberSessionsService } from "../../../core/services/member-sessions.service";
import { MemberHomeComponent } from "./member-home.component";

function session(overrides: Partial<Session> = {}): Session {
  return {
    id: "s1", activity_id: "a1", activity_name: "EMS", activity_emoji: "⚡",
    company_name: "Fit Studio", company_id: "g1",  coach_id: null, coach_name: null, starts_at: new Date().toISOString(),
    ends_at: new Date().toISOString(), capacity: 10, confirmed_count: 8, price: 45, status: "scheduled",
    availability: "available", already_booked: false, ...overrides,
  };
}

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "b1", status: "completed", amount: 45, currency: "TND", payment_status: "paid", created_at: new Date().toISOString(),
    covered_by: null, client: { id: "c1", full_name: "Jane", email: null, phone: null },
    session: {
      id: "s1", starts_at: new Date().toISOString(), ends_at: new Date().toISOString(), status: "scheduled",
      activity_name: "EMS", activity_emoji: "⚡", company_name: "Fit Studio", company_id: "g1",  coach_name: null,
    },
    ...overrides,
  };
}

describe("MemberHomeComponent", () => {
  let fixture: ComponentFixture<MemberHomeComponent>;
  let component: MemberHomeComponent;
  let sessionsService: jasmine.SpyObj<MemberSessionsService>;
  let bookingsService: jasmine.SpyObj<MemberBookingsService>;
  let router: Router;

  beforeEach(async () => {
    sessionsService = jasmine.createSpyObj<MemberSessionsService>("MemberSessionsService", ["list"]);
    bookingsService = jasmine.createSpyObj<MemberBookingsService>("MemberBookingsService", ["list"]);

    sessionsService.list.and.returnValue(of({ sessions: [session()] }));
    bookingsService.list.and.callFake((when) => of({ bookings: when === "past" ? [booking()] : [] }));

    await TestBed.configureTestingModule({
      imports: [MemberHomeComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: MemberSessionsService, useValue: sessionsService },
        { provide: MemberBookingsService, useValue: bookingsService },
        { provide: AuthService, useValue: { currentClient: () => ({ first_name: "Jane" }) } },
        { provide: BrandingService, useValue: { branding: () => null, logoUrl: () => null } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, "navigate");
    fixture = TestBed.createComponent(MemberHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("loads sessions and bookings on init", () => {
    expect(component.loading()).toBe(false);
    expect(component.upcomingSessions().length).toBe(1);
    expect(component.pastBookings().length).toBe(1);
  });

  it("shows an error state when any request fails", () => {
    sessionsService.list.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe(true);
  });

  it("nextBooking is the first upcoming booking, or null", () => {
    expect(component.nextBooking()).toBeNull();
    bookingsService.list.and.callFake((when) => of({ bookings: when === "upcoming" ? [booking({ id: "b2" })] : [] }));
    component.load();
    expect(component.nextBooking()?.id).toBe("b2");
  });

  it("recommends the most-booked past activity's next unbooked session", () => {
    expect(component.recommendedSession()?.activity_name).toBe("EMS");
  });

  it("does not recommend a session the client already booked", () => {
    sessionsService.list.and.returnValue(of({ sessions: [session({ already_booked: true })] }));
    component.load();
    expect(component.recommendedSession()).toBeNull();
  });

  it("recommends nothing with no completed history", () => {
    bookingsService.list.and.callFake((when) => of({ bookings: when === "past" ? [booking({ status: "cancelled" })] : [] }));
    component.load();
    expect(component.recommendedSession()).toBeNull();
  });

  it("quickActivities dedupes by activity name", () => {
    sessionsService.list.and.returnValue(of({ sessions: [session(), session({ id: "s2" }), session({ id: "s3", activity_name: "Yoga", activity_emoji: null })] }));
    component.load();
    expect(component.quickActivities().map((a) => a.name)).toEqual(["EMS", "Yoga"]);
  });

  it("openSession navigates to the session detail with state", () => {
    const s = session();
    component.openSession(s);
    expect(router.navigate).toHaveBeenCalledWith(["/member/sessions", s.id], { state: { session: s } });
  });

  it("exploreActivity navigates to Explore filtered by that activity", () => {
    component.exploreActivity("Yoga");
    expect(router.navigate).toHaveBeenCalledWith(["/member/explore"], { queryParams: { activity: "Yoga" } });
  });
});
