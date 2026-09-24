import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { AppUpdate } from "../models/app-update.model";

// The platform changelog. Superadmins publish (list/create against
// /superadmin/app_updates) — publishing fans out a real-time "system_update"
// notification to every other superadmin AND every admin. Admins get a
// read-only view of the same data via list() against /app_updates
// (Api::V1::AppUpdatesController), reached from that notification's link.
@Injectable({ providedIn: "root" })
export class AppUpdatesService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<{ app_updates: AppUpdate[] }> {
    return this.http.get<{ app_updates: AppUpdate[] }>(`${API_BASE_URL}/app_updates`);
  }

  listSuperadmin(): Observable<{ app_updates: AppUpdate[] }> {
    return this.http.get<{ app_updates: AppUpdate[] }>(`${API_BASE_URL}/superadmin/app_updates`);
  }

  create(version: string, title: string, description: string, media: File[]): Observable<{ app_update: AppUpdate }> {
    const formData = new FormData();
    formData.append("app_update[version]", version);
    formData.append("app_update[title]", title);
    formData.append("app_update[description]", description);
    media.forEach((file) => formData.append("media[]", file));
    return this.http.post<{ app_update: AppUpdate }>(`${API_BASE_URL}/superadmin/app_updates`, formData);
  }
}
