import { TestBed } from "@angular/core/testing";
import { GeolocationService } from "./geolocation.service";

describe("GeolocationService", () => {
  let service: GeolocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeolocationService);
  });

  function stubGeolocation(impl: Partial<Geolocation>): void {
    spyOnProperty(navigator, "geolocation", "get").and.returnValue(impl as Geolocation);
  }

  it("returns the position and remembers it", async () => {
    stubGeolocation({
      getCurrentPosition: (ok) => ok({ coords: { latitude: 36.81, longitude: 10.18 } } as GeolocationPosition),
    });

    const coords = await service.locate();

    expect(coords).toEqual({ lat: 36.81, lng: 10.18 });
    expect(service.coords()).toEqual({ lat: 36.81, lng: 10.18 });
    expect(service.state()).toBe("granted");
  });

  it("resolves to null on a refusal rather than rejecting — no position is not an error", async () => {
    stubGeolocation({
      getCurrentPosition: (_ok, fail) =>
        fail?.({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError),
    });

    const coords = await service.locate();

    expect(coords).toBeNull();
    expect(service.state()).toBe("denied");
  });

  it("separates a refusal from a device that simply cannot locate", async () => {
    stubGeolocation({
      getCurrentPosition: (_ok, fail) =>
        fail?.({ code: 2, PERMISSION_DENIED: 1 } as GeolocationPositionError),
    });

    await service.locate();

    expect(service.state()).toBe("unavailable");
  });

  it("never prompts when permission has not already been granted", async () => {
    const getCurrentPosition = jasmine.createSpy("getCurrentPosition");
    stubGeolocation({ getCurrentPosition });
    spyOnProperty(navigator, "permissions", "get").and.returnValue({
      query: () => Promise.resolve({ state: "prompt" } as PermissionStatus),
    } as Permissions);

    const coords = await service.locateIfAlreadyAllowed();

    expect(coords).toBeNull();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("locates silently when permission was granted on an earlier visit", async () => {
    stubGeolocation({
      getCurrentPosition: (ok) => ok({ coords: { latitude: 1, longitude: 2 } } as GeolocationPosition),
    });
    spyOnProperty(navigator, "permissions", "get").and.returnValue({
      query: () => Promise.resolve({ state: "granted" } as PermissionStatus),
    } as Permissions);

    expect(await service.locateIfAlreadyAllowed()).toEqual({ lat: 1, lng: 2 });
  });

  it("stays quiet when the browser refuses to answer the permission query", async () => {
    stubGeolocation({ getCurrentPosition: jasmine.createSpy() });
    spyOnProperty(navigator, "permissions", "get").and.returnValue({
      query: () => Promise.reject(new Error("not supported")),
    } as unknown as Permissions);

    expect(await service.locateIfAlreadyAllowed()).toBeNull();
  });
});
