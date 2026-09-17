import { HttpClient } from "@angular/common/http";
import { Injectable, signal } from "@angular/core";
import { Observable, tap } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { Gym, GymDetail, MyGym } from "../models/gym.model";
import { Coords } from "./geolocation.service";

/**
 * The public gym directory, and the gyms the signed-in person belongs to.
 *
 * `mine` is held here because every member screen needs it: a person belongs
 * to several gyms now, so "which gym am I looking at" is app-wide state, not
 * a page's own.
 */
@Injectable({ providedIn: "root" })
export class GymsService {
  readonly mine = signal<MyGym[]>([]);
  /** null = every gym at once, which is what the member screens open on. */
  readonly selectedId = signal<string | null>(null);

  constructor(private readonly http: HttpClient) {}

  /**
   * Open to anyone, logged in or not. With coordinates, the backend sorts by
   * distance and each gym comes back with how far it is.
   */
  search(query?: string, city?: string, near?: Coords | null): Observable<{ gyms: Gym[] }> {
    const params: Record<string, string> = {};
    if (query) params["q"] = query;
    if (city) params["city"] = city;
    if (near) {
      params["lat"] = String(near.lat);
      params["lng"] = String(near.lng);
    }
    return this.http.get<{ gyms: Gym[] }>(`${API_BASE_URL}/gyms`, { params });
  }

  get(id: string): Observable<{ gym: GymDetail }> {
    return this.http.get<{ gym: GymDetail }>(`${API_BASE_URL}/gyms/${id}`);
  }

  loadMine(): Observable<{ gyms: MyGym[] }> {
    return this.http.get<{ gyms: MyGym[] }>(`${API_BASE_URL}/me/gyms`).pipe(tap((res) => this.mine.set(res.gyms)));
  }

  join(gymId: string): Observable<{ gym: MyGym }> {
    return this.http
      .post<{ gym: MyGym }>(`${API_BASE_URL}/me/gyms`, { gym_id: gymId })
      .pipe(tap((res) => this.mine.update((gyms) => (gyms.some((g) => g.id === res.gym.id) ? gyms : [...gyms, res.gym]))));
  }

  leave(gymId: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/me/gyms/${gymId}`).pipe(
      tap(() => {
        this.mine.update((gyms) => gyms.filter((g) => g.id !== gymId));
        if (this.selectedId() === gymId) this.selectedId.set(null);
      })
    );
  }

  select(gymId: string | null): void {
    this.selectedId.set(gymId);
  }
}
