import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Booking } from "../../../core/models/booking.model";
import { MemberBookingsService } from "../../../core/services/member-bookings.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { MemberBookingsComponent } from "./member-bookings.component";

describe("MemberBookingsComponent", () => {
  let fixture: ComponentFixture<MemberBookingsComponent>;
  let component: MemberBookingsComponent;
  let service: jasmine.SpyObj<MemberBookingsService>;
  let confirm: ConfirmService;

  const booking = {
    id: "b1",
    status: "confirmed",
    session: { activity_name: "Boxe", activity_emoji: "🥊", starts_at: "2026-09-20T09:00:00Z" },
  } as never as Booking;

  beforeEach(() => {
    TestBed.resetTestingModule();
    service = jasmine.createSpyObj<MemberBookingsService>("MemberBookingsService", ["list", "cancel"]);
    service.list.and.returnValue(of({ bookings: [booking] }));
    service.cancel.and.returnValue(of({ booking }));

    TestBed.configureTestingModule({
      imports: [MemberBookingsComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MemberBookingsService, useValue: service },
      ],
    });

    fixture = TestBed.createComponent(MemberBookingsComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmService);
    fixture.detectChanges();
  });

  it("opens on what is coming, not on what already happened", () => {
    expect(component.when()).toBe("upcoming");
    expect(service.list).toHaveBeenCalledWith("upcoming");
  });

  it("switches to the past on request, once", () => {
    component.show("past");
    expect(service.list).toHaveBeenCalledWith("past");

    service.list.calls.reset();
    component.show("past");
    expect(service.list).not.toHaveBeenCalled();
  });

  it("asks before giving a place back, and does nothing when told no", async () => {
    const pending = component.cancel(booking);
    confirm.resolve(false);
    await pending;

    expect(service.cancel).not.toHaveBeenCalled();
  });

  it("cancels and reloads once confirmed", async () => {
    const pending = component.cancel(booking);
    confirm.resolve(true);
    await pending;

    expect(service.cancel).toHaveBeenCalledWith("b1");
    expect(component.cancelling()).toBeNull();
  });

  it("clears the busy flag when the cancellation is refused", async () => {
    service.cancel.and.returnValue(throwError(() => new Error("too late")));

    const pending = component.cancel(booking);
    confirm.resolve(true);
    await pending;

    expect(component.cancelling()).toBeNull();
  });
});
