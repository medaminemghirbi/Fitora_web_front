import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AdminLeadsService, Lead } from "../../../core/services/leads.service";
import { AdminCompaniesService } from "../../../core/services/admin-companies.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { AdminLeadsComponent } from "./leads.component";

describe("AdminLeadsComponent", () => {
  let fixture: ComponentFixture<AdminLeadsComponent>;
  let component: AdminLeadsComponent;
  let service: jasmine.SpyObj<AdminLeadsService>;
  let confirm: ConfirmService;
  let companies: jasmine.SpyObj<AdminCompaniesService>;

  function waitingGym(id: string, askedAt: string, period: string | null = null) {
    return {
      id,
      name: `Gym ${id}`,
      city: "Sousse",
      owner: { full_name: "Amine", email: "amine@gym.test" },
      subscription: { upgrade_requested_at: askedAt, upgrade_requested_period: period },
    } as never;
  }

  const lead: Lead = {
    id: "l1",
    kind: "demo",
    status: "new_request",
    contact_name: "mghirbi",
    gym_name: "Gym Club",
    email: "test@gmail.com",
    phone: null,
    city: null,
    locale: "fr",
    message: null,
    internal_notes: null,
    handled_at: null,
    handled_by: null,
    company_id: null,
    created_at: "2026-09-18T16:16:43Z",
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    service = jasmine.createSpyObj<AdminLeadsService>("AdminLeadsService", ["list", "update", "convert"]);
    service.list.and.returnValue(
      of({ leads: [lead], counts: { all: 3, new_request: 1, contacted: 1, converted: 1 } })
    );
    service.update.and.returnValue(of({ lead }));
    service.convert.and.returnValue(
      of({
        lead: { ...lead, status: "converted" },
        company: { id: "c1", name: "Gym Club" },
        owner: { id: "u1", email: "test@gmail.com" },
        temporary_password: "a1b2c3d4e5f6",
      })
    );

    companies = jasmine.createSpyObj<AdminCompaniesService>("AdminCompaniesService", ["activationRequests"]);
    companies.activationRequests.and.returnValue(of({ companies: [] }));

    TestBed.configureTestingModule({
      imports: [AdminLeadsComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AdminLeadsService, useValue: service },
        { provide: AdminCompaniesService, useValue: companies },
      ],
    });

    fixture = TestBed.createComponent(AdminLeadsComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmService);
    fixture.detectChanges();
  });

  it("opens on every request, not a filtered slice", () => {
    expect(service.list).toHaveBeenCalledWith("");
    expect(component.leads().length).toBe(1);
  });

  it("counts what nobody has dealt with — new and contacted, never the closed ones", () => {
    expect(component.pendingCount()).toBe(2);
  });

  it("narrows by status, and does not refetch the one already shown", () => {
    component.filterBy("new_request");
    expect(service.list).toHaveBeenCalledWith("new_request");

    service.list.calls.reset();
    component.filterBy("new_request");
    expect(service.list).not.toHaveBeenCalled();
  });

  it("asks before opening an account, and does nothing when told no", async () => {
    const pending = component.convert(lead);
    confirm.resolve(false);
    await pending;

    expect(service.convert).not.toHaveBeenCalled();
  });

  // The password is not recoverable, so it has to survive on screen until
  // whoever opened the account dismisses it deliberately.
  it("holds the credentials on screen once the account is opened", async () => {
    const pending = component.convert(lead);
    confirm.resolve(true);
    await pending;

    expect(service.convert).toHaveBeenCalledWith("l1");
    expect(component.conversion()?.temporary_password).toBe("a1b2c3d4e5f6");
    expect(component.busy()).toBeNull();

    component.dismissConversion();
    expect(component.conversion()).toBeNull();
  });

  it("shows no credentials when opening the account fails", async () => {
    service.convert.and.returnValue(throwError(() => new Error("already converted")));

    const pending = component.convert(lead);
    confirm.resolve(true);
    await pending;

    expect(component.conversion()).toBeNull();
    expect(component.busy()).toBeNull();
  });

  it("keeps the note when moving a request along the funnel", () => {
    component.open(lead);
    component.notes.set("Rappelé lundi, prix évoqué.");
    component.save("contacted");

    expect(service.update).toHaveBeenCalledWith("l1", {
      status: "contacted",
      internal_notes: "Rappelé lundi, prix évoqué.",
    });
  });

  it("offers a retry rather than an empty inbox when the list will not load", () => {
    service.list.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });

  // Activation requests used to surface only on a company's own page, found
  // by whoever happened to open it. They are an inbox now.
  describe("the activations queue", () => {
    it("opens on activations, not on new gyms", () => {
      expect(component.queue()).toBe("activations");
      expect(companies.activationRequests).toHaveBeenCalled();
    });

    it("counts the days a gym has been waiting", () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString();
      expect(component.waitingDays(waitingGym("a", threeDaysAgo))).toBe(3);
    });

    it("reads zero for a gym with no request at all, rather than a date from 1970", () => {
      expect(component.waitingDays({ subscription: null } as never)).toBe(0);
    });

    it("offers a retry rather than an empty queue when it will not load", () => {
      companies.activationRequests.and.returnValue(throwError(() => new Error("nope")));
      component.loadActivations();
      expect(component.activationsError()).toBe(true);
    });

    it("switches to the other queue on request", () => {
      component.showQueue("leads");
      expect(component.queue()).toBe("leads");
    });
  });
});

