import { HttpClient } from "@angular/common/http";
import { Injectable, computed, inject, signal } from "@angular/core";
import { Observable, tap } from "rxjs";
import { ConfigurationService } from "../configuration/configuration.service";
import { API_BASE_URL } from "../models/api-config";
import { OnboardingState, OnboardingStepKey } from "../models/onboarding.model";

interface OnboardingResponse {
  onboarding: OnboardingState;
}

/**
 * First-time setup. The server owns how far along a company is — every step
 * that can be derived from data is derived — so this only reads it and
 * records the two answers no table holds: "I have looked at this" and "I do
 * not need this".
 *
 * The bootstrap payload carries the state at page load; anything this
 * service fetches afterwards supersedes it, so the flow stays right without
 * re-bootstrapping the whole shell on every step.
 */
@Injectable({ providedIn: "root" })
export class OnboardingService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigurationService);

  private readonly fetched = signal<OnboardingState | null>(null);

  readonly state = computed(() => this.fetched() ?? this.config.onboarding());

  load(): Observable<OnboardingResponse> {
    return this.request(this.http.get<OnboardingResponse>(`${API_BASE_URL}/onboarding`));
  }

  /** "I have done this one." */
  complete(step: OnboardingStepKey): Observable<OnboardingResponse> {
    return this.request(this.http.patch<OnboardingResponse>(`${API_BASE_URL}/onboarding`, { step }));
  }

  /** "I do not need this one." Refused server-side for a step that is not optional. */
  skip(step: OnboardingStepKey): Observable<OnboardingResponse> {
    return this.request(this.http.post<OnboardingResponse>(`${API_BASE_URL}/onboarding/skip`, { step }));
  }

  /** Leave the flow. Nothing is marked done; the app just stops asking. */
  dismiss(): Observable<OnboardingResponse> {
    return this.request(this.http.post<OnboardingResponse>(`${API_BASE_URL}/onboarding/dismiss`, {}));
  }

  private request(source: Observable<OnboardingResponse>): Observable<OnboardingResponse> {
    return source.pipe(tap((res) => this.fetched.set(res.onboarding)));
  }
}
