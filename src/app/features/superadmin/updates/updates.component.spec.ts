import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AppUpdatesService } from "../../../core/services/app-updates.service";
import { ToastService } from "../../../core/services/toast.service";
import { SuperadminUpdatesComponent } from "./updates.component";

describe("SuperadminUpdatesComponent", () => {
  let fixture: ComponentFixture<SuperadminUpdatesComponent>;
  let component: SuperadminUpdatesComponent;
  let service: jasmine.SpyObj<AppUpdatesService>;
  let toast: ToastService;

  function file(name: string, type: string, size = 1024): File {
    const f = new File(["x"], name, { type });
    Object.defineProperty(f, "size", { value: size });
    return f;
  }

  beforeEach(async () => {
    service = jasmine.createSpyObj<AppUpdatesService>("AppUpdatesService", ["listSuperadmin", "create"]);
    service.listSuperadmin.and.returnValue(
      of({
        app_updates: [
          {
            id: "u1",
            version: "1.0.0",
            title: "Initial release",
            description: null,
            published_at: "2026-01-01T00:00:00Z",
            created_by: { id: "a1", full_name: "Superadmin A" },
            media: [],
          },
        ],
      })
    );

    await TestBed.configureTestingModule({
      imports: [SuperadminUpdatesComponent, TranslateModule.forRoot()],
      providers: [{ provide: AppUpdatesService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(SuperadminUpdatesComponent);
    component = fixture.componentInstance;
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it("loads updates on init", () => {
    expect(component.updates().length).toBe(1);
    expect(component.loading()).toBe(false);
  });

  it("sets the error flag when loading fails", () => {
    service.listSuperadmin.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });

  it("openCreate resets the form and opens the drawer", () => {
    component.version.set("stale");
    component.openCreate();
    expect(component.version()).toBe("");
    expect(component.drawerOpen()).toBe(true);
  });

  it("closeDrawer closes it", () => {
    component.drawerOpen.set(true);
    component.closeDrawer();
    expect(component.drawerOpen()).toBe(false);
  });

  it("onFilesSelected accepts valid files", () => {
    const input = document.createElement("input");
    input.type = "file";
    const picked = file("shot.png", "image/png");
    Object.defineProperty(input, "files", { value: [picked] });

    component.onFilesSelected({ target: input } as unknown as Event);

    expect(component.files().length).toBe(1);
    expect(component.fileError()).toBeNull();
  });

  it("onFilesSelected treats a null FileList as empty", () => {
    const input = document.createElement("input");
    input.type = "file";
    Object.defineProperty(input, "files", { value: null });

    component.onFilesSelected({ target: input } as unknown as Event);

    expect(component.files().length).toBe(0);
    expect(component.fileError()).toBeNull();
  });

  it("onFilesSelected rejects a disallowed file type", () => {
    const input = document.createElement("input");
    const picked = file("doc.pdf", "application/pdf");
    Object.defineProperty(input, "files", { value: [picked] });

    component.onFilesSelected({ target: input } as unknown as Event);

    expect(component.files().length).toBe(0);
    expect(component.fileError()).toBe("superadmin.updates.invalid_file");
  });

  it("onFilesSelected rejects an oversized file", () => {
    const input = document.createElement("input");
    const picked = file("huge.mp4", "video/mp4", 200 * 1024 * 1024);
    Object.defineProperty(input, "files", { value: [picked] });

    component.onFilesSelected({ target: input } as unknown as Event);

    expect(component.files().length).toBe(0);
    expect(component.fileError()).toBe("superadmin.updates.invalid_file");
  });

  it("onFilesSelected rejects more than the max file count", () => {
    const input = document.createElement("input");
    const picked = Array.from({ length: 9 }, (_, i) => file(`f${i}.png`, "image/png"));
    Object.defineProperty(input, "files", { value: picked });

    component.onFilesSelected({ target: input } as unknown as Event);

    expect(component.files().length).toBe(0);
    expect(component.fileError()).toBe("superadmin.updates.too_many_files");
  });

  it("removeFile drops the file at the given index", () => {
    component.files.set([file("a.png", "image/png"), file("b.png", "image/png")]);
    component.removeFile(0);
    expect(component.files().length).toBe(1);
    expect(component.files()[0].name).toBe("b.png");
  });

  it("submit() does nothing without a version or title", () => {
    component.version.set("");
    component.title.set("");
    component.submit();
    expect(service.create).not.toHaveBeenCalled();
  });

  it("submit() creates the update, closes the drawer, and prepends it to the list", () => {
    component.version.set("1.2.0");
    component.title.set("New release");
    const created = {
      id: "u2",
      version: "1.2.0",
      title: "New release",
      description: null,
      published_at: "2026-02-01T00:00:00Z",
      created_by: { id: "a1", full_name: "Superadmin A" },
      media: [],
    };
    service.create.and.returnValue(of({ app_update: created }));

    component.submit();

    expect(component.drawerOpen()).toBe(false);
    expect(component.updates()[0]).toEqual(created);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("submit() shows the backend error on failure", () => {
    component.version.set("1.2.0");
    component.title.set("New release");
    service.create.and.returnValue(throwError(() => new Error("nope")));

    component.submit();

    expect(component.saving()).toBe(false);
    expect(component.formError()).toBeTruthy();
  });
});
