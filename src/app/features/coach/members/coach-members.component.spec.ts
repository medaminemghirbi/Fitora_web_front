import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { CoachMember, CoachMembersService } from "../../../core/services/coach-members.service";
import { CoachMembersComponent } from "./coach-members.component";

function member(overrides: Partial<CoachMember> = {}): CoachMember {
  return {
    id: "m1",
    full_name: "Amira Trabelsi",
    phone: "20000000",
    email: null,
    last_seen_at: null,
    next_session_at: null,
    ...overrides,
  };
}

describe("CoachMembersComponent", () => {
  let fixture: ComponentFixture<CoachMembersComponent>;
  let component: CoachMembersComponent;
  let service: jasmine.SpyObj<CoachMembersService>;

  async function build(members: CoachMember[], fail = false) {
    service = jasmine.createSpyObj<CoachMembersService>("CoachMembersService", ["list"]);
    service.list.and.returnValue(
      fail
        ? throwError(() => new Error("down"))
        : (of({ members, meta: { page: 1, per_page: 20, total: members.length, total_pages: 1 } }) as never)
    );

    await TestBed.configureTestingModule({
      imports: [CoachMembersComponent, TranslateModule.forRoot()],
      providers: [{ provide: CoachMembersService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(CoachMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => jasmine.clock().install().mockDate(new Date("2026-09-19T12:00:00Z")));
  afterEach(() => jasmine.clock().uninstall());

  it("loads the coach's own members", async () => {
    await build([member()]);

    expect(component.members().length).toBe(1);
    expect(component.total()).toBe(1);
  });

  it("debounces a search into one request", fakeAsync(async () => {
    await build([member()]);
    service.list.calls.reset();

    component.onSearch("am");
    component.onSearch("ami");
    component.onSearch("amir");
    tick(300);

    expect(service.list).toHaveBeenCalledTimes(1);
    expect(service.list).toHaveBeenCalledWith({ q: "amir" });
  }));

  it("surfaces a failure rather than an empty list", async () => {
    await build([], true);

    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBe(false);
  });

  describe("#isLapsed", () => {
    it("flags someone long gone with nothing booked", async () => {
      await build([]);

      expect(component.isLapsed(member({ last_seen_at: "2026-08-01T10:00:00Z" }))).toBe(true);
    });

    it("does not flag someone who is coming back", async () => {
      await build([]);

      expect(
        component.isLapsed(
          member({ last_seen_at: "2026-08-01T10:00:00Z", next_session_at: "2026-09-20T10:00:00Z" })
        )
      ).toBe(false);
    });

    it("does not flag someone seen recently", async () => {
      await build([]);

      expect(component.isLapsed(member({ last_seen_at: "2026-09-15T10:00:00Z" }))).toBe(false);
    });

    it("does not flag someone who has never been — there is nothing to lapse from", async () => {
      await build([]);

      expect(component.isLapsed(member())).toBe(false);
    });
  });
});
