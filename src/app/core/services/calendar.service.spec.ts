import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { Session } from "../models/session.model";
import { CalendarService } from "./calendar.service";
import { SessionsService } from "./sessions.service";

describe("CalendarService", () => {
  let service: CalendarService;
  let sessionsStub: jasmine.SpyObj<SessionsService>;

  const session = {
    id: "s1",
    activity_name: "Yoga",
    starts_at: "2026-01-01T10:00:00Z",
    ends_at: "2026-01-01T11:00:00Z",
  } as unknown as Session;

  beforeEach(() => {
    sessionsStub = jasmine.createSpyObj<SessionsService>("SessionsService", ["range"]);
    TestBed.configureTestingModule({
      providers: [{ provide: SessionsService, useValue: sessionsStub }],
    });
    service = TestBed.inject(CalendarService);
  });

  it("maps sessions to calendar events", (done) => {
    sessionsStub.range.and.returnValue(of({ sessions: [session] }));

    service.range({ from: "2026-01-01", to: "2026-01-02" }).subscribe((events) => {
      expect(events).toEqual([
        {
          id: "s1",
          title: "Yoga",
          start: "2026-01-01T10:00:00Z",
          end: "2026-01-01T11:00:00Z",
          session,
        },
      ]);
      done();
    });

    expect(sessionsStub.range).toHaveBeenCalledWith({ from: "2026-01-01", to: "2026-01-02" });
  });
});
