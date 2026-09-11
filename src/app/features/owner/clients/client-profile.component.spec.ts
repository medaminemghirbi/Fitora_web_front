import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, convertToParamMap } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Activity } from "../../../core/models/activity.model";
import { Booking } from "../../../core/models/booking.model";
import { ClientDetail } from "../../../core/models/client.model";
import { Contract } from "../../../core/models/contract.model";
import { ContractType } from "../../../core/models/contract-type.model";
import { Payment } from "../../../core/models/payment.model";
import { Session } from "../../../core/models/session.model";
import { ActivitiesService } from "../../../core/services/activities.service";
import { AttendanceService } from "../../../core/services/attendance.service";
import { BookingsService } from "../../../core/services/bookings.service";
import { ClientsService } from "../../../core/services/clients.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { ContractTypesService } from "../../../core/services/contract-types.service";
import { ContractsService } from "../../../core/services/contracts.service";
import { PaymentsService } from "../../../core/services/payments.service";
import { SessionsService } from "../../../core/services/sessions.service";
import { ToastService } from "../../../core/services/toast.service";
import { ClientProfileComponent } from "./client-profile.component";

describe("ClientProfileComponent", () => {
  let fixture: ComponentFixture<ClientProfileComponent>;
  let component: ClientProfileComponent;
  let clientsService: jasmine.SpyObj<ClientsService>;
  let contractTypesService: jasmine.SpyObj<ContractTypesService>;
  let contractsService: jasmine.SpyObj<ContractsService>;
  let activitiesService: jasmine.SpyObj<ActivitiesService>;
  let sessionsService: jasmine.SpyObj<SessionsService>;
  let bookingsService: jasmine.SpyObj<BookingsService>;
  let paymentsService: jasmine.SpyObj<PaymentsService>;
  let attendanceService: jasmine.SpyObj<AttendanceService>;
  let confirmService: ConfirmService;
  let toast: ToastService;

  const contractType: ContractType = {
    id: "ct1", company_id: "1", name: "Basic", description: null, price: 100, currency: "TND",
    billing_period: "monthly", duration_days: 30, session_count: 8, unlimited_bookings: false,
    booking_limit: null, priority_booking: false, color: "#000", active: true, location_ids: [], activity_ids: [],
  };
  const contract: Contract = {
    id: "m1", current_period_id: "p1", status: "active",
    starts_at: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    expires_at: new Date(Date.now() + 25 * 86_400_000).toISOString(),
    remaining_bookings: 5, auto_renew: true, discount: "0", final_price: "100",
    payment_status: "paid", amount_due: "0", plan: contractType, client: { id: "cl1", full_name: "Amy", phone: null },
  };
  const activity: Activity = {
    id: "a1", company_id: "1", name: "Yoga", emoji: "🧘", description: null,
    session_format: "collective", duration: 60, capacity: 20, active: true,
  } as never;
  const session: Session = { id: "s1", starts_at: "2026-01-05T10:00:00Z", ends_at: "2026-01-05T11:00:00Z" } as never;
  const booking: Booking = {
    id: "b1", status: "confirmed", amount: 20, currency: "TND", payment_status: "unpaid",
    created_at: "2026-01-01T00:00:00Z", covered_by: null,
    client: { id: "cl1", full_name: "Amy Client", email: null, phone: null },
    session: { id: "s1", starts_at: new Date().toISOString(), ends_at: "2026-01-01T11:00:00Z", status: "scheduled", activity_name: "Yoga", activity_emoji: "🧘", location_name: "Main", coach_name: null },
  };
  const payment: Payment = {
    id: "pay1", amount: 20, currency: "TND", payment_method: "cash", status: "paid", notes: null,
    paid_at: "2026-01-01", created_at: "2026-01-01", client: { id: "cl1", full_name: "Amy", phone: null },
    company: { id: "co1", name: "Acme" }, created_by: null, product_name: null,
  };
  const client: ClientDetail = {
    id: "cl1", first_name: "Amy", last_name: "Client", full_name: "Amy Client", email: null, phone: "123",
    active: true, login_enabled: false, email_verified: false, joined_at: "2026-01-01",
    current_contract: contract, date_of_birth: null, gender: null, address: null,
    emergency_contact_name: null, emergency_contact_phone: null, notes: "some notes",
    outstanding_balance: "0", attendance_rate: null, last_visit_at: null,
  };

  beforeEach(async () => {
    clientsService = jasmine.createSpyObj<ClientsService>("ClientsService", ["get", "update", "setLogin"]);
    contractTypesService = jasmine.createSpyObj<ContractTypesService>("ContractTypesService", ["list"]);
    contractsService = jasmine.createSpyObj<ContractsService>("ContractsService", ["create", "update", "renew", "cancel", "destroy", "receipt"]);
    activitiesService = jasmine.createSpyObj<ActivitiesService>("ActivitiesService", ["list"]);
    sessionsService = jasmine.createSpyObj<SessionsService>("SessionsService", ["list"]);
    bookingsService = jasmine.createSpyObj<BookingsService>("BookingsService", ["create", "cancel"]);
    paymentsService = jasmine.createSpyObj<PaymentsService>("PaymentsService", ["record"]);
    attendanceService = jasmine.createSpyObj<AttendanceService>("AttendanceService", ["mark"]);

    clientsService.get.and.returnValue(of({ client, contracts: [contract], bookings: [booking], payments: [payment] }));
    contractTypesService.list.and.returnValue(of({ plans: [contractType] }));
    activitiesService.list.and.returnValue(of({ activities: [activity] }));
    // Default stub — the booking form's activity/date valueChanges are wired
    // up in ngOnInit, so any incidental patch of those fields (e.g. in
    // submitBooking tests below) fires onBookingFiltersChange() too.
    sessionsService.list.and.returnValue(of({ sessions: [], meta: { page: 1, per_page: 20, total: 0, total_pages: 1 } }));

    await TestBed.configureTestingModule({
      imports: [ClientProfileComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ClientsService, useValue: clientsService },
        { provide: ContractTypesService, useValue: contractTypesService },
        { provide: ContractsService, useValue: contractsService },
        { provide: ActivitiesService, useValue: activitiesService },
        { provide: SessionsService, useValue: sessionsService },
        { provide: BookingsService, useValue: bookingsService },
        { provide: PaymentsService, useValue: paymentsService },
        { provide: AttendanceService, useValue: attendanceService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: "cl1" }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientProfileComponent);
    component = fixture.componentInstance;
    confirmService = TestBed.inject(ConfirmService);
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it("loads the client bundle, contract types and activities on init", () => {
    expect(component.client()).toEqual(client);
    expect(component.contracts()).toEqual([contract]);
    expect(component.contractTypes().length).toBe(1);
    expect(component.activities().length).toBe(1);
    expect(component.notesForm.value.notes).toBe("some notes");
    expect(component.contractProgress()).not.toBeNull();
  });

  it("sets the error flag when loading fails", () => {
    clientsService.get.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });

  it("setTab switches the active tab", () => {
    component.setTab("contracts");
    expect(component.activeTab()).toBe("contracts");
  });

  it("bookingsWithAttendance keeps only confirmed/completed/no_show", () => {
    component.bookings.set([
      { ...booking, status: "confirmed" },
      { ...booking, status: "cancelled" },
      { ...booking, status: "completed" },
    ]);
    expect(component.bookingsWithAttendance().length).toBe(2);
  });

  it("balanceTone is danger for a positive balance, success otherwise", () => {
    expect(component.balanceTone(10)).toBe("danger");
    expect(component.balanceTone(0)).toBe("success");
  });

  it("aboRows maps each contract to a progress row", () => {
    const rows = component.aboRows();
    expect(rows.length).toBe(1);
    expect(rows[0].sessionCount).toBe(8);
  });

  it("selectedPlan / contractFormTotal reflect the chosen plan and discount", () => {
    expect(component.selectedPlan()).toBeNull();
    component.contractForm.patchValue({ contract_type_id: "ct1", discount: 20 });
    expect(component.selectedPlan()).toEqual(contractType);
    expect(component.contractFormTotal()).toBe(80);
  });

  it("contractFormTotal clamps at 0", () => {
    component.contractForm.patchValue({ contract_type_id: "ct1", discount: 500 });
    expect(component.contractFormTotal()).toBe(0);
  });

  describe("contract create/edit", () => {
    it("openContractModal resets the form and opens it", () => {
      component.openContractModal();
      expect(component.contractModalOpen()).toBe(true);
    });

    it("closeContractModal closes it", () => {
      component.contractModalOpen.set(true);
      component.closeContractModal();
      expect(component.contractModalOpen()).toBe(false);
    });

    it("submitContract does nothing with an invalid form", () => {
      component.submitContract();
      expect(contractsService.create).not.toHaveBeenCalled();
    });

    it("submitContract creates the contract and reloads", () => {
      component.contractForm.patchValue({ contract_type_id: "ct1" });
      contractsService.create.and.returnValue(of({ contract, payment: null }));
      component.submitContract();
      expect(component.contractModalOpen()).toBe(false);
      expect(toast.toasts()[0].kind).toBe("success");
    });

    it("submitContract shows the backend error on failure", () => {
      component.contractForm.patchValue({ contract_type_id: "ct1" });
      contractsService.create.and.returnValue(throwError(() => new Error("nope")));
      component.submitContract();
      expect(component.formError()).toBeTruthy();
    });

    it("openEditModal disables the discount control for a paid contract", () => {
      component.openEditModal(contract);
      expect(component.editModalOpen()).toBe(true);
      expect(component.editForm.controls.discount.disabled).toBe(true);
    });

    it("openEditModal keeps discount enabled for an unpaid contract", () => {
      component.openEditModal({ ...contract, payment_status: "unpaid" });
      expect(component.editForm.controls.discount.disabled).toBe(false);
    });

    it("closeEditModal clears the editing contract", () => {
      component.openEditModal(contract);
      component.closeEditModal();
      expect(component.editModalOpen()).toBe(false);
      expect(component.editingContract()).toBeNull();
    });

    it("submitEdit does nothing without an editing contract", () => {
      component.submitEdit();
      expect(contractsService.update).not.toHaveBeenCalled();
    });

    it("submitEdit saves and reloads", () => {
      component.openEditModal({ ...contract, payment_status: "unpaid" });
      contractsService.update.and.returnValue(of({ contract }));
      component.submitEdit();
      expect(component.editModalOpen()).toBe(false);
      expect(toast.toasts()[0].kind).toBe("success");
    });

    it("submitEdit shows the backend error on failure", () => {
      component.openEditModal({ ...contract, payment_status: "unpaid" });
      contractsService.update.and.returnValue(throwError(() => new Error("nope")));
      component.submitEdit();
      expect(component.formError()).toBeTruthy();
    });
  });

  describe("contract actions", () => {
    it("collectPayment does nothing without a current period", async () => {
      await component.collectPayment({ ...contract, current_period_id: null });
      expect(paymentsService.record).not.toHaveBeenCalled();
    });

    it("collectPayment does nothing when declined", async () => {
      spyOn(confirmService, "ask").and.resolveTo(false);
      await component.collectPayment(contract);
      expect(paymentsService.record).not.toHaveBeenCalled();
    });

    it("collectPayment records the payment on confirmation", async () => {
      spyOn(confirmService, "ask").and.resolveTo(true);
      paymentsService.record.and.returnValue(of({ payment }));
      await component.collectPayment(contract);
      expect(paymentsService.record).toHaveBeenCalledWith({ client_id: "cl1", payment_method: "cash", contract_period_id: "p1" });
      expect(toast.toasts()[0].kind).toBe("success");
    });

    it("collectPayment shows an error toast on failure", async () => {
      spyOn(confirmService, "ask").and.resolveTo(true);
      paymentsService.record.and.returnValue(throwError(() => new Error("nope")));
      await component.collectPayment(contract);
      expect(toast.toasts()[0].kind).toBe("error");
    });

    it("downloadReceipt fetches the receipt blob without erroring", () => {
      contractsService.receipt.and.returnValue(of(new Blob(["x"], { type: "application/pdf" })));
      expect(() => component.downloadReceipt(contract)).not.toThrow();
      expect(contractsService.receipt).toHaveBeenCalledWith("m1");
    });

    it("downloadReceipt shows an error toast on failure", () => {
      contractsService.receipt.and.returnValue(throwError(() => new Error("nope")));
      component.downloadReceipt(contract);
      expect(toast.toasts()[0].kind).toBe("error");
    });

    it("renewContract does nothing when declined", async () => {
      spyOn(confirmService, "ask").and.resolveTo(false);
      await component.renewContract(contract);
      expect(contractsService.renew).not.toHaveBeenCalled();
    });

    it("renewContract renews on confirmation", async () => {
      spyOn(confirmService, "ask").and.resolveTo(true);
      contractsService.renew.and.returnValue(of({ contract }));
      await component.renewContract(contract);
      expect(toast.toasts()[0].kind).toBe("success");
    });

    it("renewContract shows an error toast on failure", async () => {
      spyOn(confirmService, "ask").and.resolveTo(true);
      contractsService.renew.and.returnValue(throwError(() => new Error("nope")));
      await component.renewContract(contract);
      expect(toast.toasts()[0].kind).toBe("error");
    });

    it("cancelContract cancels on confirmation", async () => {
      spyOn(confirmService, "ask").and.resolveTo(true);
      contractsService.cancel.and.returnValue(of({ contract }));
      await component.cancelContract(contract);
      expect(toast.toasts()[0].kind).toBe("success");
    });

    it("cancelContract does nothing when declined", async () => {
      spyOn(confirmService, "ask").and.resolveTo(false);
      await component.cancelContract(contract);
      expect(contractsService.cancel).not.toHaveBeenCalled();
    });

    it("cancelContract shows an error toast on failure", async () => {
      spyOn(confirmService, "ask").and.resolveTo(true);
      contractsService.cancel.and.returnValue(throwError(() => new Error("nope")));
      await component.cancelContract(contract);
      expect(toast.toasts()[0].kind).toBe("error");
    });

    it("deleteContract destroys on confirmation", async () => {
      spyOn(confirmService, "ask").and.resolveTo(true);
      contractsService.destroy.and.returnValue(of(undefined));
      await component.deleteContract(contract);
      expect(toast.toasts()[0].kind).toBe("success");
    });

    it("deleteContract does nothing when declined", async () => {
      spyOn(confirmService, "ask").and.resolveTo(false);
      await component.deleteContract(contract);
      expect(contractsService.destroy).not.toHaveBeenCalled();
    });

    it("deleteContract shows an error toast on failure", async () => {
      spyOn(confirmService, "ask").and.resolveTo(true);
      contractsService.destroy.and.returnValue(throwError(() => new Error("nope")));
      await component.deleteContract(contract);
      expect(toast.toasts()[0].kind).toBe("error");
    });
  });

  describe("booking", () => {
    it("openBookingModal resets the form and clears sessions", () => {
      component.availableSessions.set([session]);
      component.openBookingModal();
      expect(component.bookingModalOpen()).toBe(true);
      expect(component.availableSessions()).toEqual([]);
    });

    it("closeBookingModal closes it", () => {
      component.bookingModalOpen.set(true);
      component.closeBookingModal();
      expect(component.bookingModalOpen()).toBe(false);
    });

    it("onBookingFiltersChange clears sessions without an activity/date", () => {
      component.bookingForm.patchValue({ activity_id: null, date: "" });
      component.onBookingFiltersChange();
      expect(component.availableSessions()).toEqual([]);
      expect(sessionsService.list).not.toHaveBeenCalled();
    });

    it("onBookingFiltersChange loads sessions once activity+date are set", () => {
      sessionsService.list.and.returnValue(of({ sessions: [session], meta: { page: 1, per_page: 20, total: 1, total_pages: 1 } }));
      component.bookingForm.patchValue({ activity_id: "a1", date: "2026-01-05" });
      expect(component.availableSessions()).toEqual([session]);
    });

    it("submitBooking does nothing with an invalid form", () => {
      component.submitBooking();
      expect(bookingsService.create).not.toHaveBeenCalled();
    });

    it("submitBooking creates the booking and reloads", () => {
      component.bookingForm.setValue({ activity_id: "a1", date: "2026-01-05", session_id: "s1" });
      bookingsService.create.and.returnValue(of({ booking }));
      component.submitBooking();
      expect(component.bookingModalOpen()).toBe(false);
      expect(toast.toasts()[0].kind).toBe("success");
    });

    it("submitBooking shows the backend error on failure", () => {
      component.bookingForm.setValue({ activity_id: "a1", date: "2026-01-05", session_id: "s1" });
      bookingsService.create.and.returnValue(throwError(() => new Error("nope")));
      component.submitBooking();
      expect(component.formError()).toBeTruthy();
    });

    it("cancelBooking cancels on confirmation", async () => {
      spyOn(confirmService, "ask").and.resolveTo(true);
      bookingsService.cancel.and.returnValue(of({ booking }));
      await component.cancelBooking(booking);
      expect(toast.toasts()[0].kind).toBe("success");
    });

    it("cancelBooking does nothing when declined", async () => {
      spyOn(confirmService, "ask").and.resolveTo(false);
      await component.cancelBooking(booking);
      expect(bookingsService.cancel).not.toHaveBeenCalled();
    });

    it("cancelBooking shows an error toast on failure", async () => {
      spyOn(confirmService, "ask").and.resolveTo(true);
      bookingsService.cancel.and.returnValue(throwError(() => new Error("nope")));
      await component.cancelBooking(booking);
      expect(toast.toasts()[0].kind).toBe("error");
    });
  });

  describe("payment", () => {
    it("openPaymentModal builds payable options from unpaid, non-zero bookings", () => {
      component.bookings.set([booking, { ...booking, id: "b2", payment_status: "paid" }, { ...booking, id: "b3", amount: 0 }]);
      component.openPaymentModal();
      expect(component.paymentModalOpen()).toBe(true);
      expect(component.paymentPayableOptions().length).toBe(1);
    });

    it("closePaymentModal closes it", () => {
      component.paymentModalOpen.set(true);
      component.closePaymentModal();
      expect(component.paymentModalOpen()).toBe(false);
    });

    it("submitPayment does nothing with an invalid form", () => {
      component.submitPayment();
      expect(paymentsService.record).not.toHaveBeenCalled();
    });

    it("submitPayment records a booking payment and reloads", () => {
      component.paymentForm.setValue({ payable_key: "booking:b1", notes: "" });
      paymentsService.record.and.returnValue(of({ payment }));
      component.submitPayment();
      expect(paymentsService.record).toHaveBeenCalledWith({
        client_id: "cl1", payment_method: "cash", notes: undefined, contract_period_id: undefined, booking_id: "b1",
      });
      expect(component.paymentModalOpen()).toBe(false);
    });

    it("submitPayment shows the backend error on failure", () => {
      component.paymentForm.setValue({ payable_key: "booking:b1", notes: "" });
      paymentsService.record.and.returnValue(throwError(() => new Error("nope")));
      component.submitPayment();
      expect(component.formError()).toBeTruthy();
    });
  });

  describe("check-in", () => {
    it("shows an info toast when there is no session today", () => {
      component.bookings.set([]);
      component.checkIn();
      expect(toast.toasts()[0].kind).toBe("info");
      expect(attendanceService.mark).not.toHaveBeenCalled();
    });

    it("marks today's confirmed booking present", () => {
      component.bookings.set([booking]);
      attendanceService.mark.and.returnValue(of({ attendance: booking as never }));
      component.checkIn();
      expect(attendanceService.mark).toHaveBeenCalledWith("b1", "present");
      expect(toast.toasts()[0].kind).toBe("success");
    });

    it("shows an error toast when marking fails", () => {
      component.bookings.set([booking]);
      attendanceService.mark.and.returnValue(throwError(() => new Error("nope")));
      component.checkIn();
      expect(toast.toasts()[0].kind).toBe("error");
    });
  });

  describe("notes", () => {
    it("saveNotes saves and shows a success toast", () => {
      clientsService.update.and.returnValue(of({ client }));
      component.saveNotes();
      expect(clientsService.update).toHaveBeenCalledWith("cl1", { notes: "some notes" });
      expect(component.notesSaving()).toBe(false);
      expect(toast.toasts()[0].kind).toBe("success");
    });

    it("saveNotes shows an error toast on failure", () => {
      clientsService.update.and.returnValue(throwError(() => new Error("nope")));
      component.saveNotes();
      expect(toast.toasts()[0].kind).toBe("error");
    });
  });

  describe("mobile login", () => {
    it("openLoginModal resets the form", () => {
      component.openLoginModal();
      expect(component.loginModalOpen()).toBe(true);
    });

    it("closeLoginModal closes it", () => {
      component.loginModalOpen.set(true);
      component.closeLoginModal();
      expect(component.loginModalOpen()).toBe(false);
    });

    it("submitLogin does nothing with an invalid form", () => {
      component.submitLogin();
      expect(clientsService.setLogin).not.toHaveBeenCalled();
    });

    it("submitLogin sets the login and reloads", () => {
      component.loginForm.setValue({ password: "secret123" });
      clientsService.setLogin.and.returnValue(of({ client }));
      component.submitLogin();
      expect(component.loginModalOpen()).toBe(false);
      expect(toast.toasts()[0].kind).toBe("success");
    });

    it("submitLogin shows the backend error on failure", () => {
      component.loginForm.setValue({ password: "secret123" });
      clientsService.setLogin.and.returnValue(throwError(() => new Error("nope")));
      component.submitLogin();
      expect(component.loginFormError()).toBeTruthy();
    });
  });
});
