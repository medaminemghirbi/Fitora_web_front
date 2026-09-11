import { HttpErrorResponse } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Supplier } from "../../../../core/models/supplier.model";
import { ConfirmService } from "../../../../core/services/confirm.service";
import { SuppliersService } from "../../../../core/services/suppliers.service";
import { ToastService } from "../../../../core/services/toast.service";
import { SuppliersComponent } from "./suppliers.component";

describe("SuppliersComponent", () => {
  let fixture: ComponentFixture<SuppliersComponent>;
  let component: SuppliersComponent;
  let service: jasmine.SpyObj<SuppliersService>;
  let confirmService: ConfirmService;
  let toast: ToastService;

  const supplierA: Supplier = { id: "s1", name: "Acme Supplies", category: "Equipment", contact_name: "Bob", phone: "111", email: "a@x.test", address: null, notes: null, active: true, photo_url: null, created_at: "2026-01-01" };
  const supplierB: Supplier = { id: "s2", name: "Zenith Textiles", category: "Apparel", contact_name: "Ann", phone: "222", email: "b@x.test", address: null, notes: null, active: false, photo_url: "/photos/z.png", created_at: "2026-01-02" };

  beforeEach(async () => {
    service = jasmine.createSpyObj<SuppliersService>("SuppliersService", ["list", "create", "update", "deactivate"]);
    service.list.and.returnValue(of({ suppliers: [supplierA, supplierB] }));

    await TestBed.configureTestingModule({
      imports: [SuppliersComponent, TranslateModule.forRoot()],
      providers: [{ provide: SuppliersService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(SuppliersComponent);
    component = fixture.componentInstance;
    confirmService = TestBed.inject(ConfirmService);
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it("loads suppliers on init", () => {
    expect(component.suppliers().length).toBe(2);
  });

  it("sets the error flag when loading fails", () => {
    service.list.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });

  it("filtered defaults to active suppliers only", () => {
    expect(component.filtered().map((s) => s.id)).toEqual(["s1"]);
  });

  it("filtered('all') includes inactive suppliers too", () => {
    component.statusFilter.set("all");
    expect(component.filtered().length).toBe(2);
  });

  it("filtered matches the search term against several fields", () => {
    component.statusFilter.set("all");
    component.search.set("zenith");
    expect(component.filtered().map((s) => s.id)).toEqual(["s2"]);
  });

  it("sorted orders by the current sort key/direction", () => {
    component.statusFilter.set("all");
    component.sortKey.set("name");
    component.sortDir.set("asc");
    expect(component.sorted().map((s) => s.id)).toEqual(["s1", "s2"]);
    component.sortDir.set("desc");
    expect(component.sorted().map((s) => s.id)).toEqual(["s2", "s1"]);
  });

  it("sorted() compares booleans directly when sorting by 'active'", () => {
    component.statusFilter.set("all");
    component.sortKey.set("active");
    component.sortDir.set("asc");
    expect(component.sorted().map((s) => s.id)).toEqual(["s1", "s2"]);
    component.sortDir.set("desc");
    expect(component.sorted().map((s) => s.id)).toEqual(["s2", "s1"]);
  });

  it("toggleSort flips direction on the same key, resets to asc on a new key", () => {
    component.toggleSort("name");
    expect(component.sortDir()).toBe("desc");
    component.toggleSort("name");
    expect(component.sortDir()).toBe("asc");
    component.toggleSort("category");
    expect(component.sortKey()).toBe("category");
    expect(component.sortDir()).toBe("asc");
  });

  it("sorted() treats a null field as an empty string (first operand null)", () => {
    component.suppliers.set([
      { ...supplierA, category: null },
      { ...supplierB, active: true, category: "Apparel" },
    ]);
    component.statusFilter.set("all");
    component.sortKey.set("category");
    component.sortDir.set("asc");
    expect(component.sorted().map((s) => s.id)).toEqual(["s1", "s2"]);
  });

  it("sorted() treats a null field as an empty string (second operand null)", () => {
    component.suppliers.set([
      { ...supplierA, category: "Apparel" },
      { ...supplierB, active: true, category: null },
    ]);
    component.statusFilter.set("all");
    component.sortKey.set("category");
    component.sortDir.set("asc");
    expect(component.sorted().map((s) => s.id)).toEqual(["s2", "s1"]);
  });

  it("sortIcon reflects the active sort", () => {
    expect(component.sortIcon("category")).toBe("bi-arrow-down-up");
    component.sortKey.set("name");
    component.sortDir.set("asc");
    expect(component.sortIcon("name")).toBe("bi-sort-alpha-down");
    component.sortDir.set("desc");
    expect(component.sortIcon("name")).toBe("bi-sort-alpha-up");
  });

  it("initials derives up to 2 letters, falling back to ?", () => {
    expect(component.initials("Acme Supplies")).toBe("AS");
    expect(component.initials("Zenith")).toBe("Z");
    expect(component.initials("   ")).toBe("?");
  });

  it("categoryTone is neutral without a category, else a stable tone", () => {
    expect(component.categoryTone(null)).toBe("neutral");
    const t1 = component.categoryTone("Equipment");
    const t2 = component.categoryTone("Equipment");
    expect(t1).toBe(t2);
  });

  it("openCreate resets the form and drawer state", () => {
    component.openCreate();
    expect(component.editing()).toBeNull();
    expect(component.drawerOpen()).toBe(true);
    expect(component.photoPreview()).toBeNull();
  });

  it("openEdit hydrates the form and shows the existing photo", () => {
    component.openEdit(supplierB);
    expect(component.editing()).toBe(supplierB);
    expect(component.photoPreview()).toContain("/photos/z.png");
  });

  it("openEdit falls back to empty strings for a supplier with no optional fields set", () => {
    const bare: Supplier = { ...supplierA, category: null, contact_name: null, phone: null, email: null, photo_url: null };
    component.openEdit(bare);
    expect(component.form.get("category")!.value).toBe("");
    expect(component.form.get("contact_name")!.value).toBe("");
    expect(component.form.get("phone")!.value).toBe("");
    expect(component.form.get("email")!.value).toBe("");
    expect(component.photoPreview()).toBeNull();
  });

  it("closeDrawer closes it", () => {
    component.drawerOpen.set(true);
    component.closeDrawer();
    expect(component.drawerOpen()).toBe(false);
  });

  it("onPhotoSelected stores the file and previews it", (done) => {
    const file = new File(["x"], "logo.png", { type: "image/png" });
    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: [file] });

    component.onPhotoSelected({ target: input } as unknown as Event);
    expect(component.photoFile()).toBe(file);

    setTimeout(() => {
      expect(component.photoPreview()).toBeTruthy();
      done();
    }, 50);
  });

  it("onPhotoSelected does nothing without a file", () => {
    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: [] });
    component.onPhotoSelected({ target: input } as unknown as Event);
    expect(component.photoFile()).toBeNull();
  });

  it("fieldError is null for an untouched or valid control", () => {
    expect(component.fieldError("name")).toBeNull();
  });

  it("fieldError surfaces a required message once touched", () => {
    component.form.get("name")!.markAsTouched();
    component.form.get("name")!.updateValueAndValidity();
    expect(component.fieldError("name")).toBe("common.required");
  });

  it("fieldError surfaces a server error", () => {
    const control = component.form.get("name")!;
    control.setErrors({ server: "Name already used" });
    control.markAsTouched();
    expect(component.fieldError("name")).toBe("Name already used");
  });

  it("submit does nothing with an invalid form", () => {
    component.submit();
    expect(service.create).not.toHaveBeenCalled();
  });

  it("submit creates a supplier and prepends it to the list", () => {
    component.openCreate();
    component.form.patchValue({ name: "New Supplier" });
    service.create.and.returnValue(of({ supplier: supplierA }));
    component.submit();
    expect(component.drawerOpen()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("submit updates an existing supplier in place", () => {
    component.openEdit(supplierA);
    service.update.and.returnValue(of({ supplier: { ...supplierA, name: "Updated" } }));
    component.submit();
    expect(component.suppliers().find((s) => s.id === "s1")!.name).toBe("Updated");
  });

  it("submit shows field errors from the backend, including a dedicated photo error", () => {
    component.openCreate();
    component.form.patchValue({ name: "New Supplier" });
    service.create.and.returnValue(
      throwError(() => new HttpErrorResponse({ error: { errors: { name: ["already taken"], photo: ["too large"] } } }))
    );
    component.submit();
    expect(component.photoError()).toBe("too large");
    expect(component.form.get("name")!.getError("server")).toBe("already taken");
  });

  it("submit clears formError when the only field error was for the photo", () => {
    component.openCreate();
    component.form.patchValue({ name: "New Supplier" });
    service.create.and.returnValue(throwError(() => new HttpErrorResponse({ error: { errors: { photo: ["too large"] } } })));
    component.submit();
    expect(component.photoError()).toBe("too large");
    expect(component.formError()).toBeNull();
  });

  it("submit joins unmatched field errors (not mapped to any control) into formError", () => {
    component.openCreate();
    component.form.patchValue({ name: "New Supplier" });
    service.create.and.returnValue(throwError(() => new HttpErrorResponse({ error: { errors: { base: ["something went wrong"] } } })));
    component.submit();
    expect(component.formError()).toBe("something went wrong");
  });

  it("submit falls back to a generic error message with no field errors", () => {
    component.openCreate();
    component.form.patchValue({ name: "New Supplier" });
    service.create.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    component.submit();
    expect(component.formError()).toBe("common.error_generic");
  });

  it("toggleActive deactivates on confirmation", async () => {
    spyOn(confirmService, "ask").and.resolveTo(true);
    service.deactivate.and.returnValue(of({ supplier: { ...supplierA, active: false } }));
    await component.toggleActive(supplierA);
    expect(component.suppliers().find((s) => s.id === "s1")!.active).toBe(false);
  });

  it("toggleActive does nothing when deactivation is declined", async () => {
    spyOn(confirmService, "ask").and.resolveTo(false);
    await component.toggleActive(supplierA);
    expect(service.deactivate).not.toHaveBeenCalled();
  });

  it("toggleActive shows an error toast when deactivation fails", async () => {
    spyOn(confirmService, "ask").and.resolveTo(true);
    service.deactivate.and.returnValue(throwError(() => new Error("nope")));
    await component.toggleActive(supplierA);
    expect(toast.toasts()[0].kind).toBe("error");
  });

  it("toggleActive reactivates an inactive supplier without confirmation", async () => {
    service.update.and.returnValue(of({ supplier: { ...supplierB, active: true } }));
    await component.toggleActive(supplierB);
    expect(service.update).toHaveBeenCalledWith("s2", { active: true });
  });

  it("toggleActive shows an error toast when reactivation fails", async () => {
    service.update.and.returnValue(throwError(() => new Error("nope")));
    await component.toggleActive(supplierB);
    expect(toast.toasts()[0].kind).toBe("error");
  });
});
