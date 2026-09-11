import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { Location } from "../models/location.model";

export type LocationPayload = Partial<
  Pick<Location, "name" | "description" | "phone" | "email" | "address" | "city" | "timezone" | "business_hours_start" | "business_hours_end">
>;

// Every company has exactly one location — this is a singular resource,
// same pattern as CompanyService, not a list.
@Injectable({ providedIn: "root" })
export class LocationsService {
  constructor(private readonly http: HttpClient) {}

  get(): Observable<{ location: Location }> {
    return this.http.get<{ location: Location }>(`${API_BASE_URL}/location`);
  }

  update(payload: LocationPayload): Observable<{ location: Location }> {
    return this.http.patch<{ location: Location }>(`${API_BASE_URL}/location`, { location: payload });
  }
}
