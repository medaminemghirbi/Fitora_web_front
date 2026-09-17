import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DatePipe } from "@angular/common";
import { Router, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Booking } from "../../../core/models/booking.model";
import { Session } from "../../../core/models/session.model";
import { ConfirmService } from "../../../core/services/confirm.service";
import { MemberBookingsService } from "../../../core/services/member-bookings.service";
import { MemberSessionsService } from "../../../core/services/member-sessions.service";
import { ToastService } from "../../../core/services/toast.service";
import { MemberBookingsComponent } from "./member-bookings.component";

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "b1", status: "confirmed", amount: 45, currency: "TND", payment_status: "paid", created_at: "2026-09-10T10:00:00",
    covered_by: null, client: { id: "c1", full_name: "Jane", email: null, phone: null },
    session: {
      id: "s1", starts_at: "2026-09-20T18:30:00", ends_at: "2026-09-20T19:00:00", status: "scheduled",
      activity_name: "EMS", activity_emoji: "⚡", company_name: "Fit Studio", company_id: "g1",  coach_name: null,
    },
    ...overrides,
  };
}

function session(overrides: Partial<Session> = {}): Session {
  return {
    id: "s2", activity_id: "a1", activity_name: "EMS", activity_emoji: "⚡",
    company_name: "Fit Studio", company_id: "g1",  coach_id: null, coach_name: null, starts_at: "2026-09-25T18:30:00",
    ends_at: "2026-09-25T19:00:00", capacity: 10, confirmed_count: 8, price: 45, status: "scheduled",
    availability: "available", already_booked: false, ...overrides,
  };
}

describe("MemberBookingsComponent", () => {
  let fixture: ComponentFixture<MemberBookingsComponent>;
  let component: MemberBookingsComponent;
  let bookingsService: jasmine.SpyObj<MemberBookingsService>;
  let sessionsService: jasmine.SpyObj<MemberSessionsService>;
  let confirm: ConfirmService;
  let toast: ToastService;
  let router: Router;

  beforeEach(async () => {
    bookingsService = jasmine.createSpyObj<MemberBookingsService>("MemberBookingsService", ["list", "cancel", "create"]);
    sessionsService = jasmine.createSpyObj<MemberSessionsService>("MemberSessionsService", ["list"]);

    bookingsService.list.and.callFake((when) => of({ bookings: when === "past" ? [booking({ id: "b2", status: "completed" })] : [booking()] }));
    sessionsService.list.and.returnValue(of({ sessions: [session()] }));

    await TestBed.configureTestingModule({
      imports: [MemberBookingsComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        DatePipe,
        { provide: MemberBookingsService, useValue: bookingsService },
        { provide: MemberSessionsService, useValue: sessionsService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, "navigate");
    confirm = TestBed.inject(ConfirmService);
    toast = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(MemberBookingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("loads upcoming bookings, past bookings, and bookable sessions", () => {
    expect(component.upcomingBookings().length).toBe(1);
    expect(component.pastBookings().length).toBe(1);
    expect(component.bookableSessions().length).toBe(1);
  });

  it("defaults to the upcoming tab", () => {
    expect(component.tab()).toBe("upcoming");
    expect(component.visibleBookings()).toEqual(component.upcomingBookings());
  });

  it("switchTab changes which list is visible", () => {
    component.switchTab("past");
    expect(component.visibleBookings()).toEqual(component.pastBookings());
  });

  it("shows an error state on failure", () => {
    bookingsService.list.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });

  it("nextSessionFor finds a bookable, not-yet-booked session for that activity", () => {
    expect(component.nextSessionFor("EMS")?.id).toBe("s2");
    expect(component.nextSessionFor("Yoga")).toBeNull();
  });

  it("nextSessionFor excludes an already-booked session", () => {
    sessionsService.list.and.returnValue(of({ sessions: [session({ already_booked: true })] }));
    component.load();
    expect(component.nextSessionFor("EMS")).toBeNull();
  });

  describe("cancel", () => {
    it("does nothing when the user backs out of the confirm dialog", async () => {
      spyOn(confirm, "ask").and.resolveTo(false);
      await component.cancel(booking());
      expect(bookingsService.cancel).not.toHaveBeenCalled();
    });

    it("cancels and reloads on confirm", async () => {
      spyOn(confirm, "ask").and.resolveTo(true);
      bookingsService.cancel.and.returnValue(of({ booking: booking({ status: "cancelled" }) }));
      await component.cancel(booking());
      expect(bookingsService.cancel).toHaveBeenCalledWith("b1");
      expect(component.cancellingId()).toBeNull();
      expect(toast.toasts()[0].kind).toBe("success");
    });

    it("shows an error toast on failure", async () => {
      spyOn(confirm, "ask").and.resolveTo(true);
      bookingsService.cancel.and.returnValue(throwError(() => new Error("nope")));
      await component.cancel(booking());
      expect(component.cancellingId()).toBeNull();
      expect(toast.toasts()[0].kind).toBe("error");
    });
  });

  describe("bookAgain", () => {
    it("routes to a prefiltered Explore when no matching session exists", async () => {
      await component.bookAgain(booking({ session: { ...booking().session, activity_name: "Yoga" } }));
      expect(router.navigate).toHaveBeenCalledWith(["/member/explore"], { queryParams: { activity: "Yoga" } });
      expect(bookingsService.create).not.toHaveBeenCalled();
    });

    it("one-tap rebooks the next available session after confirming", async () => {
      spyOn(confirm, "ask").and.resolveTo(true);
      bookingsService.create.and.returnValue(of({ booking: booking({ id: "b3" }) }));

      await component.bookAgain(booking());

      expect(bookingsService.create).toHaveBeenCalledWith("s2");
      expect(router.navigate).toHaveBeenCalledWith(["/member/bookings", "b3", "confirmed"], { state: { booking: booking({ id: "b3" }) } });
    });

    it("does nothing when the user cancels the confirm dialog", async () => {
      spyOn(confirm, "ask").and.resolveTo(false);
      await component.bookAgain(booking());
      expect(bookingsService.create).not.toHaveBeenCalled();
    });

    it("shows an error toast on failure", async () => {
      spyOn(confirm, "ask").and.resolveTo(true);
      bookingsService.create.and.returnValue(throwError(() => new Error("nope")));
      await component.bookAgain(booking());
      expect(component.rebookingId()).toBeNull();
      expect(toast.toasts()[0].kind).toBe("error");
    });
  });
});
