import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Booking } from "../../../core/models/booking.model";
import { MemberBookingsService } from "../../../core/services/member-bookings.service";
import { MemberProgressComponent } from "./member-progress.component";

// Anchored to the Monday of the current ISO week (or `weeksAgo` weeks back)
// rather than "N days ago from today" — a days-ago offset would land in a
// different ISO week depending on which weekday the suite happens to run
// on, making the streak/this-week assertions flaky.
function mondayOfWeek(weeksAgo: number): Date {
  const now = new Date();
  const isoDayIndex = (now.getDay() + 6) % 7; // Mon=0 ... Sun=6
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - isoDayIndex - weeksAgo * 7);
}

function bookingInWeek(weeksAgo: number, overrides: Partial<Booking> = {}): Booking {
  const date = mondayOfWeek(weeksAgo);
  return {
    id: `b-${weeksAgo}-${Math.random()}`, status: "completed", amount: 45, currency: "TND", payment_status: "paid",
    created_at: date.toISOString(), covered_by: null, client: { id: "c1", full_name: "Jane", email: null, phone: null },
    session: {
      id: "s1", starts_at: date.toISOString(), ends_at: date.toISOString(), status: "completed",
      activity_name: "EMS", activity_emoji: "⚡", company_name: "Fit Studio", company_id: "g1",  coach_name: null,
    },
    ...overrides,
  };
}

// Anchored to the 15th of the current month (or N months back) so it never
// lands in a neighboring month regardless of which day of the month the
// suite runs on.
function bookingInMonth(monthsAgo: number, overrides: Partial<Booking> = {}): Booking {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 15);
  return {
    id: `bm-${monthsAgo}-${Math.random()}`, status: "completed", amount: 45, currency: "TND", payment_status: "paid",
    created_at: date.toISOString(), covered_by: null, client: { id: "c1", full_name: "Jane", email: null, phone: null },
    session: {
      id: "s1", starts_at: date.toISOString(), ends_at: date.toISOString(), status: "completed",
      activity_name: "EMS", activity_emoji: "⚡", company_name: "Fit Studio", company_id: "g1",  coach_name: null,
    },
    ...overrides,
  };
}

describe("MemberProgressComponent", () => {
  let fixture: ComponentFixture<MemberProgressComponent>;
  let component: MemberProgressComponent;
  let bookingsService: jasmine.SpyObj<MemberBookingsService>;

  function build(bookings: Booking[]): void {
    bookingsService = jasmine.createSpyObj<MemberBookingsService>("MemberBookingsService", ["list"]);
    bookingsService.list.and.returnValue(of({ bookings }));

    TestBed.configureTestingModule({
      imports: [MemberProgressComponent, TranslateModule.forRoot()],
      providers: [{ provide: MemberBookingsService, useValue: bookingsService }],
    }).compileComponents();

    fixture = TestBed.createComponent(MemberProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it("only counts status 'completed' bookings as real workouts", () => {
    build([bookingInWeek(0), bookingInWeek(0, { status: "cancelled" }), bookingInWeek(0, { status: "no_show" })]);
    expect(component.completedBookings().length).toBe(1);
  });

  it("shows an error state on failure", () => {
    bookingsService = jasmine.createSpyObj<MemberBookingsService>("MemberBookingsService", ["list"]);
    bookingsService.list.and.returnValue(throwError(() => new Error("nope")));
    TestBed.configureTestingModule({
      imports: [MemberProgressComponent, TranslateModule.forRoot()],
      providers: [{ provide: MemberBookingsService, useValue: bookingsService }],
    }).compileComponents();
    fixture = TestBed.createComponent(MemberProgressComponent);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.error()).toBe(true);
  });

  it("thisWeekCount counts only completed bookings within the current ISO week", () => {
    build([bookingInWeek(0), bookingInWeek(3)]);
    expect(component.thisWeekCount()).toBe(1);
  });

  it("byActivity groups and sorts by count descending", () => {
    build([
      bookingInWeek(0, { session: { ...bookingInWeek(0).session, activity_name: "EMS" } }),
      bookingInWeek(1, { session: { ...bookingInWeek(1).session, activity_name: "EMS" } }),
      bookingInWeek(2, { session: { ...bookingInWeek(2).session, activity_name: "Yoga" } }),
    ]);
    expect(component.byActivity()).toEqual([
      { name: "EMS", emoji: "⚡", count: 2 },
      { name: "Yoga", emoji: "⚡", count: 1 },
    ]);
  });

  it("monthlyByActivity only includes bookings from the current calendar month", () => {
    build([bookingInMonth(0), bookingInMonth(3)]);
    expect(component.monthlyTotal()).toBe(1);
  });

  it("streakWeeks counts consecutive weeks with at least one completed workout", () => {
    // This week and last week both have one; two weeks back is empty.
    build([bookingInWeek(0), bookingInWeek(1), bookingInWeek(4)]);
    expect(component.streakWeeks()).toBe(2);
  });

  it("streakWeeks is 0 with no completed history", () => {
    build([]);
    expect(component.streakWeeks()).toBe(0);
  });

  it("streakWeeks still counts from last week when this week has nothing yet", () => {
    build([bookingInWeek(1)]);
    expect(component.streakWeeks()).toBe(1);
  });
});
