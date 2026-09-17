import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Session } from "../../../core/models/session.model";
import { BrandingService } from "../../../core/services/branding.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { MemberBookingsService } from "../../../core/services/member-bookings.service";
import { MemberSessionsService } from "../../../core/services/member-sessions.service";
import { ToastService } from "../../../core/services/toast.service";
import { MemberSessionDetailComponent } from "./member-session-detail.component";

function session(overrides: Partial<Session> = {}): Session {
  return {
    id: "s1", activity_id: "a1", activity_name: "EMS", activity_emoji: "⚡",
    company_name: "Fit Studio", company_id: "g1",  coach_id: "co1", coach_name: "Sarah", starts_at: "2026-09-15T18:30:00",
    ends_at: "2026-09-15T19:00:00", capacity: 10, confirmed_count: 8, price: 45, status: "scheduled",
    availability: "available", already_booked: false, ...overrides,
  };
}

describe("MemberSessionDetailComponent", () => {
  let fixture: ComponentFixture<MemberSessionDetailComponent>;
  let component: MemberSessionDetailComponent;
  let sessionsService: jasmine.SpyObj<MemberSessionsService>;
  let bookingsService: jasmine.SpyObj<MemberBookingsService>;
  let confirm: ConfirmService;
  let toast: ToastService;
  let router: Router;

  function build(id: string, stateSession?: Session): void {
    if (stateSession) {
      history.pushState({ session: stateSession }, "");
    } else {
      history.pushState({}, "");
    }

    TestBed.configureTestingModule({
      imports: [MemberSessionDetailComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: MemberSessionsService, useValue: sessionsService },
        { provide: MemberBookingsService, useValue: bookingsService },
        { provide: BrandingService, useValue: { branding: () => ({ currency_symbol: "TND" }) } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id }) } } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, "navigate");
    confirm = TestBed.inject(ConfirmService);
    toast = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(MemberSessionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    sessionsService = jasmine.createSpyObj<MemberSessionsService>("MemberSessionsService", ["list"]);
    bookingsService = jasmine.createSpyObj<MemberBookingsService>("MemberBookingsService", ["create"]);
  });

  afterEach(() => history.replaceState({}, ""));

  it("uses the session passed via router state, with no fetch", () => {
    build("s1", session());
    expect(component.session()).toEqual(session());
    expect(component.loading()).toBe(false);
    expect(sessionsService.list).not.toHaveBeenCalled();
  });

  it("falls back to fetching the list when no state was passed (e.g. a hard refresh)", () => {
    sessionsService.list.and.returnValue(of({ sessions: [session()] }));
    build("s1");
    expect(component.session()).toEqual(session());
    expect(component.notFound()).toBe(false);
  });

  it("flags not-found when the session id isn't in the fetched list", () => {
    sessionsService.list.and.returnValue(of({ sessions: [] }));
    build("missing");
    expect(component.notFound()).toBe(true);
    expect(component.session()).toBeNull();
  });

  it("flags not-found when the fallback fetch errors", () => {
    sessionsService.list.and.returnValue(throwError(() => new Error("nope")));
    build("s1");
    expect(component.notFound()).toBe(true);
  });

  it("computes duration in minutes from starts_at/ends_at", () => {
    build("s1", session());
    expect(component.durationMinutes()).toBe(30);
  });

  it("book() does nothing when the user cancels the confirm dialog", async () => {
    build("s1", session());
    spyOn(confirm, "ask").and.resolveTo(false);
    await component.book();
    expect(bookingsService.create).not.toHaveBeenCalled();
  });

  it("book() creates the booking and navigates to the confirmation screen", async () => {
    build("s1", session());
    spyOn(confirm, "ask").and.resolveTo(true);
    const created = { id: "b1" } as never;
    bookingsService.create.and.returnValue(of({ booking: created }));

    await component.book();

    expect(bookingsService.create).toHaveBeenCalledWith("s1");
    expect(component.booking()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(["/member/bookings", "b1", "confirmed"], { state: { booking: created } });
  });

  it("book() shows an error toast on failure", async () => {
    build("s1", session());
    spyOn(confirm, "ask").and.resolveTo(true);
    bookingsService.create.and.returnValue(throwError(() => new Error("nope")));

    await component.book();

    expect(component.booking()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("error");
  });
});
