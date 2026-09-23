import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { Space } from "../models/space.model";

export interface SpacePayload {
  name?: string;
  kind?: string | null;
  capacity?: number | null;
  active?: boolean;
  activity_ids?: string[];
}

@Injectable({ providedIn: "root" })
export class SpacesService {
  private readonly http = inject(HttpClient);

  list(): Observable<{ spaces: Space[] }> {
    return this.http.get<{ spaces: Space[] }>(`${API_BASE_URL}/spaces`);
  }

  create(payload: SpacePayload): Observable<{ space: Space }> {
    return this.http.post<{ space: Space }>(`${API_BASE_URL}/spaces`, { space: payload });
  }

  update(id: string, payload: SpacePayload): Observable<{ space: Space }> {
    return this.http.patch<{ space: Space }>(`${API_BASE_URL}/spaces/${id}`, { space: payload });
  }

  /** Deletes the room, or deactivates it if sessions are still booked in it. */
  remove(id: string): Observable<{ space: Space }> {
    return this.http.delete<{ space: Space }>(`${API_BASE_URL}/spaces/${id}`);
  }
}
