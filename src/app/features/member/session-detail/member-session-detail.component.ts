import { Component, OnInit, computed, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Session } from "../../../core/models/session.model";
import { BrandingService } from "../../../core/services/branding.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { MemberBookingsService } from "../../../core/services/member-bookings.service";
import { MemberSessionsService } from "../../../core/services/member-sessions.service";
import { spotsLeft } from "../../../core/services/member.util";
import { ToastService } from "../../../core/services/toast.service";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";

@Component({
  selector: "app-member-session-detail",
  standalone: true,
  imports: [DatePipe, TranslateModule, SpinnerComponent, ErrorStateComponent, SkeletonComponent],
  providers: [DatePipe],
  templateUrl: "./member-session-detail.component.html",
  styleUrl: "./member-session-detail.component.scss",
})
export class MemberSessionDetailComponent implements OnInit {
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly session = signal<Session | null>(null);
  readonly booking = signal(false);

  readonly spotsLeft = spotsLeft;

  readonly durationMinutes = computed(() => {
    const session = this.session();
    if (!session) return 0;
    return Math.round((new Date(session.ends_at).getTime() - new Date(session.starts_at).getTime()) / 60000);
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly sessionsService: MemberSessionsService,
    private readonly bookingsService: MemberBookingsService,
    private readonly confirm: ConfirmService,
    private readonly toast: ToastService,
    private readonly translate: TranslateService,
    private readonly datePipe: DatePipe,
    readonly branding: BrandingService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id")!;
    // Passed via router state from the card that was tapped (Home/Explore) —
    // there's no GET /me/sessions/:id, so a direct visit/refresh falls back
    // to re-fetching the whole list and finding it there.
    const stateSession = history.state?.session as Session | undefined;
    if (stateSession && stateSession.id === id) {
      this.session.set(stateSession);
      this.loading.set(false);
      return;
    }

    this.sessionsService.list().subscribe({
      next: (res) => {
        const found = res.sessions.find((s) => s.id === id) ?? null;
        this.session.set(found);
        this.notFound.set(!found);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }

  async book(): Promise<void> {
    const session = this.session();
    if (!session) return;

    const when = this.datePipe.transform(session.starts_at, "EEE d MMM, HH:mm") ?? "";
    const confirmed = await this.confirm.ask({
      title: this.translate.instant("member.session.confirm_title"),
      body: this.translate.instant("member.session.confirm_body", { activity: session.activity_name, when }),
      confirmLabel: this.translate.instant("member.session.confirm_cta"),
    });
    if (!confirmed) return;

    this.booking.set(true);
    this.bookingsService.create(session.id).subscribe({
      next: (res) => {
        this.booking.set(false);
        this.router.navigate(["/member/bookings", res.booking.id, "confirmed"], { state: { booking: res.booking } });
      },
      error: (err) => {
        this.booking.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("member.session.booking_failed")));
      },
    });
  }
}
