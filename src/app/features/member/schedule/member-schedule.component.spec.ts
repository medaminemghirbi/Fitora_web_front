import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { MemberSession } from "../../../core/models/member.model";
import { MemberSessionsService } from "../../../core/services/member-sessions.service";
import { MemberBookingsService } from "../../../core/services/member-bookings.service";
import { MemberService } from "../../../core/services/member.service";
import { MemberScheduleComponent } from "./member-schedule.component";

describe("MemberScheduleComponent", () => {
  let fixture: ComponentFixture<MemberScheduleComponent>;
  let component: MemberScheduleComponent;
  let sessions: jasmine.SpyObj<MemberSessionsService>;
  let bookings: jasmine.SpyObj<MemberBookingsService>;

  function session(id: string, startsAt: string, extra: Partial<MemberSession> = {}): MemberSession {
    return {
      id,
      company_id: "g1",
      activity_name: "Boxe",
      activity_emoji: "🥊",
      coach_name: "Amine",
      starts_at: startsAt,
      ends_at: startsAt,
      capacity: 10,
      spots_left: 4,
      full: false,
      already_booked: false,
      ...extra,
    };
  }

  const roster = [
    session("s1", "2026-09-20T09:00:00Z"),
    session("s2", "2026-09-20T18:00:00Z"),
    session("s3", "2026-09-21T09:00:00Z"),
  ];

  function build(list: MemberSession[] = roster): void {
    TestBed.resetTestingModule();
    sessions = jasmine.createSpyObj<MemberSessionsService>("MemberSessionsService", ["list"]);
    sessions.list.and.returnValue(of({ sessions: list }));
    bookings = jasmine.createSpyObj<MemberBookingsService>("MemberBookingsService", ["create"]);

    TestBed.configureTestingModule({
      imports: [MemberScheduleComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MemberSessionsService, useValue: sessions },
        { provide: MemberBookingsService, useValue: bookings },
        { provide: MemberService, useValue: { companyId: () => "g1" } },
      ],
    });

    fixture = TestBed.createComponent(MemberScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => build());

  it("asks only for the gym the member belongs to", () => {
    expect(sessions.list).toHaveBeenCalledWith(undefined, "g1");
  });

  it("groups the sessions by day, in the order they happen", () => {
    expect(component.days().map((d) => d.date)).toEqual(["2026-09-20", "2026-09-21"]);
    expect(component.days()[0].sessions.map((s) => s.id)).toEqual(["s1", "s2"]);
  });

  it("books a place, marks the row and takes one off what is left", () => {
    bookings.create.and.returnValue(of({ booking: {} as never }));

    component.book(roster[0]);

    expect(bookings.create).toHaveBeenCalledWith("s1");
    const booked = component.sessions().find((s) => s.id === "s1")!;
    expect(booked.already_booked).toBe(true);
    expect(booked.spots_left).toBe(3);
  });

  it("leaves the row untouched when the booking is refused", () => {
    bookings.create.and.returnValue(throwError(() => new Error("no contract")));

    component.book(roster[0]);

    const untouched = component.sessions().find((s) => s.id === "s1")!;
    expect(untouched.already_booked).toBe(false);
    expect(untouched.spots_left).toBe(4);
    expect(component.booking()).toBeNull();
  });

  it("does not book a place it already holds", () => {
    build([session("s1", "2026-09-20T09:00:00Z", { already_booked: true })]);
    component.book(component.sessions()[0]);
    expect(bookings.create).not.toHaveBeenCalled();
  });

  it("does not book a full session", () => {
    build([session("s1", "2026-09-20T09:00:00Z", { full: true, spots_left: 0 })]);
    component.book(component.sessions()[0]);
    expect(bookings.create).not.toHaveBeenCalled();
  });

  it("offers a retry rather than an empty week when the schedule will not load", () => {
    sessions.list.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });
});
