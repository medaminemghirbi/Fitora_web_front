import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of } from "rxjs";
import { AuthService } from "../../core/auth/auth.service";
import { ClientsService } from "../../core/services/clients.service";
import { CommandPaletteService } from "../../core/services/command-palette.service";
import { ContractsService } from "../../core/services/contracts.service";
import { PaymentsService } from "../../core/services/payments.service";
import { CommandPaletteComponent } from "./command-palette.component";

describe("CommandPaletteComponent", () => {
  let fixture: ComponentFixture<CommandPaletteComponent>;
  let component: CommandPaletteComponent;
  let palette: CommandPaletteService;
  let clientsService: jasmine.SpyObj<ClientsService>;
  let contractsService: jasmine.SpyObj<ContractsService>;
  let paymentsService: jasmine.SpyObj<PaymentsService>;
  let router: Router;
  let authStub: { currentUser: jasmine.Spy; hasPermission: jasmine.Spy; hasFeature: jasmine.Spy };

  function build(role: string): void {
    TestBed.resetTestingModule();
    authStub = {
      currentUser: jasmine.createSpy().and.returnValue({ role }),
      hasPermission: jasmine.createSpy().and.returnValue(true),
      hasFeature: jasmine.createSpy().and.returnValue(false),
    };
    clientsService = jasmine.createSpyObj<ClientsService>("ClientsService", ["list"]);
    contractsService = jasmine.createSpyObj<ContractsService>("ContractsService", ["list"]);
    paymentsService = jasmine.createSpyObj<PaymentsService>("PaymentsService", ["list"]);
    clientsService.list.and.returnValue(of({ clients: [], meta: { page: 1, per_page: 10, total: 0, total_pages: 1 } , counts: {} }));
    contractsService.list.and.returnValue(of({ contracts: [], meta: { page: 1, per_page: 10, total: 0, total_pages: 1 } , counts: {}, plan_counts: {}, totals: { portfolio_value: 0, average_basket: 0, unpaid_value: 0, expiring_soon: 0 } }));
    paymentsService.list.and.returnValue(of({ payments: [], meta: { page: 1, per_page: 10, total: 0, total_pages: 1 } , counts: {}, method_counts: {}, totals: { collected_this_month: 0, collected_total: 0, refunded_value: 0, cancelled_value: 0, average_payment: 0 } }));

    TestBed.configureTestingModule({
      imports: [CommandPaletteComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: ClientsService, useValue: clientsService },
        { provide: ContractsService, useValue: contractsService },
        { provide: PaymentsService, useValue: paymentsService },
      ],
    });

    fixture = TestBed.createComponent(CommandPaletteComponent);
    component = fixture.componentInstance;
    palette = TestBed.inject(CommandPaletteService);
    router = TestBed.inject(Router);
    spyOn(router, "navigateByUrl");
    spyOn(router, "navigate");
    fixture.detectChanges();
  }

  beforeEach(() => build("owner"));

  it("starts closed", () => {
    expect(palette.isOpen()).toBe(false);
  });

  it("navCmds omit the dashboard entry when the viewer can't see it", () => {
    authStub.hasPermission.and.returnValue(false);
    palette.open();
    fixture.detectChanges();
    const gotoItems = component.sections().find((s) => s.key === "goto")?.items ?? [];
    expect(gotoItems.some((i) => i.id === "nav:/owner/dashboard")).toBe(false);
  });

  it("opening resets the query/active index and shows nav commands", () => {
    palette.open();
    fixture.detectChanges();

    expect(component.query()).toBe("");
    expect(component.active()).toBe(0);
    expect(component.sections().some((s) => s.key === "goto")).toBe(true);
  });

  it("re-opening actually resets a dirtied query/active index/remote state (not just matching defaults)", () => {
    palette.open();
    fixture.detectChanges();
    component.query.set("something");
    component.active.set(3);
    palette.close();
    fixture.detectChanges();

    palette.open();
    fixture.detectChanges();

    expect(component.query()).toBe("");
    expect(component.active()).toBe(0);
  });

  it("opening focuses the search input on the next microtask", fakeAsync(() => {
    document.body.appendChild(fixture.nativeElement);
    palette.open();
    fixture.detectChanges();
    tick();
    const input = document.getElementById("cmdk-input");
    expect(document.activeElement).toBe(input);
    document.body.removeChild(fixture.nativeElement);
  }));

  it("action commands only show for an owner with a non-empty query", () => {
    palette.open();
    fixture.detectChanges();
    expect(component.sections().some((s) => s.key === "actions")).toBe(false);

    component.onQuery("client");
    expect(component.sections().some((s) => s.key === "actions")).toBe(true);
  });

  it("action commands never show for a non-owner", () => {
    build("staff");
    palette.open();
    fixture.detectChanges();
    component.onQuery("client");
    expect(component.sections().some((s) => s.key === "actions")).toBe(false);
  });

  it("onQuery clears the remote results for a short term", () => {
    palette.open();
    fixture.detectChanges();
    component.onQuery("a");
    expect(clientsService.list).not.toHaveBeenCalled();
  });

  it("onQuery debounces the remote search by 250ms", fakeAsync(() => {
    palette.open();
    fixture.detectChanges();

    component.onQuery("amy");
    expect(clientsService.list).not.toHaveBeenCalled();

    tick(250);
    expect(clientsService.list).toHaveBeenCalledWith({ search: "amy" });
    expect(contractsService.list).toHaveBeenCalledWith({ q: "amy" });
    expect(paymentsService.list).toHaveBeenCalledWith({ q: "amy" });
  }));

  it("onQuery restarts the debounce timer on rapid typing", fakeAsync(() => {
    palette.open();
    fixture.detectChanges();

    component.onQuery("am");
    tick(100);
    component.onQuery("amy");
    tick(100);
    expect(clientsService.list).not.toHaveBeenCalled();
    tick(150);
    expect(clientsService.list).toHaveBeenCalledTimes(1);
  }));

  it("does not run a remote search for a non-owner", fakeAsync(() => {
    build("staff");
    palette.open();
    fixture.detectChanges();
    component.onQuery("amy");
    tick(250);
    expect(clientsService.list).not.toHaveBeenCalled();
  }));

  it("remote results are mapped into their own section", fakeAsync(() => {
    clientsService.list.and.returnValue(
      of({ clients: [{ id: "c1", full_name: "Amy Client", phone: "123" } as never], meta: { page: 1, per_page: 10, total: 1, total_pages: 1 }, counts: {} })
    );
    palette.open();
    fixture.detectChanges();
    component.onQuery("amy");
    tick(250);
    fixture.detectChanges();

    const clientsSection = component.sections().find((s) => s.key === "clients");
    expect(clientsSection?.items[0].label).toBe("Amy Client");
  }));

  it("running a remote client command closes the palette and navigates", fakeAsync(() => {
    clientsService.list.and.returnValue(
      of({ clients: [{ id: "c1", full_name: "Amy Client" } as never], meta: { page: 1, per_page: 10, total: 1, total_pages: 1 }, counts: {} })
    );
    palette.open();
    fixture.detectChanges();
    component.onQuery("amy");
    tick(250);
    fixture.detectChanges();

    component.sections().find((s) => s.key === "clients")!.items[0].run();

    expect(palette.isOpen()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(["/owner/clients", "c1"]);
  }));

  it("running a remote contract command navigates to the client's profile", fakeAsync(() => {
    contractsService.list.and.returnValue(
      of({
        contracts: [{ id: "m1", client: { id: "cl9", full_name: "Amy" }, plan: { name: "Basic" } } as never],
        meta: { page: 1, per_page: 10, total: 1, total_pages: 1 },
        counts: {},
        plan_counts: {},
        totals: { portfolio_value: 0, average_basket: 0, unpaid_value: 0, expiring_soon: 0 },
      })
    );
    palette.open();
    fixture.detectChanges();
    component.onQuery("amy");
    tick(250);
    fixture.detectChanges();

    component.sections().find((s) => s.key === "contracts")!.items[0].run();
    expect(router.navigate).toHaveBeenCalledWith(["/owner/clients", "cl9"]);
    expect(palette.isOpen()).toBe(false);
  }));

  it("running a remote payment command navigates to the payments list, filtered", fakeAsync(() => {
    paymentsService.list.and.returnValue(
      of({
        payments: [{ id: "p1", client: { full_name: "Amy" }, amount: 20, currency: "TND" } as never],
        meta: { page: 1, per_page: 10, total: 1, total_pages: 1 },
        counts: {}, method_counts: {}, totals: { collected_this_month: 0, collected_total: 0, refunded_value: 0, cancelled_value: 0, average_payment: 0 },
      })
    );
    palette.open();
    fixture.detectChanges();
    component.onQuery("amy");
    tick(250);
    fixture.detectChanges();

    component.sections().find((s) => s.key === "payments")!.items[0].run();
    expect(router.navigate).toHaveBeenCalledWith(["/owner/payments"], { queryParams: { q: "amy" } });
    expect(palette.isOpen()).toBe(false);
  }));

  it("running a nav command closes the palette and navigates to its path", () => {
    palette.open();
    fixture.detectChanges();
    component.sections().find((s) => s.key === "goto")!.items[0].run();
    expect(palette.isOpen()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalled();
  });

  it("running an action command navigates with a ?action=new query param", () => {
    palette.open();
    fixture.detectChanges();
    // "new" appears (untranslated) in every action command's labelKey, so all 4 survive the filter.
    component.onQuery("new");
    const actions = component.sections().find((s) => s.key === "actions")!.items;
    actions[0].run();
    expect(router.navigate).toHaveBeenCalledWith(["/owner/clients"], { queryParams: { action: "new" } });

    actions[1].run();
    expect(router.navigate).toHaveBeenCalledWith(["/owner/payments"], { queryParams: { action: "new" } });
    actions[2].run();
    expect(router.navigate).toHaveBeenCalledWith(["/owner/activities"], { queryParams: { action: "new" } });
    actions[3].run();
    expect(router.navigate).toHaveBeenCalledWith(["/owner/team"], { queryParams: { action: "new" } });
  });

  it("rows() flattens sections into label rows and indexed command rows", () => {
    palette.open();
    fixture.detectChanges();
    const rows = component.rows();
    expect(rows.some((r) => "label" in r)).toBe(true);
    expect(rows.some((r) => "cmd" in r)).toBe(true);
  });

  describe("keyboard shortcuts", () => {
    function key(k: string, meta = false): KeyboardEvent {
      return new KeyboardEvent("keydown", { key: k, metaKey: meta });
    }

    it("Cmd/Ctrl+K toggles the palette", () => {
      const event = key("k", true);
      spyOn(event, "preventDefault");
      component.onKey(event);
      expect(palette.isOpen()).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("ignores other keys while closed", () => {
      component.onKey(key("ArrowDown"));
      expect(component.active()).toBe(0);
    });

    it("Escape closes the palette while open", () => {
      palette.open();
      component.onKey(key("Escape"));
      expect(palette.isOpen()).toBe(false);
    });

    it("ArrowDown/ArrowUp move the active index within bounds", () => {
      palette.open();
      fixture.detectChanges();
      const max = component.flat().length - 1;

      for (let i = 0; i < max + 3; i++) component.onKey(key("ArrowDown"));
      expect(component.active()).toBe(max);

      for (let i = 0; i < max + 3; i++) component.onKey(key("ArrowUp"));
      expect(component.active()).toBe(0);
    });

    it("Enter runs the active command", () => {
      palette.open();
      fixture.detectChanges();
      component.onKey(key("Enter"));
      expect(palette.isOpen()).toBe(false);
    });
  });
});
