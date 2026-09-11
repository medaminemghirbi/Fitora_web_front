import { TestBed } from "@angular/core/testing";
import { ConfirmService } from "./confirm.service";

describe("ConfirmService", () => {
  let service: ConfirmService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfirmService);
  });

  it("ask() stores the request and resolves the promise once resolve() is called", async () => {
    const promise = service.ask({ title: "Delete?", body: "Are you sure?", danger: true });

    expect(service.request()?.title).toBe("Delete?");
    expect(service.request()?.danger).toBe(true);

    service.resolve(true);

    await expectAsync(promise).toBeResolvedTo(true);
    expect(service.request()).toBeNull();
  });

  it("resolve(false) resolves with false", async () => {
    const promise = service.ask({ title: "Cancel?", body: "…" });
    service.resolve(false);
    await expectAsync(promise).toBeResolvedTo(false);
  });

  it("resolve() with no pending request is a no-op", () => {
    expect(() => service.resolve(true)).not.toThrow();
    expect(service.request()).toBeNull();
  });
});
