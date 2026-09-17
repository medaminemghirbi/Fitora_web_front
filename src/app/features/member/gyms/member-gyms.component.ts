import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Gym, MyGym } from "../../../core/models/gym.model";
import { GymsService } from "../../../core/services/gyms.service";
import { ToastService } from "../../../core/services/toast.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";

/**
 * "My gyms", and the directory to find more. A person belongs to as many gyms
 * as they like, so this is where they join one, leave one, and pick which one
 * the rest of the member app is showing.
 */
@Component({
  selector: "app-member-gyms",
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule, SpinnerComponent, EmptyStateComponent],
  templateUrl: "./member-gyms.component.html",
})
export class MemberGymsComponent implements OnInit {
  readonly loading = signal(true);
  readonly searching = signal(false);
  readonly joiningId = signal<string | null>(null);
  readonly query = signal("");
  readonly results = signal<Gym[]>([]);
  readonly searched = signal(false);

  constructor(
    readonly gyms: GymsService,
    private readonly toast: ToastService,
    private readonly confirm: ConfirmService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.gyms.loadMine().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  search(): void {
    this.searching.set(true);
    this.gyms.search(this.query()).subscribe({
      next: (res) => {
        this.results.set(res.gyms);
        this.searched.set(true);
        this.searching.set(false);
      },
      error: () => {
        this.searching.set(false);
        this.toast.error(this.translate.instant("common.error_generic"));
      },
    });
  }

  isMember(gym: Gym): boolean {
    return this.gyms.mine().some((g) => g.id === gym.id);
  }

  join(gym: Gym): void {
    this.joiningId.set(gym.id);
    this.gyms.join(gym.id).subscribe({
      next: () => {
        this.joiningId.set(null);
        this.toast.success(this.translate.instant("member.gyms.joined", { gym: gym.name }));
      },
      error: (err) => {
        this.joiningId.set(null);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  async leave(gym: MyGym): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.translate.instant("member.gyms.leave_confirm_title"),
      body: this.translate.instant("member.gyms.leave_confirm_body", { gym: gym.name }),
      danger: true,
    });
    if (!ok) return;

    this.gyms.leave(gym.id).subscribe({
      next: () => this.toast.success(this.translate.instant("member.gyms.left", { gym: gym.name })),
      error: () => this.toast.error(this.translate.instant("common.error_generic")),
    });
  }
}
