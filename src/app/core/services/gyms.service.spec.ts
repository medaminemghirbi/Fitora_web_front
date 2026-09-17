import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { API_BASE_URL } from "../models/api-config";
import { MyGym } from "../models/gym.model";
import { GymsService } from "./gyms.service";

describe("GymsService", () => {
  let service: GymsService;
  let httpMock: HttpTestingController;

  const gym = { id: "g1", name: "Power Gym", joined_at: "2026-01-01", active: true } as unknown as MyGym;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(GymsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("searches the public directory with the term and city", () => {
    service.search("boxe", "Tunis").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/gyms?q=boxe&city=Tunis`);
    expect(req.request.method).toBe("GET");
    req.flush({ gyms: [] });
  });

  it("omits empty search params rather than sending blanks", () => {
    service.search().subscribe();
    httpMock.expectOne(`${API_BASE_URL}/gyms`).flush({ gyms: [] });
  });

  it("caches my gyms so every member screen reads the same list", () => {
    service.loadMine().subscribe();
    httpMock.expectOne(`${API_BASE_URL}/me/gyms`).flush({ gyms: [gym] });
    expect(service.mine()).toEqual([gym]);
  });

  it("adds a joined gym to the list, and never twice", () => {
    service.join("g1").subscribe();
    httpMock.expectOne(`${API_BASE_URL}/me/gyms`).flush({ gym });
    expect(service.mine().length).toBe(1);

    service.join("g1").subscribe();
    httpMock.expectOne(`${API_BASE_URL}/me/gyms`).flush({ gym });
    expect(service.mine().length).toBe(1);
  });

  it("drops a gym on leaving, and clears it if it was the one selected", () => {
    service.mine.set([gym]);
    service.select("g1");

    service.leave("g1").subscribe();
    httpMock.expectOne(`${API_BASE_URL}/me/gyms/g1`).flush(null);

    expect(service.mine()).toEqual([]);
    expect(service.selectedId()).toBeNull();
  });
});
