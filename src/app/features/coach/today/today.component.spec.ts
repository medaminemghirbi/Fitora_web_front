import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AttendanceBooking } from "../../../core/models/attendance.model";
import { Session } from "../../../core/models/session.model";
import { AttendanceService } from "../../../core/services/attendance.service";
import { SessionsService } from "../../../core/services/sessions.service";
import { ToastService } from "../../../core/services/toast.service";
import { CoachTodayComponent } from "./today.component";

describe("CoachTodayComponent", () => {
  let fixture: ComponentFixture<CoachTodayComponent>;
  let component: CoachTodayComponent;
  let sessionsService: jasmine.SpyObj<SessionsService>;
  let attendanceService: jasmine.SpyObj<AttendanceService>;
  let toast: ToastService;

  const session = { id: "s1", activity_name: "Yoga" } as unknown as Session;
  const booking = { booking_id: "b1", client_name: "Amy", status: "confirmed" } as unknown as AttendanceBooking;

  beforeEach(async () => {
    sessionsService = jasmine.createSpyObj<SessionsService>("SessionsService", ["list"]);
    attendanceService = jasmine.createSpyObj<AttendanceService>("AttendanceService", ["forSession", "mark"]);
    sessionsService.list.and.returnValue(of({ sessions: [session], meta: { page: 1, per_page: 20, total: 1, total_pages: 1 } }));

    await TestBed.configureTestingModule({
      imports: [CoachTodayComponent, TranslateModule.forRoot()],
      providers: [
        { provide: SessionsService, useValue: sessionsService },
        { provide: AttendanceService, useValue: attendanceService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CoachTodayComponent);
    component = fixture.componentInstance;
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it("loads today's sessions on init", () => {
    expect(sessionsService.list).toHaveBeenCalledWith({ date: component.selectedDate() });
    expect(component.sessions().length).toBe(1);
    expect(component.loading()).toBe(false);
  });

  it("stops the spinner even when loading fails", () => {
    sessionsService.list.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.loading()).toBe(false);
  });

  it("shiftDay moves the selected date and reloads", () => {
    const before = component.selectedDate();
    component.shiftDay(1);
    expect(component.selectedDate()).not.toBe(before);
    expect(sessionsService.list).toHaveBeenCalledTimes(2);
  });

  it("goToday resets to today's date", () => {
    component.shiftDay(5);
    component.goToday();
    expect(component.selectedDate()).toBe(new Date().toISOString().slice(0, 10));
  });

  it("selectSession loads attendance for that session", () => {
    attendanceService.forSession.and.returnValue(of({ session, bookings: [booking] }));
    component.selectSession(session);
    expect(component.selectedSession()).toBe(session);
    expect(component.bookings().length).toBe(1);
    expect(component.bookingsLoading()).toBe(false);
  });

  it("selectSession shows an error toast on failure", () => {
    attendanceService.forSession.and.returnValue(throwError(() => new Error("nope")));
    component.selectSession(session);
    expect(component.bookingsLoading()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("error");
  });

  it("mark() updates only the matching booking, leaving others untouched", () => {
    const other = { ...booking, booking_id: "b2" };
    component.bookings.set([booking, other]);
    const updated = { ...booking, status: "present" };
    attendanceService.mark.and.returnValue(of({ attendance: updated }));

    component.mark(booking, "present");

    expect(component.markingBookingId()).toBeNull();
    expect(component.bookings()[0]).toEqual(updated);
    expect(component.bookings()[1]).toBe(other);
  });

  it("mark() shows an error toast on failure", () => {
    attendanceService.mark.and.returnValue(throwError(() => new Error("nope")));
    component.mark(booking, "absent");
    expect(component.markingBookingId()).toBeNull();
    expect(toast.toasts()[0].kind).toBe("error");
  });

  it("lists all 4 attendance statuses", () => {
    expect(component.statuses).toEqual(["present", "absent", "late", "no_show"]);
  });

  describe("what is on now", () => {
    function at(offsetMinutes: number, durationMinutes = 60): Record<string, unknown> {
      const starts = new Date(Date.now() + offsetMinutes * 60_000);
      return {
        id: `s${offsetMinutes}`,
        status: "scheduled",
        starts_at: starts.toISOString(),
        ends_at: new Date(starts.getTime() + durationMinutes * 60_000).toISOString(),
        activity_name: "Pilates",
        activity_emoji: null,
        confirmed_count: 4,
        capacity: 10,
      };
    }

    it("leads with the session under way", () => {
      component.sessions.set([at(-10), at(120)] as never);

      expect(component.upNext()?.live).toBe(true);
      expect(component.upNext()?.session.id).toBe("s-10");
    });

    it("leads with the soonest one still to come when nothing is on", () => {
      component.sessions.set([at(300), at(60)] as never);

      expect(component.upNext()?.live).toBe(false);
      expect(component.upNext()?.session.id).toBe("s60");
    });

    it("ignores what has already finished", () => {
      component.sessions.set([at(-300)] as never);

      expect(component.upNext()).toBeNull();
    });

    it("ignores a cancelled session, even one in its own slot", () => {
      component.sessions.set([{ ...at(-10), status: "cancelled" }] as never);

      expect(component.upNext()).toBeNull();
    });
  });
});
