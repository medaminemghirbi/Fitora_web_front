import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";

// Forgot-password + email verification — deliberately separate from
// AuthService: none of these calls carry or set a session (a password
// reset happens while signed out; a resend happens while signed in but
// doesn't touch the token/user AuthService owns).
@Injectable({ providedIn: "root" })
export class AccountRecoveryService {
  constructor(private readonly http: HttpClient) {}

  requestPasswordReset(email: string): Observable<void> {
    return this.http.post<void>(`${API_BASE_URL}/password_resets`, { email });
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.http.patch<void>(`${API_BASE_URL}/password_resets/${token}`, { password });
  }

  /** A member choosing their password from the invitation their gym sent. */
  acceptInvitation(token: string, password: string): Observable<void> {
    return this.http.patch<void>(`${API_BASE_URL}/invitations/${token}`, { password });
  }

  verifyEmail(token: string): Observable<void> {
    return this.http.patch<void>(`${API_BASE_URL}/email_verifications/${token}`, {});
  }

  // Authenticated — resends to whoever the current token belongs to.
  resendVerification(): Observable<void> {
    return this.http.post<void>(`${API_BASE_URL}/email_verifications`, {});
  }
}
