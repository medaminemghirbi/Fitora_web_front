import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Role } from "../../../core/models/role.model";
import { ConfirmService } from "../../../core/services/confirm.service";
import { RolesService } from "../../../core/services/roles.service";
import { ToastService } from "../../../core/services/toast.service";
import { SettingsRolesComponent } from "./settings-roles.component";

describe("SettingsRolesComponent", () => {
  let fixture: ComponentFixture<SettingsRolesComponent>;
  let component: SettingsRolesComponent;
  let service: jasmine.SpyObj<RolesService>;
  let confirmService: ConfirmService;
  let toast: ToastService;

  const ownerRole: Role = { id: "r1", key: "owner", name: "Owner", permissions: ["clients", "payments"], builtin: true, deletable: false, staff_count: 1 };
  const receptionRole: Role = { id: "r2", key: "receptionist", name: "Réception", permissions: ["clients"], builtin: true, deletable: false, staff_count: 2 };
  const customRole: Role = { id: "r3", key: "accountant", name: "Comptable", permissions: ["payments"], builtin: false, deletable: true, staff_count: 0 };
  const catalog = { clients: "Membres", payments: "Paiements", activities: "Activités", coaches: "Coachs" };

  beforeEach(async () => {
    service = jasmine.createSpyObj<RolesService>("RolesService", ["list", "create", "update", "delete"]);
    service.list.and.returnValue(of({ roles: [ownerRole, receptionRole, customRole], permission_catalog: catalog }));

    await TestBed.configureTestingModule({
      imports: [SettingsRolesComponent, TranslateModule.forRoot()],
      providers: [{ provide: RolesService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsRolesComponent);
    component = fixture.componentInstance;
    confirmService = TestBed.inject(ConfirmService);
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it("loads roles and the permission catalog on init", () => {
    expect(component.roles().length).toBe(3);
    expect(component.catalog()).toEqual(catalog);
  });

  it("isOwnerRole is true only while editing the owner role", () => {
    component.openEdit(ownerRole);
    expect(component.isOwnerRole()).toBe(true);
    component.openEdit(receptionRole);
    expect(component.isOwnerRole()).toBe(false);
  });

  it("configPermKeys / dailyPermKeys split the catalog", () => {
    expect(component.configPermKeys()).toEqual(["activities", "coaches"]);
    expect(component.dailyPermKeys()).toEqual(["clients", "payments"]);
  });

  it("permLabel falls back to the catalog label when no i18n key matches", () => {
    expect(component.permLabel("clients")).toBe("Membres");
  });

  it("permLabel falls back to the raw key when neither i18n nor the catalog has it", () => {
    expect(component.permLabel("mystery")).toBe("mystery");
  });

  it("permLabel prefers a resolved i18n translation when one exists", () => {
    const translate = TestBed.inject(TranslateService);
    spyOn(translate, "instant").and.callFake((key: string) => (key === "settings.perm_clients" ? "Members (i18n)" : key));
    expect(component.permLabel("clients")).toBe("Members (i18n)");
  });

  it("openCreate resets the draft", () => {
    component.openCreate();
    expect(component.editing()).toBeNull();
    expect(component.draftName()).toBe("");
    expect(component.draftPerms().size).toBe(0);
    expect(component.modalOpen()).toBe(true);
  });

  it("openEdit hydrates the draft from the role", () => {
    component.openEdit(customRole);
    expect(component.editing()).toBe(customRole);
    expect(component.draftName()).toBe("Comptable");
    expect(component.draftPerms().has("payments")).toBe(true);
  });

  it("togglePerm adds and removes a permission", () => {
    component.openCreate();
    component.togglePerm("clients");
    expect(component.draftPerms().has("clients")).toBe(true);
    component.togglePerm("clients");
    expect(component.draftPerms().has("clients")).toBe(false);
  });

  it("submit requires a non-blank name", () => {
    component.openCreate();
    component.draftName.set("   ");
    component.submit();
    expect(service.create).not.toHaveBeenCalled();
    expect(component.formError()).toBeTruthy();
  });

  it("submit creates a new custom role", () => {
    component.openCreate();
    component.draftName.set("Accountant");
    component.togglePerm("payments");
    service.create.and.returnValue(of({ role: customRole }));
    component.submit();
    expect(service.create).toHaveBeenCalledWith({ name: "Accountant", permissions: ["payments"] });
    expect(component.modalOpen()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("submit updates a builtin role with only its permissions (name locked)", () => {
    component.openEdit(receptionRole);
    component.togglePerm("payments");
    service.update.and.returnValue(of({ role: receptionRole }));
    component.submit();
    expect(service.update).toHaveBeenCalledWith("r2", { permissions: ["clients", "payments"] });
  });

  it("submit updates a custom role with name + permissions", () => {
    component.openEdit(customRole);
    service.update.and.returnValue(of({ role: customRole }));
    component.submit();
    expect(service.update).toHaveBeenCalledWith("r3", { name: "Comptable", permissions: ["payments"] });
  });

  it("submit shows the backend error on failure", () => {
    component.openCreate();
    component.draftName.set("Accountant");
    service.create.and.returnValue(throwError(() => new Error("nope")));
    component.submit();
    expect(component.formError()).toBeTruthy();
  });

  it("remove does nothing when declined", async () => {
    spyOn(confirmService, "ask").and.resolveTo(false);
    await component.remove(customRole);
    expect(service.delete).not.toHaveBeenCalled();
  });

  it("remove deletes on confirmation", async () => {
    spyOn(confirmService, "ask").and.resolveTo(true);
    service.delete.and.returnValue(of(undefined));
    await component.remove(customRole);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("remove shows an error toast on failure", async () => {
    spyOn(confirmService, "ask").and.resolveTo(true);
    service.delete.and.returnValue(throwError(() => new Error("nope")));
    await component.remove(customRole);
    expect(toast.toasts()[0].kind).toBe("error");
  });
});
