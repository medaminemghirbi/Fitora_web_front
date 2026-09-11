import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, tap } from "rxjs";
import { ConfigurationService, SetupState } from "../configuration/configuration.service";
import { API_BASE_URL } from "../models/api-config";

// The "Premiers pas" guide. Its checklist lives in the bootstrap payload
// (ConfigurationService.setup); this service only dismisses it.
@Injectable({ providedIn: "root" })
export class OnboardingService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigurationService);

  dismiss(): Observable<{ setup: SetupState }> {
    return this.http
      .post<{ setup: SetupState }>(`${API_BASE_URL}/onboarding/dismiss`, {})
      .pipe(tap(() => this.config.load().subscribe({ error: () => {} })));
  }
}
