import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Gym } from "../../../core/models/gym.model";
import { GymsService } from "../../../core/services/gyms.service";
import { Coords, GeolocationService } from "../../../core/services/geolocation.service";
import { GymSearchComponent } from "./gym-search.component";

describe("GymSearchComponent", () => {
  let fixture: ComponentFixture<GymSearchComponent>;
  let component: GymSearchComponent;
  let gymsService: jasmine.SpyObj<GymsService>;
  let geo: GeolocationService;

  const gym = { id: "g1", name: "Power Gym", city: "Tunis", activity_names: ["Boxe"], distance_km: null } as unknown as Gym;
  const coords: Coords = { lat: 36.81, lng: 10.18 };

  async function build(alreadyAllowed: Coords | null = null): Promise<void> {
    TestBed.resetTestingModule();
    gymsService = jasmine.createSpyObj<GymsService>("GymsService", ["search"]);
    gymsService.search.and.returnValue(of({ gyms: [gym] }));

    TestBed.configureTestingModule({
      imports: [GymSearchComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: GymsService, useValue: gymsService }],
    });

    geo = TestBed.inject(GeolocationService);
    // Both stubs set the signal, exactly as the real service does — that
    // signal is what the list sorts by.
    spyOn(geo, "locateIfAlreadyAllowed").and.callFake(async () => {
      geo.coords.set(alreadyAllowed);
      return alreadyAllowed;
    });
    spyOn(geo, "locate").and.callFake(async () => {
      geo.coords.set(coords);
      return coords;
    });

    fixture = TestBed.createComponent(GymSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it("opens the whole directory with no account and no position asked for", async () => {
    await build();

    expect(geo.locateIfAlreadyAllowed).toHaveBeenCalled();
    expect(geo.locate).not.toHaveBeenCalled();
    expect(gymsService.search).toHaveBeenCalledWith(undefined, undefined, null);
    expect(component.gyms()).toEqual([gym]);
  });

  it("sorts by distance straight away for someone who already granted it", async () => {
    await build(coords);

    expect(gymsService.search).toHaveBeenCalledWith(undefined, undefined, coords);
  });

  it("asks for the position only when the button is used, then re-sorts", async () => {
    await build();

    await component.locateAndSort();

    expect(geo.locate).toHaveBeenCalled();
    expect(gymsService.search).toHaveBeenCalledWith(undefined, undefined, coords);
  });

  it("keeps the position when the search term changes", async () => {
    await build(coords);
    component.query.set("boxe");

    component.search();

    expect(gymsService.search).toHaveBeenCalledWith("boxe", undefined, coords);
  });

  it("goes back to the full list when the position is cleared", async () => {
    await build(coords);

    component.clearLocation();

    expect(geo.coords()).toBeNull();
    expect(gymsService.search).toHaveBeenCalledWith(undefined, undefined, null);
  });

  it("leaves the list alone when the person refuses the prompt", async () => {
    await build();
    (geo.locate as jasmine.Spy).and.callFake(async () => null);
    gymsService.search.calls.reset();

    await component.locateAndSort();

    expect(gymsService.search).not.toHaveBeenCalled();
  });

  it("empties the list rather than breaking when the directory cannot be read", async () => {
    await build();
    gymsService.search.and.returnValue(throwError(() => new Error("offline")));

    component.search();

    expect(component.gyms()).toEqual([]);
    expect(component.loading()).toBe(false);
  });

  it("builds the activity pills from what the directory actually returned", async () => {
    await build();
    gymsService.search.and.returnValue(
      of({ gyms: [{ ...gym, activity_names: ["Boxe", "Pilates"] }, { ...gym, id: "g2", activity_names: ["Boxe"] }] as Gym[] })
    );

    component.search();

    expect(component.activityOptions()).toEqual(["Boxe", "Pilates"]);
  });

  it("narrows the visible gyms to the chosen activity", async () => {
    await build();
    gymsService.search.and.returnValue(
      of({ gyms: [{ ...gym, activity_names: ["Boxe"] }, { ...gym, id: "g2", activity_names: ["Pilates"] }] as Gym[] })
    );
    component.search();

    component.activityFilter.set("Pilates");

    expect(component.visibleGyms().map((g) => g.id)).toEqual(["g2"]);
  });

  it("drops a pill that no longer matches anything, rather than showing an empty page", async () => {
    await build();
    gymsService.search.and.returnValue(of({ gyms: [{ ...gym, activity_names: ["Boxe"] }] as Gym[] }));
    component.search();
    component.activityFilter.set("Boxe");

    gymsService.search.and.returnValue(of({ gyms: [{ ...gym, activity_names: ["Yoga"] }] as Gym[] }));
    component.search();

    expect(component.activityFilter()).toBe("");
    expect(component.visibleGyms().length).toBe(1);
  });

  it("uses a gym's own colour for its banner, and a stable one when it has none", async () => {
    await build();

    expect(component.bannerColor({ ...gym, primary_color: "#123456" } as Gym)).toBe("#123456");
    const first = component.bannerColor({ ...gym, primary_color: null } as Gym);
    expect(component.bannerColor({ ...gym, primary_color: null } as Gym)).toBe(first);
  });
});
