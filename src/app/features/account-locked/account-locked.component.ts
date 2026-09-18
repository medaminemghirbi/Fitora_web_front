import { Component, computed, inject, signal } from "@angular/core";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";
import { ConfigurationService } from "../../core/configuration/configuration.service";
import { SubscriptionService } from "../../core/services/subscription.service";
import { ToastService } from "../../core/services/toast.service";
import { extractErrorMessage } from "../../core/services/error.util";
import { SpinnerComponent } from "../../shared/components/spinner.component";

/**
 * The only page a locked gym sees. No shell, no navigation, no way back
 * into the app — the point is that the door is shut.
 *
 * It is still not a dead end: asking to be activated is the one action
 * that lifts the lock, so it lives here rather than behind the door it
 * closed. Staff get no action at all; the money is not theirs to settle.
 */
@Component({
  selector: "app-account-locked",
  standalone: true,
  imports: [TranslateModule, SpinnerComponent],
  templateUrl: "./account-locked.component.html",
  styleUrl: "./account-locked.component.scss",
})
export class AccountLockedComponent {
  readonly auth = inject(AuthService);
  private readonly config = inject(ConfigurationService);
  private readonly subscriptions = inject(SubscriptionService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly requesting = signal(false);
  readonly requested = signal(false);

  readonly isOwner = computed(() => this.auth.currentUser()?.role === "owner");

  /** Why the door is shut. Falls back to the general case. */
  readonly reason = computed(() => this.config.subscription()?.lock_reason ?? "suspended");

  ask(): void {
    if (this.requesting()) return;

    this.requesting.set(true);
    this.subscriptions.requestUpgrade().subscribe({
      next: () => {
        this.requesting.set(false);
        this.requested.set(true);
      },
      error: (err) => {
        this.requesting.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
