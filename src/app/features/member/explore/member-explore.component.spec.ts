import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { of, throwError } from "rxjs";
import { Session } from "../../../core/models/session.model";
import { MemberSessionsService } from "../../../core/services/member-sessions.service";
import { MemberExploreComponent } from "./member-explore.component";

function session(overrides: Partial<Session> = {}): Session {
  return {
    id: "s1", activity_id: "a1", activity_name: "EMS", activity_emoji: "⚡",
    company_name: "Fit Studio", company_id: "g1",  coach_id: null, coach_name: null, starts_at: "2026-09-15T18:30:00",
    ends_at: "2026-09-15T19:00:00", capacity: 10, confirmed_count: 8, price: 45, status: "scheduled",
    availability: "available", already_booked: false, ...overrides,
  };
}

describe("MemberExploreComponent", () => {
  let fixture: ComponentFixture<MemberExploreComponent>;
  let component: MemberExploreComponent;
  let sessionsService: jasmine.SpyObj<MemberSessionsService>;
  let router: Router;

  function build(queryParams: Record<string, string> = {}): void {
    TestBed.configureTestingModule({
      imports: [MemberExploreComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: MemberSessionsService, useValue: sessionsService },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, "navigate");
    fixture = TestBed.createComponent(MemberExploreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    sessionsService = jasmine.createSpyObj<MemberSessionsService>("MemberSessionsService", ["list"]);
    sessionsService.list.and.returnValue(of({ sessions: [session(), session({ id: "s2", activity_name: "Yoga", activity_emoji: null })] }));
  });

  it("loads sessions on init", () => {
    build();
    expect(component.sessions().length).toBe(2);
    expect(component.loading()).toBe(false);
  });

  it("preselects the activity filter from the ?activity query param", () => {
    build({ activity: "Yoga" });
    expect(component.activityFilter()).toBe("Yoga");
    expect(component.filteredSessions().map((s) => s.id)).toEqual(["s2"]);
  });

  it("shows an error state on failure", () => {
    sessionsService.list.and.returnValue(throwError(() => new Error("nope")));
    build();
    expect(component.error()).toBe(true);
  });

  it("activityOptions is the sorted, deduped set of activity names", () => {
    build();
    expect(component.activityOptions()).toEqual(["EMS", "Yoga"]);
  });

  it("search filters by activity name, case-insensitively", () => {
    build();
    component.search.set("yo");
    expect(component.filteredSessions().map((s) => s.id)).toEqual(["s2"]);
  });

  it("date filter matches on calendar day", () => {
    build();
    component.dateFilter.set("2026-09-16");
    expect(component.filteredSessions().length).toBe(0);
    component.dateFilter.set("2026-09-15");
    expect(component.filteredSessions().length).toBe(2);
  });

  it("clearFilters resets search, activity, and date", () => {
    build();
    component.search.set("yo");
    component.activityFilter.set("Yoga");
    component.dateFilter.set("2026-09-15");
    component.clearFilters();
    expect(component.hasFilters()).toBe(false);
    expect(component.filteredSessions().length).toBe(2);
  });

  it("openSession navigates with the session in router state", () => {
    build();
    const s = session();
    component.openSession(s);
    expect(router.navigate).toHaveBeenCalledWith(["/member/sessions", s.id], { state: { session: s } });
  });
});
