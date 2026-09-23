import { Component, OnInit, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { debounceTime, distinctUntilChanged, Subject, switchMap } from "rxjs";
import { CoachMember, CoachMembersService } from "../../../core/services/coach-members.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { AvatarComponent } from "../../../shared/components/avatar.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";

/**
 * The people this coach trains.
 *
 * Everyone with a live booking on one of their own sessions — not the gym's
 * member list, which is somebody else's screen. What a coach gets is a name,
 * a way to reach them, when they last came and when they are next due. No
 * subscription, no balance: the backend does not send it and the type does
 * not have it.
 */
@Component({
  selector: "app-coach-members",
  standalone: true,
  imports: [DatePipe, TranslateModule, AvatarComponent, EmptyStateComponent, ErrorStateComponent, SkeletonComponent],
  templateUrl: "./coach-members.component.html",
  styleUrl: "./coach-members.component.scss",
})
export class CoachMembersComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly members = signal<CoachMember[]>([]);
  readonly query = signal("");
  readonly total = signal(0);

  private readonly typed = new Subject<string>();

  constructor(
    private readonly service: CoachMembersService,
    private readonly translate: TranslateService
  ) {
    this.typed
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((q) => {
          this.loading.set(true);
          return this.service.list({ q });
        })
      )
      .subscribe({
        next: (response) => this.apply(response.members, response.meta.total),
        error: (err) => this.fail(err),
      });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.list({ q: this.query() || undefined }).subscribe({
      next: (response) => this.apply(response.members, response.meta.total),
      error: (err) => this.fail(err),
    });
  }

  onSearch(term: string): void {
    this.query.set(term);
    this.typed.next(term.trim());
  }

  /** Whether this member has been absent long enough to be worth a word. */
  isLapsed(member: CoachMember): boolean {
    if (member.next_session_at) return false;
    if (!member.last_seen_at) return false;

    const days = (Date.now() - new Date(member.last_seen_at).getTime()) / 86_400_000;
    return days >= 21;
  }

  private apply(members: CoachMember[], total: number): void {
    this.members.set(members);
    this.total.set(total);
    this.error.set(null);
    this.loading.set(false);
  }

  private fail(err: unknown): void {
    this.error.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
    this.loading.set(false);
  }
}
