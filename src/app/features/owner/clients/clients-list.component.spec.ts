import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Client } from "../../../core/models/client.model";
import { ClientsService } from "../../../core/services/clients.service";
import { ToastService } from "../../../core/services/toast.service";
import { ClientsListComponent } from "./clients-list.component";

describe("ClientsListComponent", () => {
  let fixture: ComponentFixture<ClientsListComponent>;
  let component: ClientsListComponent;
  let service: jasmine.SpyObj<ClientsService>;
  let router: Router;
  let toast: ToastService;

  const meta = { page: 1, per_page: 20, total: 1, total_pages: 1 };
  const client: Client = {
    id: "cl1",
    first_name: "Amy",
    last_name: "Client",
    full_name: "Amy Client",
    email: null,
    phone: "12345678",
    active: true,
    joined_at: "2026-01-01",
    current_contract: null,
  };

  function build(queryParams: Record<string, string> = {}): void {
    TestBed.resetTestingModule();
    service = jasmine.createSpyObj<ClientsService>("ClientsService", ["list", "create"]);
    service.list.and.returnValue(of({ clients: [client], meta, counts: {} }));

    TestBed.configureTestingModule({
      imports: [ClientsListComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: ClientsService, useValue: service },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } },
      ],
    });

    fixture = TestBed.createComponent(ClientsListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, "navigate");
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  }

  beforeEach(() => build());

  it("loads clients on init", () => {
    expect(component.clients().length).toBe(1);
  });

  it("sets the error flag when loading fails", () => {
    service.list.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });

  it("opens the create modal automatically for ?action=new", () => {
    build({ action: "new" });
    expect(component.createModalOpen()).toBe(true);
  });

  it("hasFilters / clearFilters", () => {
    component.search.set("amy");
    expect(component.hasFilters()).toBe(true);
    component.clearFilters();
    expect(component.hasFilters()).toBe(false);
    expect(component.page()).toBe(1);
  });

  it("filterChips is empty with no active filters", () => {
    expect(component.filterChips()).toEqual([]);
  });

  it("filterChips reflects an active search term and status filter", () => {
    component.search.set("amy");
    component.statusFilter.set("active");
    const chips = component.filterChips();
    expect(chips.length).toBe(2);
    expect(chips[0].label).toContain("amy");
  });

  it("a filter chip's clear() removes just that filter", fakeAsync(() => {
    component.search.set("amy");
    component.statusFilter.set("active");
    const chips = component.filterChips();
    chips[0].clear();
    tick(1000);
    expect(component.search()).toBe("");
    expect(component.statusFilter()).toBe("active");
  }));

  it("the status filter chip's clear() removes just the status filter", () => {
    component.search.set("amy");
    component.statusFilter.set("active");
    const chips = component.filterChips();
    chips[1].clear();
    expect(component.statusFilter()).toBe("");
    expect(component.search()).toBe("amy");
  });

  it("onSearchChange debounces the search", fakeAsync(() => {
    component.page.set(3);
    component.onSearchChange("amy");
    tick(1000);
    expect(component.page()).toBe(1);
    expect(service.list).toHaveBeenCalledWith({ search: "amy", status: undefined, page: 1 });
  }));

  it("onSearchChange cancels a pending debounce timer on rapid typing", fakeAsync(() => {
    component.onSearchChange("a");
    component.onSearchChange("am");
    tick(1000);
    expect(service.list).toHaveBeenCalledWith(jasmine.objectContaining({ search: "am" }));
  }));

  it("applyStatusFilter reloads from page 1", () => {
    component.applyStatusFilter("inactive");
    expect(component.statusFilter()).toBe("inactive");
    expect(component.page()).toBe(1);
  });

  it("onPageChange loads the requested page", () => {
    component.onPageChange(2);
    expect(component.page()).toBe(2);
  });

  it("openClient navigates to the client's profile", () => {
    component.openClient(client);
    expect(router.navigate).toHaveBeenCalledWith(["/owner/clients", "cl1"]);
  });

  it("openCreate resets the form and opens the modal", () => {
    component.createForm.patchValue({ first_name: "stale" });
    component.openCreate();
    expect(component.createModalOpen()).toBe(true);
    expect(component.createForm.value.first_name).toBe("");
  });

  it("closeCreateModal closes it", () => {
    component.createModalOpen.set(true);
    component.closeCreateModal();
    expect(component.createModalOpen()).toBe(false);
  });

  it("submitCreate does nothing with an invalid form", () => {
    component.submitCreate();
    expect(service.create).not.toHaveBeenCalled();
    expect(component.createForm.touched).toBe(true);
  });

  it("submitCreate creates the client and navigates to their profile", () => {
    component.createForm.patchValue({ first_name: "Amy", last_name: "Client", phone: "12345678" });
    service.create.and.returnValue(of({ client }));

    component.submitCreate();

    expect(component.createModalOpen()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(["/owner/clients", "cl1"]);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("submitCreate shows the backend error on failure", () => {
    component.createForm.patchValue({ first_name: "Amy", last_name: "Client", phone: "12345678" });
    service.create.and.returnValue(throwError(() => new Error("nope")));

    component.submitCreate();

    expect(component.saving()).toBe(false);
    expect(component.formError()).toBeTruthy();
  });
});
