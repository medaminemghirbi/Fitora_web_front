import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { NgProgressbar } from "ngx-progressbar";
import { NgProgressRouter } from "ngx-progressbar/router";
import { NgProgressHttp } from "ngx-progressbar/http";
import { AuthService } from "./core/auth/auth.service";
import { LocaleService } from "./core/services/locale.service";
import { ThemeService } from "./core/services/theme.service";
import { CommandPaletteComponent } from "./shared/components/command-palette.component";
import { ConfirmDialogComponent } from "./shared/components/confirm-dialog.component";
import { ToastContainerComponent } from "./shared/components/toast-container.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, NgProgressbar, NgProgressRouter, NgProgressHttp, ToastContainerComponent, ConfirmDialogComponent, CommandPaletteComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  // Injected eagerly so the theme/locale are applied to <html> before first paint.
  constructor(
    private readonly theme: ThemeService,
    private readonly locale: LocaleService,
    private readonly auth: AuthService
  ) {
    // Refresh company configuration (branding, permissions, modules) on a
    // hard reload of an existing session.
    if (this.auth.isAuthenticated()) {
      this.auth.loadConfiguration();
    }
  }
}
