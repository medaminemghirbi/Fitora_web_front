import { Component } from "@angular/core";
import { DatePipe } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../../core/auth/auth.service";
import { LOCALES, Locale, LocaleService } from "../../../core/services/locale.service";

@Component({
  selector: "app-member-profile",
  standalone: true,
  imports: [DatePipe, TranslateModule],
  templateUrl: "./member-profile.component.html",
  styleUrl: "./member-profile.component.scss",
})
export class MemberProfileComponent {
  readonly locales = LOCALES;

  constructor(
    readonly auth: AuthService,
    readonly locale: LocaleService
  ) {}

  setLocale(code: Locale): void {
    this.locale.setLocale(code);
  }

  logout(): void {
    this.auth.logout();
  }
}
