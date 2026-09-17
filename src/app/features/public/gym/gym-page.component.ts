import { Component, OnInit, computed, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { GymDetail, PublicSession } from "../../../core/models/gym.model";
import { GymsService } from "../../../core/services/gyms.service";
import { AuthService } from "../../../core/auth/auth.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { PublicHeaderComponent } from "../../../shared/components/public-header.component";
import { LandingFooterComponent } from "../../../shared/components/landing-footer.component";

/**
 * A gym's public page — the thing a stranger lands on from the directory or a
 * shared link. Open without a login: someone has to be able to look before
 * they sign up. Joining needs an account, so the button sends them to the
 * member sign-up and comes back here.
 */
@Component({
  selector: "app-gym-page",
  standalone: true,
  imports: [RouterLink, DatePipe, TranslateModule, SpinnerComponent, ErrorStateComponent, PublicHeaderComponent, LandingFooterComponent],
  templateUrl: "./gym-page.component.html",
})
export class GymPageComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly joining = signal(false);
  readonly gym = signal<GymDetail | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly gyms: GymsService,
    readonly auth: AuthService,
    private readonly toast: ToastService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get("id") ?? "";
    this.loading.set(true);
    this.error.set(false);
    this.gyms.get(id).subscribe({
      next: (res) => {
        this.gym.set(res.gym);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  /**
   * The week ahead, grouped by day. Someone deciding whether to join is
   * asking "is there a class on a weekday evening that fits" — a flat list
   * ordered by time does not answer that, a day-by-day one does.
   */
  readonly scheduleByDay = computed(() => {
    const days = new Map<string, PublicSession[]>();
    (this.gym()?.sessions ?? []).forEach((session) => {
      const day = session.starts_at.slice(0, 10);
      days.set(day, [...(days.get(day) ?? []), session]);
    });
    return Array.from(days, ([day, sessions]) => ({ day, sessions }));
  });

  isMember(): boolean {
    const gym = this.gym();
    return !!gym && this.gyms.mine().some((g) => g.id === gym.id);
  }

  join(): void {
    const gym = this.gym();
    if (!gym) return;

    if (!this.auth.isClient()) {
      this.router.navigate(["/register/member"], { queryParams: { gym: gym.id } });
      return;
    }

    this.joining.set(true);
    this.gyms.join(gym.id).subscribe({
      next: () => {
        this.joining.set(false);
        this.toast.success(this.translate.instant("member.gyms.joined", { gym: gym.name }));
        this.router.navigate(["/member/gyms"]);
      },
      error: (err) => {
        this.joining.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }
}
