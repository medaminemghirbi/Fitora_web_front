import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { ToastService } from "./toast.service";

describe("ToastService", () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it("success/error/info/warning push a toast of the matching kind", () => {
    service.success("Saved");
    service.error("Failed");
    service.info("FYI");
    service.warning("Careful");

    const kinds = service.toasts().map((t) => t.kind);
    expect(kinds).toEqual(["success", "error", "info", "warning"]);
    expect(service.toasts()[0].message).toBe("Saved");
  });

  it("assigns each toast a unique id", () => {
    service.success("A");
    service.success("B");
    const [a, b] = service.toasts();
    expect(a.id).not.toBe(b.id);
  });

  it("dismiss() removes a toast by id", () => {
    service.success("A");
    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts().length).toBe(0);
  });

  it("auto-dismisses a toast after 4s", fakeAsync(() => {
    service.success("A");
    expect(service.toasts().length).toBe(1);
    tick(4000);
    expect(service.toasts().length).toBe(0);
  }));
});
