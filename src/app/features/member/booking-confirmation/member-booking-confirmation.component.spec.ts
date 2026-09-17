import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { Booking } from "../../../core/models/booking.model";
import { MemberBookingConfirmationComponent } from "./member-booking-confirmation.component";

const booking: Booking = {
  id: "b1", status: "confirmed", amount: 45, currency: "TND", payment_status: "paid", created_at: "2026-09-15T10:00:00",
  covered_by: null, client: { id: "c1", full_name: "Jane", email: null, phone: null },
  session: {
    id: "s1", starts_at: "2026-09-15T18:30:00", ends_at: "2026-09-15T19:00:00", status: "scheduled",
    activity_name: "EMS", activity_emoji: "⚡", company_name: "Fit Studio", company_id: "g1",  coach_name: "Sarah",
  },
};

describe("MemberBookingConfirmationComponent", () => {
  let fixture: ComponentFixture<MemberBookingConfirmationComponent>;
  let component: MemberBookingConfirmationComponent;
  let router: Router;

  function build(state?: { booking: Booking }): void {
    history.pushState(state ?? {}, "");

    TestBed.configureTestingModule({
      imports: [MemberBookingConfirmationComponent, TranslateModule.forRoot()],
      providers: [provideRouter([])],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, "navigate");
    fixture = TestBed.createComponent(MemberBookingConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => history.replaceState({}, ""));

  it("reads the booking from router state", () => {
    build({ booking });
    expect(component.booking()).toEqual(booking);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("redirects to the bookings list when no state was passed", () => {
    build();
    expect(component.booking()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(["/member/bookings"]);
  });

  it("addToCalendar builds an .ics file with the session's details and triggers a download", () => {
    build({ booking });
    const clickSpy = spyOn(HTMLAnchorElement.prototype, "click");
    let downloadedLink: HTMLAnchorElement | null = null;
    spyOn(document.body, "appendChild").and.callFake(<T extends Node>(node: T) => {
      downloadedLink = node as unknown as HTMLAnchorElement;
      return node;
    });
    spyOn(URL, "createObjectURL").and.callFake((blob) => {
      (blob as Blob).text().then((text) => {
        expect(text).toContain("SUMMARY:EMS");
        expect(text).toContain("LOCATION:Fit Studio");
      });
      return "blob:fake-url";
    });

    component.addToCalendar();

    expect(clickSpy).toHaveBeenCalled();
    expect(downloadedLink!.download).toBe("EMS.ics");
  });
});
