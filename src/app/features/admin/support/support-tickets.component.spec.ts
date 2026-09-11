import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AdminSupportTicket } from "../../../core/models/support-ticket.model";
import { AdminSupportTicketsService } from "../../../core/services/admin-support-tickets.service";
import { ToastService } from "../../../core/services/toast.service";
import { AdminSupportTicketsComponent } from "./support-tickets.component";

describe("AdminSupportTicketsComponent", () => {
  let fixture: ComponentFixture<AdminSupportTicketsComponent>;
  let component: AdminSupportTicketsComponent;
  let service: jasmine.SpyObj<AdminSupportTicketsService>;
  let toast: ToastService;

  const ticket: AdminSupportTicket = {
    id: "t1",
    subject: "Help",
    message: "Something's broken",
    status: "open",
    created_at: "2026-01-01T00:00:00Z",
    attachments: [],
    company: { id: "co1", name: "Acme Gym" },
    created_by: { id: "u1", full_name: "Sami Owner", email: "sami@x.test" },
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<AdminSupportTicketsService>("AdminSupportTicketsService", ["list", "resolve"]);
    service.list.and.returnValue(of({ support_tickets: [ticket], meta: { page: 1, per_page: 20, total: 1, total_pages: 1 } }));

    await TestBed.configureTestingModule({
      imports: [AdminSupportTicketsComponent, TranslateModule.forRoot()],
      providers: [{ provide: AdminSupportTicketsService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSupportTicketsComponent);
    component = fixture.componentInstance;
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it("loads open tickets by default", () => {
    expect(service.list).toHaveBeenCalledWith("open");
    expect(component.tickets().length).toBe(1);
  });

  it("sets the error flag when loading fails", () => {
    service.list.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });

  it("setFilter('all') reloads with no status filter", () => {
    component.setFilter("all");
    expect(component.filter()).toBe("all");
    expect(service.list).toHaveBeenCalledWith(undefined);
  });

  it("open()/close() track the selected ticket", () => {
    component.open(ticket);
    expect(component.selected()).toBe(ticket);
    component.close();
    expect(component.selected()).toBeNull();
  });

  it("resolve() removes the ticket from an 'open' list and shows a success toast", () => {
    const resolved = { ...ticket, status: "resolved" } as AdminSupportTicket;
    service.resolve.and.returnValue(of({ support_ticket: resolved }));

    component.resolve(ticket);

    expect(component.resolving()).toBe(false);
    expect(component.selected()).toEqual(resolved);
    expect(component.tickets().length).toBe(0);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("resolve() updates in place (not removed) when filter is 'all'", () => {
    component.setFilter("all");
    const resolved = { ...ticket, status: "resolved" } as AdminSupportTicket;
    service.resolve.and.returnValue(of({ support_ticket: resolved }));

    component.resolve(ticket);

    expect(component.tickets()[0]).toEqual(resolved);
  });

  it("resolve() shows an error toast on failure", () => {
    service.resolve.and.returnValue(throwError(() => new Error("nope")));
    component.resolve(ticket);
    expect(component.resolving()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("error");
  });
});
