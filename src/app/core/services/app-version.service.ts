import { HttpClient } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { API_BASE_URL } from "../models/api-config";
import { AppVersionInfo } from "../models/app-update.model";

// The running app version shown in the admin/superadmin shell chrome — a thin
// read of the latest AppUpdate a superadmin published. Fetched once per session
// and cached in a signal; every shell just reads `current()`.
@Injectable({ providedIn: "root" })
export class AppVersionService {
  private readonly http = inject(HttpClient);

  readonly current = signal<string | null>(null);
  private loaded = false;

  load(): void {
    if (this.loaded) return;
    this.refresh();
  }

  // Re-fetches regardless of cache — called when a live "system_update"
  // notification arrives, so the badge doesn't need a page reload to catch up.
  refresh(): void {
    this.loaded = true;
    this.http.get<AppVersionInfo>(`${API_BASE_URL}/app_version`).subscribe({
      next: (res) => this.current.set(res.version),
      error: () => {
        this.loaded = false;
      },
    });
  }
}
