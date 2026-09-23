import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { DashboardService, TodaysScheduleItem } from "../../../core/services/dashboard.service";
import { DeskDashboardComponent } from "./desk-dashboard.component";

function session(overrides: Partial<TodaysScheduleItem> = {}): TodaysScheduleItem {
  return {
    id: "s1",
    starts_at: "2026-09-19T10:00:00Z",
    ends_at: "2026-09-19T11:00:00Z",
    activity_name: "Pilates",
    activity_emoji: null,
    coach_name: "Leila",
    company_name: "Studio",
    confirmed_count: 4,
    capacity: 10,
    status: "scheduled",
    ...overrides,
  };
}

function stats(schedule: TodaysScheduleItem[], extra: Record<string, unknown> = {}) {
  return {
    company: {} as never,
    stats: {
      total_clients: 0,
      active_contracts: 0,
      todays_bookings: 12,
      todays_attendance: 7,
      outstanding_payments: null,
      todays_schedule: schedule,
      attention: [],
      contracts_expiring: [],
      recent_payments: [],
      revenue_by_month: [],
      recent_clients: [],
      ...extra,
    },
  };
}

describe("DeskDashboardComponent", () => {
  let fixture: ComponentFixture<DeskDashboardComponent>;
  let component: DeskDashboardComponent;
  let dashboard: jasmine.SpyObj<DashboardService>;

  // 10:30 — between the 10:00 session's start and its 11:00 end.
  const during = new Date("2026-09-19T10:30:00Z");

  async function build(response: unknown, fail = false) {
    dashboard = jasmine.createSpyObj<DashboardService>("DashboardService", ["get"]);
    dashboard.get.and.returnValue(fail ? throwError(() => new Error("down")) : (of(response) as never));

    await TestBed.configureTestingModule({
      imports: [DeskDashboardComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: DashboardService, useValue: dashboard }],
    }).compileComponents();

    fixture = TestBed.createComponent(DeskDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => jasmine.clock().install().mockDate(during));
  afterEach(() => jasmine.clock().uninstall());

  it("shows the session that is under way as the current one", async () => {
    await build(stats([session()]));

    expect(component.current()?.id).toBe("s1");
  });

  it("does not call a finished session current", async () => {
    await build(stats([session({ starts_at: "2026-09-19T08:00:00Z", ends_at: "2026-09-19T09:00:00Z" })]));

    expect(component.current()).toBeNull();
  });

  it("does not call a cancelled session current, even mid-slot", async () => {
    await build(stats([session({ status: "cancelled" })]));

    expect(component.current()).toBeNull();
  });

  it("lists only what has not started yet as still to come", async () => {
    await build(
      stats([
        session(),
        session({ id: "s2", starts_at: "2026-09-19T14:00:00Z", ends_at: "2026-09-19T15:00:00Z" }),
        session({ id: "s3", starts_at: "2026-09-19T08:00:00Z", ends_at: "2026-09-19T09:00:00Z" }),
      ])
    );

    expect(component.upcoming().map((s) => s.id)).toEqual(["s2"]);
  });

  it("counts the spots left, and never goes below zero when oversold", async () => {
    await build(stats([session()]));

    expect(component.spotsLeft(session())).toBe(6);
    expect(component.isFull(session())).toBe(false);
    expect(component.spotsLeft(session({ confirmed_count: 12, capacity: 10 }))).toBe(0);
    expect(component.isFull(session({ confirmed_count: 10, capacity: 10 }))).toBe(true);
  });

  it("counts the days until a membership lapses, and says so when it already has", async () => {
    await build(stats([]));

    expect(component.daysUntil("2026-09-22T10:30:00Z")).toBe(3);
    expect(component.daysUntil("2026-09-17T10:30:00Z")).toBe(-2);
  });

  it("carries the two counts the desk reads", async () => {
    await build(stats([]));

    expect(component.bookedToday()).toBe(12);
    expect(component.checkedIn()).toBe(7);
  });

  it("surfaces a failure instead of an empty screen", async () => {
    await build(null, true);

    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBe(false);
  });
});
