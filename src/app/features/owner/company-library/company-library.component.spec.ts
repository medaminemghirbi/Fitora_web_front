import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { LibraryFolder } from "../../../core/models/library-folder.model";
import { ConfirmService } from "../../../core/services/confirm.service";
import { LibraryFoldersService } from "../../../core/services/library-folders.service";
import { ToastService } from "../../../core/services/toast.service";
import { CompanyLibraryComponent } from "./company-library.component";

describe("CompanyLibraryComponent", () => {
  let fixture: ComponentFixture<CompanyLibraryComponent>;
  let component: CompanyLibraryComponent;
  let service: jasmine.SpyObj<LibraryFoldersService>;
  let router: Router;
  let confirmService: ConfirmService;
  let toast: ToastService;

  const folder: LibraryFolder = { id: "f1", name: "Contracts", document_count: 3, created_at: "2026-01-01", updated_at: "2026-01-01" };

  beforeEach(async () => {
    service = jasmine.createSpyObj<LibraryFoldersService>("LibraryFoldersService", ["list", "create", "update", "destroy"]);
    service.list.and.returnValue(of({ folders: [folder] }));

    await TestBed.configureTestingModule({
      imports: [CompanyLibraryComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: LibraryFoldersService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyLibraryComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, "navigate");
    confirmService = TestBed.inject(ConfirmService);
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it("loads folders on init", () => {
    expect(component.folders()).toEqual([folder]);
  });

  it("sets the error flag when loading fails", () => {
    service.list.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });

  it("openFolder navigates into it", () => {
    component.openFolder(folder);
    expect(router.navigate).toHaveBeenCalledWith(["/owner/directories/company-library", "f1"]);
  });

  it("openCreate resets the form for a new folder", () => {
    component.openCreate();
    expect(component.editing()).toBeNull();
    expect(component.modalOpen()).toBe(true);
  });

  it("openEdit hydrates the form and stops the click from opening the folder", () => {
    const event = new Event("click");
    spyOn(event, "stopPropagation");
    component.openEdit(folder, event);
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.editing()).toBe(folder);
    expect(component.form.value.name).toBe("Contracts");
  });

  it("closeModal closes it", () => {
    component.modalOpen.set(true);
    component.closeModal();
    expect(component.modalOpen()).toBe(false);
  });

  it("submit does nothing with an invalid form", () => {
    component.submit();
    expect(service.create).not.toHaveBeenCalled();
  });

  it("submit creates a new folder", () => {
    component.openCreate();
    component.form.setValue({ name: "Invoices" });
    service.create.and.returnValue(of({ folder }));
    component.submit();
    expect(service.create).toHaveBeenCalledWith({ name: "Invoices" });
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("submit updates an existing folder", () => {
    component.openEdit(folder, new Event("click"));
    service.update.and.returnValue(of({ folder }));
    component.submit();
    expect(service.update).toHaveBeenCalledWith("f1", { name: "Contracts" });
  });

  it("submit shows the backend error on failure", () => {
    component.openCreate();
    component.form.setValue({ name: "Invoices" });
    service.create.and.returnValue(throwError(() => new Error("nope")));
    component.submit();
    expect(component.formError()).toBeTruthy();
  });

  it("remove does nothing when declined", async () => {
    spyOn(confirmService, "ask").and.resolveTo(false);
    await component.remove(folder, new Event("click"));
    expect(service.destroy).not.toHaveBeenCalled();
  });

  it("remove destroys the folder on confirmation", async () => {
    spyOn(confirmService, "ask").and.resolveTo(true);
    service.destroy.and.returnValue(of(undefined));
    await component.remove(folder, new Event("click"));
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("remove shows an error toast on failure", async () => {
    spyOn(confirmService, "ask").and.resolveTo(true);
    service.destroy.and.returnValue(throwError(() => new Error("nope")));
    await component.remove(folder, new Event("click"));
    expect(toast.toasts()[0].kind).toBe("error");
  });
});
