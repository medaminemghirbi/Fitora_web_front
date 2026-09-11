import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Booking } from "../../../core/models/booking.model";
import { BookingsService } from "../../../core/services/bookings.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { ToastService } from "../../../core/services/toast.service";
import { OwnerBookingsComponent } from "./bookings.component";

describe("OwnerBookingsComponent", () => {
  let fixture: ComponentFixture<OwnerBookingsComponent>;
  let component: OwnerBookingsComponent;
  let service: jasmine.SpyObj<BookingsService>;
  let confirmService: ConfirmService;
  let toast: ToastService;

  const meta = { page: 1, per_page: 20, total: 1, total_pages: 1 };
  const booking: Booking = {
    id: "b1",
    status: "confirmed",
    amount: 25,
    currency: "TND",
    payment_status: "paid",
    created_at: "2026-01-01T00:00:00Z",
    covered_by: null,
    client: { id: "cl1", full_name: "Amy Client", email: "amy@x.test", phone: null },
    session: {
      id: "s1",
      starts_at: "2026-01-02T10:00:00Z",
      ends_at: "2026-01-02T11:00:00Z",
      status: "scheduled",
      activity_name: "Yoga",
      activity_emoji: "🧘",
      location_name: "Main gym",
      coach_name: "Coach C",
    },
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<BookingsService>("BookingsService", ["list", "cancel", "remind"]);
    service.list.and.returnValue(of({ bookings: [booking], meta }));

    await TestBed.configureTestingModule({
      imports: [OwnerBookingsComponent, TranslateModule.forRoot()],
      providers: [{ provide: BookingsService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(OwnerBookingsComponent);
    component = fixture.componentInstance;
    confirmService = TestBed.inject(ConfirmService);
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it("loads bookings on init", () => {
    expect(service.list).toHaveBeenCalledWith({ status: undefined, date: undefined, q: undefined, page: 1 });
    expect(component.bookings().length).toBe(1);
  });

  it("sets the error flag when loading fails", () => {
    service.list.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });

  it("applyFilters resets to page 1 and forwards the filters", () => {
    component.page.set(3);
    component.statusFilter.set("confirmed");
    component.dateFilter.set("2026-01-01");
    component.applyFilters();
    expect(component.page()).toBe(1);
    expect(service.list).toHaveBeenCalledWith({ status: "confirmed", date: "2026-01-01", q: undefined, page: 1 });
  });

  it("hasFilters reflects any active filter", () => {
    expect(component.hasFilters()).toBe(false);
    component.statusFilter.set("confirmed");
    expect(component.hasFilters()).toBe(true);
  });

  it("resetFilters clears every filter and reloads", () => {
    component.statusFilter.set("confirmed");
    component.dateFilter.set("2026-01-01");
    component.search.set("amy");
    component.resetFilters();
    expect(component.hasFilters()).toBe(false);
    expect(service.list).toHaveBeenCalledWith({ status: undefined, date: undefined, q: undefined, page: 1 });
  });

  it("onSearchChange debounces the search", fakeAsync(() => {
    component.page.set(3);
    component.onSearchChange("amy");
    expect(service.list).not.toHaveBeenCalledWith(jasmine.objectContaining({ q: "amy" }));
    tick(1000);
    expect(component.page()).toBe(1);
    expect(service.list).toHaveBeenCalledWith({ status: undefined, date: undefined, q: "amy", page: 1 });
  }));

  it("onSearchChange cancels a pending debounce timer on rapid typing", fakeAsync(() => {
    component.onSearchChange("a");
    component.onSearchChange("am");
    tick(1000);
    expect(service.list).toHaveBeenCalledWith(jasmine.objectContaining({ q: "am" }));
  }));

  it("onPageChange loads the requested page", () => {
    component.onPageChange(2);
    expect(component.page()).toBe(2);
    expect(service.list).toHaveBeenCalledWith({ status: undefined, date: undefined, q: undefined, page: 2 });
  });

  it("cancel() does nothing when the confirmation is declined", async () => {
    spyOn(confirmService, "ask").and.resolveTo(false);
    await component.cancel(booking);
    expect(service.cancel).not.toHaveBeenCalled();
  });

  it("cancel() cancels and reloads on confirmation", async () => {
    spyOn(confirmService, "ask").and.resolveTo(true);
    service.cancel.and.returnValue(of({ booking }));
    await component.cancel(booking);
    expect(service.cancel).toHaveBeenCalledWith("b1");
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("cancel() shows an error toast on failure", async () => {
    spyOn(confirmService, "ask").and.resolveTo(true);
    service.cancel.and.returnValue(throwError(() => new Error("nope")));
    await component.cancel(booking);
    expect(toast.toasts()[0].kind).toBe("error");
  });

  it("remind() sends a reminder and shows a success toast", () => {
    service.remind.and.returnValue(of({ status: "sent" }));
    component.remind(booking);
    expect(component.remindingId()).toBeNull();
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("remind() shows an error toast on failure", () => {
    service.remind.and.returnValue(throwError(() => new Error("nope")));
    component.remind(booking);
    expect(component.remindingId()).toBeNull();
    expect(toast.toasts()[0].kind).toBe("error");
  });
});
