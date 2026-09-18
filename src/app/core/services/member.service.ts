import { HttpClient } from "@angular/common/http";
import { Injectable, computed, inject, signal } from "@angular/core";
import { Observable, tap } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { MemberProfile } from "../models/member.model";

/**
 * The member's own file — who they are, which gym, what they train on, and
 * whether they have been turning up.
 *
 * Held in a signal because the shell (the gym's name) and three screens all
 * read it, and it changes only when a booking does.
 */
@Injectable({ providedIn: "root" })
export class MemberService {
  private readonly http = inject(HttpClient);

  readonly profile = signal<MemberProfile | null>(null);

  /** The gym whose schedule the app is showing. Almost always the only one. */
  readonly companyId = computed(() => this.profile()?.gyms[0]?.id ?? null);
  readonly companyName = computed(() => this.profile()?.gyms[0]?.name ?? null);

  load(): Observable<MemberProfile> {
    return this.http
      .get<MemberProfile>(`${API_BASE_URL}/me/profile`)
      .pipe(tap((profile) => this.profile.set(profile)));
  }

  clear(): void {
    this.profile.set(null);
  }
}
