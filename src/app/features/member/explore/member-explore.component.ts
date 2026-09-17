import { Component, OnInit, computed, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { Session } from "../../../core/models/session.model";
import { MemberSessionsService } from "../../../core/services/member-sessions.service";
import { spotsLeft } from "../../../core/services/member.util";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { GymSwitcherComponent } from "../gyms/gym-switcher.component";
import { GymsService } from "../../../core/services/gyms.service";

function toDateInputValue(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

@Component({
  selector: "app-member-explore",
  standalone: true,
  imports: [FormsModule, DatePipe, TranslateModule, EmptyStateComponent, StatusBadgeComponent, ErrorStateComponent, SkeletonComponent, GymSwitcherComponent],
  templateUrl: "./member-explore.component.html",
  styleUrl: "./member-explore.component.scss",
})
export class MemberExploreComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly sessions = signal<Session[]>([]);

  readonly search = signal("");
  readonly activityFilter = signal("");
  readonly dateFilter = signal("");

  readonly spotsLeft = spotsLeft;

  readonly activityOptions = computed(() => {
    const names = new Set(this.sessions().map((s) => s.activity_name));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  });

  readonly filteredSessions = computed(() => {
    const search = this.search().trim().toLowerCase();
    const activity = this.activityFilter();
    const date = this.dateFilter();

    return this.sessions().filter((s) => {
      if (search && !s.activity_name.toLowerCase().includes(search)) return false;
      if (activity && s.activity_name !== activity) return false;
      if (date && toDateInputValue(s.starts_at) !== date) return false;
      return true;
    });
  });

  readonly hasFilters = computed(() => this.search() !== "" || this.activityFilter() !== "" || this.dateFilter() !== "");

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly sessionsService: MemberSessionsService,
    private readonly gyms: GymsService
  ) {}

  ngOnInit(): void {
    const activityParam = this.route.snapshot.queryParamMap.get("activity");
    if (activityParam) this.activityFilter.set(activityParam);
    // The switcher reads this list, and it is what "all my gyms" means.
    if (this.gyms.mine().length === 0) this.gyms.loadMine().subscribe({ error: () => undefined });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.sessionsService.list(undefined, this.gyms.selectedId()).subscribe({
      next: (res) => {
        this.sessions.set(res.sessions);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  clearFilters(): void {
    this.search.set("");
    this.activityFilter.set("");
    this.dateFilter.set("");
  }

  openSession(session: Session): void {
    this.router.navigate(["/member/sessions", session.id], { state: { session } });
  }
}
