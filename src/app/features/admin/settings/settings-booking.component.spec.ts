import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Company, CompanySettings } from "../../../core/models/company.model";
import { CompanyService } from "../../../core/services/company.service";
import { ToastService } from "../../../core/services/toast.service";
import { SettingsBookingComponent } from "./settings-booking.component";

function settings(overrides: Partial<CompanySettings> = {}): CompanySettings {
  return {
    features: {
      bookings: true, spaces: false, attendance: true, revenue: true,
      reports: true, online_booking: true, waitlist: false,
    },
    booking: { cancellation_hours: 2, booking_opens_days: 14, no_show_consumes_session: true },
    hours: { start: "06:00", end: "22:00", working_days: [1, 2, 3, 4, 5] },
    branding: { primary_color: null },
    ...overrides,
  };
}

describe("SettingsBookingComponent", () => {
  let fixture: ComponentFixture<SettingsBookingComponent>;
  let component: SettingsBookingComponent;
  let companyService: jasmine.SpyObj<CompanyService>;

  async function build(initial = settings()) {
    companyService = jasmine.createSpyObj<CompanyService>("CompanyService", ["get", "update"]);
    companyService.get.and.returnValue(of({ company: { settings: initial } as Company }) as never);
    companyService.update.and.returnValue(of({ company: { settings: initial } as Company }) as never);

    await TestBed.configureTestingModule({
      imports: [SettingsBookingComponent, TranslateModule.forRoot()],
      providers: [
        { provide: CompanyService, useValue: companyService },
        { provide: ToastService, useValue: jasmine.createSpyObj("ToastService", ["success", "error"]) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it("loads the gym's own rules rather than assuming the defaults", async () => {
    await build(settings({ booking: { cancellation_hours: 24, booking_opens_days: 7, no_show_consumes_session: false } }));

    expect(component.settings()?.booking.cancellation_hours).toBe(24);
  });

  it("sends only the section that changed, so an unrelated rule cannot be clobbered", async () => {
    await build();

    component.setRule("cancellation_hours", 12);

    expect(companyService.update).toHaveBeenCalledWith({ settings: { booking: { cancellation_hours: 12 } } } as never);
  });

  it("saves a toggle immediately — a switch needing a Save button is a switch left unsaved", async () => {
    await build();

    component.setFeature("waitlist", true);

    expect(companyService.update).toHaveBeenCalledWith({ settings: { features: { waitlist: true } } } as never);
  });

  it("takes the server's version back, since it clamps and drops", async () => {
    await build();
    // The server refuses 10_000 hours and stores the ceiling instead.
    companyService.update.and.returnValue(
      of({ company: { settings: settings({ booking: { cancellation_hours: 168, booking_opens_days: 14, no_show_consumes_session: true } }) } as Company }) as never
    );

    component.setRule("cancellation_hours", 10_000);

    expect(component.settings()?.booking.cancellation_hours).toBe(168);
  });

  it("reloads after a failed save rather than leaving the guess on screen", async () => {
    await build();
    companyService.update.and.returnValue(throwError(() => new Error("nope")));
    companyService.get.calls.reset();

    component.setFeature("spaces", true);

    expect(companyService.get).toHaveBeenCalled();
  });

  it("hides the member-only rules when members do not book", async () => {
    await build(settings({
      features: { ...settings().features, online_booking: false },
    }));
    fixture.detectChanges();

    // A cancellation window and a booking horizon only bind members, so with
    // self-booking off there is nothing for them to govern.
    expect(fixture.nativeElement.querySelector("#sb-window")).toBeNull();
    expect(fixture.nativeElement.querySelector("#sb-horizon")).toBeNull();
    expect(fixture.nativeElement.querySelector("#sb-online")).toBeTruthy();
  });
});
