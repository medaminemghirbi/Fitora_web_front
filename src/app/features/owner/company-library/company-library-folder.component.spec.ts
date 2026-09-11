import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { ActivatedRoute, convertToParamMap } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { LibraryDocument } from "../../../core/models/library-document.model";
import { LibraryFolder } from "../../../core/models/library-folder.model";
import { ConfirmService } from "../../../core/services/confirm.service";
import { LibraryDocumentsService } from "../../../core/services/library-documents.service";
import { LibraryFoldersService } from "../../../core/services/library-folders.service";
import { ToastService } from "../../../core/services/toast.service";
import { CompanyLibraryFolderComponent } from "./company-library-folder.component";

describe("CompanyLibraryFolderComponent", () => {
  let fixture: ComponentFixture<CompanyLibraryFolderComponent>;
  let component: CompanyLibraryFolderComponent;
  let foldersService: jasmine.SpyObj<LibraryFoldersService>;
  let documentsService: jasmine.SpyObj<LibraryDocumentsService>;
  let confirmService: ConfirmService;
  let toast: ToastService;

  const folder: LibraryFolder = { id: "f1", name: "Contracts", document_count: 1, created_at: "2026-01-01", updated_at: "2026-01-01" };
  const meta = { page: 1, per_page: 20, total: 1, total_pages: 1 };
  const doc: LibraryDocument = {
    id: "d1", folder_id: "f1", title: "Lease", reference_number: null, issued_on: null,
    expires_on: null, expired: false, notes: null, active: true,
    file: { filename: "lease.pdf", content_type: "application/pdf", byte_size: 1000, url: "/x" },
    created_by: null, created_at: "2026-01-01", updated_at: "2026-01-01",
  };

  beforeEach(async () => {
    foldersService = jasmine.createSpyObj<LibraryFoldersService>("LibraryFoldersService", ["get"]);
    documentsService = jasmine.createSpyObj<LibraryDocumentsService>("LibraryDocumentsService", ["list", "create", "update", "destroy", "downloadFile"]);
    foldersService.get.and.returnValue(of({ folder }));
    documentsService.list.and.returnValue(of({ documents: [doc], meta }));

    await TestBed.configureTestingModule({
      imports: [CompanyLibraryFolderComponent, TranslateModule.forRoot()],
      providers: [
        { provide: LibraryFoldersService, useValue: foldersService },
        { provide: LibraryDocumentsService, useValue: documentsService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ folderId: "f1" }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyLibraryFolderComponent);
    component = fixture.componentInstance;
    confirmService = TestBed.inject(ConfirmService);
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it("loads the folder and its documents on init", () => {
    expect(component.folder()).toEqual(folder);
    expect(component.documents()).toEqual([doc]);
  });

  it("sets the error flag when loading documents fails", () => {
    documentsService.list.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });

  it("isExpiringSoon is false without an expiry date or when already expired", () => {
    expect(component.isExpiringSoon(doc)).toBe(false);
    expect(component.isExpiringSoon({ ...doc, expires_on: "2020-01-01", expired: true })).toBe(false);
  });

  it("isExpiringSoon is true within 30 days, false beyond", () => {
    const soon = new Date(Date.now() + 5 * 86_400_000).toISOString();
    const far = new Date(Date.now() + 90 * 86_400_000).toISOString();
    expect(component.isExpiringSoon({ ...doc, expires_on: soon })).toBe(true);
    expect(component.isExpiringSoon({ ...doc, expires_on: far })).toBe(false);
  });

  it("isPdf reflects the file's content type", () => {
    expect(component.isPdf(doc)).toBe(true);
    expect(component.isPdf({ ...doc, file: { ...doc.file!, content_type: "image/png" } })).toBe(false);
    expect(component.isPdf({ ...doc, file: null })).toBe(false);
  });

  it("applyStatusFilter reloads from page 1", () => {
    component.page.set(3);
    component.applyStatusFilter("expiring_soon");
    expect(component.statusFilter()).toBe("expiring_soon");
    expect(component.page()).toBe(1);
  });

  it("onSearchChange debounces the search", fakeAsync(() => {
    component.onSearchChange("lease");
    tick(1000);
    expect(documentsService.list).toHaveBeenCalledWith({ folder_id: "f1", status: undefined, q: "lease", page: 1 });
  }));

  it("onSearchChange cancels a pending debounce timer on rapid typing", fakeAsync(() => {
    component.onSearchChange("l");
    component.onSearchChange("le");
    tick(1000);
    expect(documentsService.list).toHaveBeenCalledWith(jasmine.objectContaining({ q: "le" }));
  }));

  it("onPageChange loads the requested page", () => {
    component.onPageChange(2);
    expect(component.page()).toBe(2);
  });

  it("onFileSelected stores the chosen file", () => {
    const input = document.createElement("input");
    const file = new File(["x"], "a.pdf", { type: "application/pdf" });
    Object.defineProperty(input, "files", { value: [file] });
    component.onFileSelected({ target: input } as unknown as Event);
    expect(component.selectedFile()).toBe(file);
  });

  it("onFileSelected clears the file when none chosen", () => {
    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: [] });
    component.onFileSelected({ target: input } as unknown as Event);
    expect(component.selectedFile()).toBeNull();
  });

  it("openCreate resets the form", () => {
    component.openCreate();
    expect(component.editing()).toBeNull();
    expect(component.modalOpen()).toBe(true);
  });

  it("openEdit hydrates the form from the document", () => {
    component.openEdit(doc);
    expect(component.editing()).toBe(doc);
    expect(component.form.value.title).toBe("Lease");
  });

  it("closeModal closes it", () => {
    component.modalOpen.set(true);
    component.closeModal();
    expect(component.modalOpen()).toBe(false);
  });

  it("submit does nothing with an invalid form", () => {
    component.submit();
    expect(documentsService.create).not.toHaveBeenCalled();
  });

  it("submit requires a file when creating a new document", () => {
    component.openCreate();
    component.form.patchValue({ title: "New doc" });
    component.submit();
    expect(documentsService.create).not.toHaveBeenCalled();
    expect(component.formError()).toBeTruthy();
  });

  it("submit creates the document once a file is attached", () => {
    component.openCreate();
    component.form.patchValue({ title: "New doc" });
    component.selectedFile.set(new File(["x"], "a.pdf", { type: "application/pdf" }));
    documentsService.create.and.returnValue(of({ document: doc }));
    component.submit();
    expect(documentsService.create).toHaveBeenCalled();
    expect(component.modalOpen()).toBe(false);
  });

  it("submit updates an existing document without requiring a new file", () => {
    component.openEdit(doc);
    documentsService.update.and.returnValue(of({ document: doc }));
    component.submit();
    expect(documentsService.update).toHaveBeenCalled();
  });

  it("submit shows the backend error on failure", () => {
    component.openEdit(doc);
    documentsService.update.and.returnValue(throwError(() => new Error("nope")));
    component.submit();
    expect(component.formError()).toBeTruthy();
  });

  it("view opens a blank tab and redirects it once the blob resolves", () => {
    const fakeWin = { location: { href: "" }, close: jasmine.createSpy() };
    spyOn(window, "open").and.returnValue(fakeWin as unknown as Window);
    documentsService.downloadFile.and.returnValue(of(new Blob(["x"], { type: "application/pdf" })));
    component.view(doc);
    expect(fakeWin.location.href).toContain("blob:");
  });

  it("view revokes the blob URL after the timeout", fakeAsync(() => {
    const fakeWin = { location: { href: "" }, close: jasmine.createSpy() };
    spyOn(window, "open").and.returnValue(fakeWin as unknown as Window);
    documentsService.downloadFile.and.returnValue(of(new Blob(["x"], { type: "application/pdf" })));
    spyOn(URL, "revokeObjectURL");
    component.view(doc);
    tick(60_000);
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  }));

  it("view closes the tab and shows a toast on failure", () => {
    const fakeWin = { location: { href: "" }, close: jasmine.createSpy() };
    spyOn(window, "open").and.returnValue(fakeWin as unknown as Window);
    documentsService.downloadFile.and.returnValue(throwError(() => new Error("nope")));
    component.view(doc);
    expect(fakeWin.close).toHaveBeenCalled();
    expect(toast.toasts()[0].kind).toBe("error");
  });

  it("remove does nothing when declined", async () => {
    spyOn(confirmService, "ask").and.resolveTo(false);
    await component.remove(doc);
    expect(documentsService.destroy).not.toHaveBeenCalled();
  });

  it("remove destroys the document on confirmation", async () => {
    spyOn(confirmService, "ask").and.resolveTo(true);
    documentsService.destroy.and.returnValue(of(undefined));
    await component.remove(doc);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("remove shows an error toast on failure", async () => {
    spyOn(confirmService, "ask").and.resolveTo(true);
    documentsService.destroy.and.returnValue(throwError(() => new Error("nope")));
    await component.remove(doc);
    expect(toast.toasts()[0].kind).toBe("error");
  });
});
