import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, convertToParamMap } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { Subject, of, throwError } from "rxjs";
import { SupportTicket } from "../../../core/models/support-ticket.model";
import { SubscriptionInfo, SubscriptionService } from "../../../core/services/subscription.service";
import { SupportTicketsService } from "../../../core/services/support-tickets.service";
import { ToastService } from "../../../core/services/toast.service";
import { SubscriptionComponent } from "./subscription.component";

describe("SubscriptionComponent", () => {
  let fixture: ComponentFixture<SubscriptionComponent>;
  let component: SubscriptionComponent;
  let service: jasmine.SpyObj<SubscriptionService>;
  let ticketsService: jasmine.SpyObj<SupportTicketsService>;
  let toast: ToastService;

  const info: SubscriptionInfo = {
    subscription: { status: "active", expires_at: null, billing_period: "monthly", upgrade_requested_at: null, upgrade_requested_period: null } as never,
    locations_used: 1, clients_used: 10, staff_used: 2, locked: false, trial_days_remaining: null,
    on_trial: false, currency: "TND", currency_symbol: "DT", monthly_subscription_cents: 15000,
    annual_subscription_cents: 162000, annual_discount_percent: 10, debt_cents: 0, included_modules: [],
  };
  const ticket = { id: "t1", subject: "Help", status: "open" } as unknown as SupportTicket;

  function build(queryParams: Record<string, string> = {}): void {
    TestBed.resetTestingModule();
    service = jasmine.createSpyObj<SubscriptionService>("SubscriptionService", ["get", "requestUpgrade", "cancelUpgradeRequest"]);
    ticketsService = jasmine.createSpyObj<SupportTicketsService>("SupportTicketsService", ["list", "create"]);
    service.get.and.returnValue(of(info));
    ticketsService.list.and.returnValue(of({ support_tickets: [] }));

    TestBed.configureTestingModule({
      imports: [SubscriptionComponent, TranslateModule.forRoot()],
      providers: [
        { provide: SubscriptionService, useValue: service },
        { provide: SupportTicketsService, useValue: ticketsService },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } },
      ],
    });

    fixture = TestBed.createComponent(SubscriptionComponent);
    component = fixture.componentInstance;
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  }

  beforeEach(() => build());

  it("loads subscription info on init", () => {
    expect(component.info()).toEqual(info);
    expect(component.sub()).toEqual(info.subscription);
  });

  it("sets the error flag when loading fails", () => {
    service.get.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });

  it("switches to the contact tab when ?tab=contact is in the URL, loading tickets", () => {
    build({ tab: "contact" });
    expect(component.tab()).toBe("contact");
    expect(ticketsService.list).toHaveBeenCalled();
  });

  it("preferredPeriod adopts a pending upgrade request's period", () => {
    build();
    service.get.and.returnValue(
      of({ ...info, subscription: { ...info.subscription, upgrade_requested_period: "yearly" } as never })
    );
    component.load();
    expect(component.preferredPeriod()).toBe("yearly");
  });

  it("onTrial/upgradeRequested/billingPeriod reflect the loaded info", () => {
    expect(component.onTrial()).toBe(false);
    expect(component.upgradeRequested()).toBe(false);
    expect(component.billingPeriod()).toBe("monthly");
  });

  it("sub/onTrial/billingPeriod fall back before any info has loaded", () => {
    TestBed.resetTestingModule();
    const pendingService = jasmine.createSpyObj<SubscriptionService>("SubscriptionService", ["get", "requestUpgrade", "cancelUpgradeRequest"]);
    pendingService.get.and.returnValue(new Subject());
    const pendingTickets = jasmine.createSpyObj<SupportTicketsService>("SupportTicketsService", ["list", "create"]);
    TestBed.configureTestingModule({
      imports: [SubscriptionComponent, TranslateModule.forRoot()],
      providers: [
        { provide: SubscriptionService, useValue: pendingService },
        { provide: SupportTicketsService, useValue: pendingTickets },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    });
    const fresh = TestBed.createComponent(SubscriptionComponent);
    fresh.detectChanges();
    expect(fresh.componentInstance.sub()).toBeNull();
    expect(fresh.componentInstance.onTrial()).toBe(true);
    expect(fresh.componentInstance.billingPeriod()).toBeNull();
  });

  it("iconFor/featureName/featureDesc delegate to moduleIcon/i18n keys", () => {
    expect(component.iconFor("clients")).toBeTruthy();
    expect(component.featureName("clients")).toBe("modules.clients.name");
    expect(component.featureDesc("clients")).toBe("modules.clients.desc");
  });

  it("loadTickets stops loading even when it fails", () => {
    ticketsService.list.and.returnValue(throwError(() => new Error("nope")));
    component.setTab("contact");
    expect(component.loadingTickets()).toBe(false);
  });

  it("setTab('contact') loads tickets only once", () => {
    ticketsService.list.and.returnValue(of({ support_tickets: [ticket] }));
    component.setTab("contact");
    expect(component.tickets()).toEqual([ticket]);
    ticketsService.list.calls.reset();
    component.setTab("subscription");
    component.setTab("contact");
    expect(ticketsService.list).not.toHaveBeenCalled();
  });

  it("requestUpgrade sends the preferred period and updates info", () => {
    component.preferredPeriod.set("yearly");
    service.requestUpgrade.and.returnValue(of(info));
    component.requestUpgrade();
    expect(service.requestUpgrade).toHaveBeenCalledWith("yearly");
    expect(component.requesting()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("requestUpgrade shows an error toast on failure", () => {
    service.requestUpgrade.and.returnValue(throwError(() => new Error("nope")));
    component.requestUpgrade();
    expect(toast.toasts()[0].kind).toBe("error");
  });

  it("cancelRequest updates info on success", () => {
    service.cancelUpgradeRequest.and.returnValue(of(info));
    component.cancelRequest();
    expect(component.requesting()).toBe(false);
  });

  it("cancelRequest shows an error toast on failure", () => {
    service.cancelUpgradeRequest.and.returnValue(throwError(() => new Error("nope")));
    component.cancelRequest();
    expect(toast.toasts()[0].kind).toBe("error");
  });

  it("onFilesSelected accepts a valid file", () => {
    const input = document.createElement("input");
    const file = new File(["x"], "a.png", { type: "image/png" });
    Object.defineProperty(input, "files", { value: [file] });
    component.onFilesSelected({ target: input } as unknown as Event);
    expect(component.ticketFiles().length).toBe(1);
  });

  it("onFilesSelected treats a null FileList as empty", () => {
    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: null });
    component.onFilesSelected({ target: input } as unknown as Event);
    expect(component.ticketFiles().length).toBe(0);
    expect(component.ticketFileError()).toBeNull();
  });

  it("onFilesSelected rejects too many files", () => {
    const input = document.createElement("input");
    const files = Array.from({ length: 6 }, (_, i) => new File(["x"], `f${i}.png`, { type: "image/png" }));
    Object.defineProperty(input, "files", { value: files });
    component.onFilesSelected({ target: input } as unknown as Event);
    expect(component.ticketFiles().length).toBe(0);
    expect(component.ticketFileError()).toBeTruthy();
  });

  it("onFilesSelected rejects a disallowed type", () => {
    const input = document.createElement("input");
    const file = new File(["x"], "a.exe", { type: "application/x-msdownload" });
    Object.defineProperty(input, "files", { value: [file] });
    component.onFilesSelected({ target: input } as unknown as Event);
    expect(component.ticketFileError()).toBeTruthy();
  });

  it("removeFile drops the file at the given index", () => {
    component.ticketFiles.set([new File(["x"], "a.png"), new File(["x"], "b.png")]);
    component.removeFile(0);
    expect(component.ticketFiles().length).toBe(1);
  });

  it("submitTicket does nothing without a subject/message", () => {
    component.ticketSubject.set("");
    component.submitTicket();
    expect(ticketsService.create).not.toHaveBeenCalled();
  });

  it("submitTicket creates the ticket and resets the form", () => {
    component.ticketSubject.set("Help");
    component.ticketMessage.set("It broke");
    ticketsService.create.and.returnValue(of({ support_ticket: ticket }));
    component.submitTicket();
    expect(component.ticketSubject()).toBe("");
    expect(component.tickets()[0]).toEqual(ticket);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("submitTicket shows an error toast on failure", () => {
    component.ticketSubject.set("Help");
    component.ticketMessage.set("It broke");
    ticketsService.create.and.returnValue(throwError(() => new Error("nope")));
    component.submitTicket();
    expect(toast.toasts()[0].kind).toBe("error");
  });
});
