import { Component } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";

// No self-service upgrade — access past the free trial is granted by hand
// by a Fitora admin (Api::V1::Admin::CompaniesController#update_subscription).
// This page just tells the owner their trial ended and how the account gets
// unlocked.
@Component({
  selector: "app-trial-expired",
  standalone: true,
  imports: [TranslateModule],
  templateUrl: "./trial-expired.component.html",
  styleUrl: "./trial-expired.component.scss",
})
export class TrialExpiredComponent {
  constructor(readonly auth: AuthService) {}

  logout(): void {
    this.auth.logout();
  }
}
