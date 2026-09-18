import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AttendanceBooking } from "../../core/models/attendance.model";
import { AttendanceService } from "../../core/services/attendance.service";
import { CheckinPanelComponent } from "./checkin-panel.component";

describe("CheckinPanelComponent", () => {
  let fixture: ComponentFixture<CheckinPanelComponent>;
  let component: CheckinPanelComponent;
  let attendance: jasmine.SpyObj<AttendanceService>;

  function booking(id: string, name: string, status: string | null = null): AttendanceBooking {
    return {
      booking_id: id,
      client: { id: `c-${id}`, full_name: name, phone: null },
      booking_status: "confirmed",
      attendance: status ? { status: status as never, checked_in_at: null, checked_out_at: null } : null,
    };
  }

  const roster = [booking("b1", "Rania Ferjani"), booking("b2", "Amine Mghirbi", "present")];

  beforeEach(() => {
    attendance = jasmine.createSpyObj<AttendanceService>("AttendanceService", ["forSession", "mark"]);
    attendance.forSession.and.returnValue(of({ session: {} as never, bookings: roster }));

    TestBed.configureTestingModule({
      imports: [CheckinPanelComponent, TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AttendanceService, useValue: attendance }],
    });

    fixture = TestBed.createComponent(CheckinPanelComponent);
    component = fixture.componentInstance;
    component.sessionId = "s1";
    fixture.detectChanges();
  });

  it("loads the roster for the session it is given", () => {
    expect(attendance.forSession).toHaveBeenCalledWith("s1");
    expect(component.bookings().length).toBe(2);
  });

  it("does not reload when handed the same session again", () => {
    component.sessionId = "s1";
    expect(attendance.forSession).toHaveBeenCalledTimes(1);
  });

  it("narrows the roster by name", () => {
    component.search.set("rania");
    expect(component.filtered().map((b) => b.booking_id)).toEqual(["b1"]);
  });

  it("counts who is already in", () => {
    expect(component.presentCount()).toBe(1);
  });

  it("marks someone present and keeps the row it changed", () => {
    attendance.mark.and.returnValue(of({ attendance: booking("b1", "Rania Ferjani", "present") }));

    component.mark(roster[0], "present");

    expect(attendance.mark).toHaveBeenCalledWith("b1", "present");
    expect(component.presentCount()).toBe(2);
    expect(component.marking()).toBeNull();
  });

  it("ignores a tap on the status someone already has", () => {
    component.mark(roster[1], "present");
    expect(attendance.mark).not.toHaveBeenCalled();
  });

  it("leaves the row as it was when the write fails", () => {
    attendance.mark.and.returnValue(throwError(() => new Error("nope")));

    component.mark(roster[0], "present");

    expect(component.presentCount()).toBe(1);
    expect(component.marking()).toBeNull();
  });

  it("offers a retry rather than an empty list when the roster will not load", () => {
    attendance.forSession.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });
});
