import { Component, OnInit, computed, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { Gym } from "../../../core/models/gym.model";
import { GymsService } from "../../../core/services/gyms.service";
import { GeolocationService } from "../../../core/services/geolocation.service";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { PublicHeaderComponent } from "../../../shared/components/public-header.component";
import { LandingFooterComponent } from "../../../shared/components/landing-footer.component";

/**
 * The public gym search. Open with no account at all: someone has to be able
 * to look around before deciding to sign up, so the whole directory is
 * browsable and joining is what asks for an account.
 *
 * "Autour de moi" sorts by distance. The position is asked for on a click,
 * never on load — except for someone who already granted it, where the
 * browser answers silently and the list opens already sorted.
 */
@Component({
  selector: "app-gym-search",
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule, SpinnerComponent, EmptyStateComponent, PublicHeaderComponent, LandingFooterComponent],
  templateUrl: "./gym-search.component.html",
  styleUrl: "./gym-search.component.scss",
})
export class GymSearchComponent implements OnInit {
  readonly loading = signal(true);
  readonly query = signal("");
  readonly city = signal("");
  readonly gyms = signal<Gym[]>([]);
  /** "" = every activity. Narrows the loaded page, client-side. */
  readonly activityFilter = signal("");

  /**
   * The activity pills are built from what the directory actually returned —
   * there is no catalogue of activities across gyms, and inventing one would
   * offer filters that match nothing.
   */
  readonly activityOptions = computed(() => {
    const names = new Set<string>();
    this.gyms().forEach((gym) => gym.activity_names.forEach((name) => names.add(name)));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  });

  readonly visibleGyms = computed(() => {
    const activity = this.activityFilter();
    if (!activity) return this.gyms();
    return this.gyms().filter((gym) => gym.activity_names.includes(activity));
  });

  /** A gym's own colour when it published one, else a stable one from its id. */
  bannerColor(gym: Gym): string {
    if (gym.primary_color) return gym.primary_color;
    const palette = ["#4a2a8f", "#0f766e", "#e8005f", "#6946aa", "#b45309", "#15803d"];
    const seed = [...gym.id].reduce((total, char) => total + char.charCodeAt(0), 0);
    return palette[seed % palette.length];
  }

  constructor(
    private readonly gymsService: GymsService,
    readonly geo: GeolocationService
  ) {}

  ngOnInit(): void {
    this.geo.locateIfAlreadyAllowed().then(() => this.load());
  }

  /** The search form, which must not lose the sort that is already applied. */
  search(): void {
    this.load();
  }

  /** The "Autour de moi" button — the only place the permission is asked. */
  async locateAndSort(): Promise<void> {
    if (await this.geo.locate()) this.load();
  }

  clearLocation(): void {
    this.geo.coords.set(null);
    this.geo.state.set("idle");
    this.load();
  }

  /**
   * The position lives in one place only — the service's signal. Passing it
   * around as well drifts: the list would sort by a position the button no
   * longer shows, or the reverse.
   */
  private load(): void {
    this.loading.set(true);
    this.gymsService.search(this.query() || undefined, this.city() || undefined, this.geo.coords()).subscribe({
      next: (res) => {
        this.gyms.set(res.gyms);
        // A pill that no longer matches anything would silently empty the page.
        if (!this.activityOptions().includes(this.activityFilter())) this.activityFilter.set("");
        this.loading.set(false);
      },
      error: () => {
        this.gyms.set([]);
        this.loading.set(false);
      },
    });
  }
}
