import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { SupportTicket } from "../../../core/models/support-ticket.model";
import { SupportTicketsService } from "../../../core/services/support-tickets.service";
import { ToastService } from "../../../core/services/toast.service";
import { AdminSupportComponent } from "./support.component";

describe("AdminSupportComponent", () => {
  let fixture: ComponentFixture<AdminSupportComponent>;
  let component: AdminSupportComponent;
  let service: jasmine.SpyObj<SupportTicketsService>;
  let toast: ToastService;

  const ticket: SupportTicket = {
    id: "t1",
    subject: "Help",
    message: "Something's broken",
    status: "open",
    kind: "general",
    contact_phone: null,
    created_at: "2026-01-01T00:00:00Z",
    attachments: [],
  };

  const file = (name: string, type = "image/png", size = 10) =>
    Object.defineProperty(new File(["x"], name, { type }), "size", { value: size });

  const pick = (...files: File[]) =>
    ({ target: { files, value: "keep" } }) as unknown as Event;

  beforeEach(async () => {
    service = jasmine.createSpyObj<SupportTicketsService>("SupportTicketsService", ["list", "create"]);
    service.list.and.returnValue(of({ support_tickets: [ticket] }));

    await TestBed.configureTestingModule({
      imports: [AdminSupportComponent, TranslateModule.forRoot()],
      providers: [{ provide: SupportTicketsService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSupportComponent);
    component = fixture.componentInstance;
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it("loads the gym's own tickets on arrival", () => {
    expect(service.list).toHaveBeenCalled();
    expect(component.tickets()).toEqual([ticket]);
  });

  it("stops loading when the list fails", () => {
    service.list.and.returnValue(throwError(() => new Error("nope")));
    component.loadTickets();
    expect(component.loadingTickets()).toBeFalse();
  });

  it("refuses more than five attachments", () => {
    component.onFilesSelected(pick(file("a.png"), file("b.png"), file("c.png"), file("d.png"), file("e.png"), file("f.png")));
    expect(component.files().length).toBe(0);
    expect(component.fileError()).toBeTruthy();
  });

  it("refuses a file that is not an accepted type", () => {
    component.onFilesSelected(pick(file("a.exe", "application/x-msdownload")));
    expect(component.files().length).toBe(0);
    expect(component.fileError()).toBeTruthy();
  });

  it("refuses a file over the size limit", () => {
    component.onFilesSelected(pick(file("big.png", "image/png", 200 * 1024 * 1024)));
    expect(component.files().length).toBe(0);
    expect(component.fileError()).toBeTruthy();
  });

  it("keeps accepted files and drops them again on request", () => {
    component.onFilesSelected(pick(file("a.png"), file("b.png")));
    expect(component.files().length).toBe(2);
    component.removeFile(0);
    expect(component.files().map((f) => f.name)).toEqual(["b.png"]);
    expect(component.fileError()).toBeNull();
  });

  it("does nothing without a subject and a message", () => {
    component.subject.set("  ");
    component.message.set("hello");
    component.submit();
    expect(service.create).not.toHaveBeenCalled();
  });

  it("sends the ticket, then clears the form and shows it in the history", () => {
    const created: SupportTicket = { ...ticket, id: "t2", subject: "New" };
    service.create.and.returnValue(of({ support_ticket: created }));
    const success = spyOn(toast, "success");

    component.subject.set(" New ");
    component.message.set(" Broken ");
    component.onFilesSelected(pick(file("a.png")));
    component.submit();

    expect(service.create).toHaveBeenCalledWith("New", "Broken", jasmine.any(Array));
    expect(component.tickets()[0]).toEqual(created);
    expect(component.subject()).toBe("");
    expect(component.message()).toBe("");
    expect(component.files().length).toBe(0);
    expect(success).toHaveBeenCalled();
  });

  it("reports a failure to send", () => {
    service.create.and.returnValue(throwError(() => new Error("nope")));
    const error = spyOn(toast, "error");

    component.subject.set("New");
    component.message.set("Broken");
    component.submit();

    expect(component.submitting()).toBeFalse();
    expect(error).toHaveBeenCalled();
  });
});
