import { Component, OnInit, computed, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Session } from "../../../core/models/session.model";
import { SessionsService } from "../../../core/services/sessions.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { CheckinPanelComponent } from "../../../shared/ui/checkin-panel.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Check-in, as the desk actually does it: pick the session people are
 * arriving for, then tick them off.
 *
 * The session list is today's only. A receptionist checking someone into
 * next Tuesday's class is not a workflow, it is a mistake, and the way to
 * avoid it is to not offer it.
 *
 * `?session=` preselects one, so the dashboard's "check people in" lands
 * straight on the right roster with nothing to choose.
 */
@Component({
  selector: "app-desk-checkin",
  standalone: true,
  imports: [DatePipe, TranslateModule, CheckinPanelComponent, EmptyStateComponent, ErrorStateComponent, SkeletonComponent],
  templateUrl: "./desk-checkin.component.html",
  styleUrl: "./desk-checkin.component.scss",
})
export class DeskCheckinComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly sessions = signal<Session[]>([]);
  readonly selectedId = signal<string | null>(null);

  readonly selected = computed(() => this.sessions().find((s) => s.id === this.selectedId()) ?? null);

  constructor(
    private readonly sessionsService: SessionsService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.sessionsService.list({ date: today() }).subscribe({
      next: (response) => {
        const bookable = response.sessions.filter((s) => s.status === "scheduled");
        this.sessions.set(bookable);

        const requested = this.route.snapshot.queryParamMap.get("session");
        // Only honour the query param if it is actually one of today's — a
        // stale link should land on the picker, not on an empty roster.
        const preselected = bookable.find((s) => s.id === requested);
        this.selectedId.set(preselected?.id ?? (bookable.length === 1 ? bookable[0].id : null));

        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
        this.loading.set(false);
      },
    });
  }

  select(session: Session): void {
    this.selectedId.set(session.id);
    // Keeps the URL honest, so a refresh or a back button returns to the same
    // roster rather than the picker.
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { session: session.id },
      replaceUrl: true,
    });
  }

  back(): void {
    this.selectedId.set(null);
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }
}
