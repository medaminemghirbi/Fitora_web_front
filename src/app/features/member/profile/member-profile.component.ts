import { Component, inject, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";
import { MemberService } from "../../../core/services/member.service";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";

/**
 * The member's own file: the subscription they train on and whether they
 * have been turning up.
 *
 * No money anywhere on this screen. What a member owes is settled with the
 * desk; an app quoting a balance back at them invites an argument nobody
 * here can resolve.
 */
@Component({
  selector: "app-member-profile",
  standalone: true,
  imports: [DatePipe, TranslateModule, EmptyStateComponent, SkeletonComponent, ErrorStateComponent],
  templateUrl: "./member-profile.component.html",
  styleUrl: "./member-profile.component.scss",
})
export class MemberProfileComponent {
  readonly member = inject(MemberService);

  readonly loading = signal(true);
  readonly error = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.member.load().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
