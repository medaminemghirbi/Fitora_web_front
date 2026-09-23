import { Component, computed, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { LocaleService, Locale, LOCALES } from "../../core/services/locale.service";
import { ThemeService } from "../../core/services/theme.service";

interface TodayClass {
  time: string;
  name: string;
  coach: string;
  room: string;
  booked: number;
  capacity: number;
  waitlist: number;
}

/**
 * Public landing page — "Éditorial" direction (2026-09-22): a serif
 * display face (Fraunces, --font-editorial) over the app's own sans, on the
 * app's own tokens, so it follows the light / dark toggle like the product.
 *
 * Sections: nav → hero with today's classes → a band naming the modules →
 * six numbered features → "comme une séance" in three steps → the trial →
 * questions → closing call → footer. Everything is visible at rest; no
 * scroll-reveal, no screenshots to go stale — the hero card is built from
 * divs and its data is illustrative.
 *
 * Nav and footer are inline rather than shared components: nothing else
 * uses them (the account screens have their own frame, AuthProShell).
 */
@Component({
  selector: "app-landing",
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: "./landing.component.html",
  styleUrl: "./landing.component.scss",
})
export class LandingComponent {
  readonly theme = inject(ThemeService);
  readonly locale = inject(LocaleService);

  readonly langMenuOpen = signal(false);
  readonly mobileOpen = signal(false);
  readonly locales = LOCALES;
  readonly year = signal(new Date().getFullYear());

  /** Today's date in the page's language — the hero card is "today". */
  readonly todayLabel = computed(() => {
    const code = this.locale.locale() === "ar" ? "ar-TN" : this.locale.locale();
    const label = new Intl.DateTimeFormat(code, { weekday: "long", day: "numeric", month: "long" }).format(new Date());
    return label.charAt(0).toLocaleUpperCase(code) + label.slice(1);
  });

  /** One gym's day, for the hero card. Illustrative. */
  readonly todayClasses: TodayClass[] = [
    { time: "07:00", name: "RPM", coach: "Sami", room: "Studio 1", booked: 18, capacity: 20, waitlist: 0 },
    { time: "09:00", name: "Pilates", coach: "Sarah", room: "Studio 2", booked: 12, capacity: 12, waitlist: 3 },
    { time: "12:30", name: "EMS", coach: "Amine", room: "Cabine", booked: 2, capacity: 4, waitlist: 0 },
    { time: "18:30", name: "Cross Training", coach: "Yassine", room: "Plateau", booked: 11, capacity: 16, waitlist: 0 },
  ];

  readonly heroPoints = ["landing.hero_point_1", "landing.hero_point_2", "landing.hero_point_3"];

  readonly band = ["landing.band_1", "landing.band_2", "landing.band_3", "landing.band_4", "landing.band_5", "landing.band_6"];

  /** The six features, in the order a gym meets them during a day. */
  readonly features = [
    { title: "landing.f_planning_t", text: "landing.f_planning_d" },
    { title: "landing.f_memberships_t", text: "landing.f_memberships_d" },
    { title: "landing.f_checkin_t", text: "landing.f_checkin_d" },
    { title: "landing.f_member_t", text: "landing.f_member_d" },
    { title: "landing.f_cash_t", text: "landing.f_cash_d" },
    { title: "landing.f_hr_t", text: "landing.f_hr_d" },
  ];

  readonly steps = [1, 2, 3];

  readonly pricingItems = [
    "landing.pricing_item_1",
    "landing.pricing_item_2",
    "landing.pricing_item_3",
    "landing.pricing_item_4",
    "landing.pricing_item_5",
    "landing.pricing_item_6",
  ];

  /** Which of the landing.faq_q_N / faq_a_N pairs to show, in order. */
  readonly faqs = [1, 4, 9, 3, 8, 7];

  // ---- FAQ accordion — one open panel at a time ----
  readonly openFaq = signal<number | null>(1);

  toggleFaq(i: number): void {
    this.openFaq.set(this.openFaq() === i ? null : i);
  }

  fill(c: TodayClass): number {
    return Math.min(100, Math.round((c.booked / c.capacity) * 100));
  }

  isFull(c: TodayClass): boolean {
    return c.booked >= c.capacity;
  }

  setLocale(code: Locale): void {
    this.locale.setLocale(code);
    this.langMenuOpen.set(false);
  }
}
