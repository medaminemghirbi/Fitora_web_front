import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router, convertToParamMap } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Session } from "../../../core/models/session.model";
import { SessionsService } from "../../../core/services/sessions.service";
import { DeskCheckinComponent } from "./desk-checkin.component";

function session(overrides: Partial<Session> = {}): Session {
  return {
    id: "s1",
    activity_id: "a1",
    activity_name: "Pilates",
    coach_id: null,
    coach_name: null,
    starts_at: "2026-09-19T10:00:00Z",
    ends_at: "2026-09-19T11:00:00Z",
    capacity: 10,
    price: "20",
    status: "scheduled",
    ...overrides,
  } as Session;
}

describe("DeskCheckinComponent", () => {
  let fixture: ComponentFixture<DeskCheckinComponent>;
  let component: DeskCheckinComponent;
  let sessions: jasmine.SpyObj<SessionsService>;

  async function build(list: Session[], queryParam: string | null = null, fail = false) {
    sessions = jasmine.createSpyObj<SessionsService>("SessionsService", ["list"]);
    sessions.list.and.returnValue(
      fail
        ? throwError(() => new Error("down"))
        : (of({ sessions: list, meta: { page: 1, per_page: 20, total: list.length, total_pages: 1 } }) as never)
    );

    await TestBed.configureTestingModule({
      imports: [DeskCheckinComponent, TranslateModule.forRoot()],
      providers: [
        // The nested check-in panel fetches its own roster.
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SessionsService, useValue: sessions },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParam ? { session: queryParam } : {}) } },
        },
        { provide: Router, useValue: jasmine.createSpyObj<Router>("Router", ["navigate"]) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeskCheckinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it("only offers sessions that are actually running", async () => {
    await build([session(), session({ id: "s2", status: "cancelled" })]);

    expect(component.sessions().map((s) => s.id)).toEqual(["s1"]);
  });

  it("skips the picker when the day has exactly one session", async () => {
    await build([session()]);

    expect(component.selectedId()).toBe("s1");
  });

  it("shows the picker when there is a real choice to make", async () => {
    await build([session(), session({ id: "s2" })]);

    expect(component.selectedId()).toBeNull();
  });

  it("preselects the session named in the URL", async () => {
    await build([session(), session({ id: "s2" })], "s2");

    expect(component.selectedId()).toBe("s2");
    expect(component.selected()?.id).toBe("s2");
  });

  it("ignores a stale session id and falls back to the picker", async () => {
    await build([session(), session({ id: "s2" })], "yesterday");

    expect(component.selectedId()).toBeNull();
  });

  it("asks only for today's sessions", async () => {
    await build([session()]);

    const today = new Date().toISOString().slice(0, 10);
    expect(sessions.list).toHaveBeenCalledWith({ date: today });
  });

  it("surfaces a failure rather than an empty picker", async () => {
    await build([], null, true);

    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBe(false);
  });
});
