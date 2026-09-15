import { AfterViewInit, Component, computed, ElementRef, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { LocaleService, Locale, LOCALES } from "../../core/services/locale.service";
import { ThemeService } from "../../core/services/theme.service";

/**
 * Public landing page — light, app-native direction: the same tokens the
 * product itself runs on (src/styles/_tokens.scss), rather than a separate
 * dark marketing skin. The product is evoked with a "cockpit" panel and an
 * illustrated bento built from divs — no screenshots. The signature
 * gradient (violet → raspberry → sunglow) carries the hero, the primary CTA
 * and the brand mark. Nav and footer are inline here rather than the shared
 * light <app-landing-header>/<app-landing-footer> used on the auth pages.
 */
@Component({
  selector: "app-landing",
  standalone: true,
  imports: [RouterLink, TranslateModule, FormsModule, CommonModule],
  templateUrl: "./landing.component.html",
  styleUrl: "./landing.component.scss",
})
export class LandingComponent implements AfterViewInit {
  private readonly elRef = inject(ElementRef<HTMLElement>);
  readonly theme = inject(ThemeService);
  readonly locale = inject(LocaleService);

  readonly langMenuOpen = signal(false);
  readonly mobileOpen = signal(false);
  readonly locales = LOCALES;
  readonly year = signal(new Date().getFullYear());

  // A gym week, purely illustrative — the mini planning grid in the first
  // feature card. `f` = full (waitlist), `on` = a class runs, "" = free slot.
  readonly week = [
    { time: "07h", cells: [{ n: "RPM", s: "on" }, { n: "", s: "" }, { n: "RPM", s: "on" }, { n: "", s: "" }, { n: "RPM", s: "on" }] },
    { time: "09h", cells: [{ n: "Pilates", s: "f" }, { n: "Yoga", s: "on" }, { n: "Pilates", s: "f" }, { n: "Yoga", s: "on" }, { n: "Pilates", s: "f" }] },
    { time: "18h", cells: [{ n: "Cross", s: "on" }, { n: "Cross", s: "on" }, { n: "", s: "" }, { n: "Cross", s: "on" }, { n: "Cross", s: "on" }] },
  ];

  // Illustrative testimonial quotes — clearly tagged as example content in
  // the section itself (landing.testimonials_tag) until replaced with real
  // customer quotes.
  readonly testimonials = [
    { quote: "landing.testimonials_quote_1", who: "landing.testimonials_who_1" },
    { quote: "landing.testimonials_quote_2", who: "landing.testimonials_who_2" },
    { quote: "landing.testimonials_quote_3", who: "landing.testimonials_who_3" },
  ];

  readonly benefits = [
    { icon: "bi-rocket-takeoff", textKey: "landing.stats_benefit_1" },
    { icon: "bi-cloud-arrow-up", textKey: "landing.stats_benefit_2" },
    { icon: "bi-headset", textKey: "landing.stats_benefit_3" },
    { icon: "bi-percent", textKey: "landing.stats_benefit_4" },
  ];

  // ---- "how much are late payments and lost renewals costing you" calculator ----
  readonly roiMembers = signal(180);
  readonly roiPrice = signal(90);
  readonly roiLatePct = signal(10);
  readonly roiChurnPct = signal(15);

  private readonly roiAnnualRevenue = computed(() => this.roiMembers() * this.roiPrice() * 12);

  readonly roiAtRisk = computed(() => {
    const late = Math.min(100, Math.max(0, this.roiLatePct()));
    const churn = Math.min(100, Math.max(0, this.roiChurnPct()));
    return this.roiAnnualRevenue() * ((late + churn) / 100);
  });

  // Recovery hypothesis: automated reminders + expiry alerts typically claw
  // back a majority, not all, of at-risk revenue.
  readonly roiRecoverable = computed(() => this.roiAtRisk() * 0.6);

  // ---- FAQ accordion — one open panel at a time ----
  readonly openFaq = signal<number | null>(1);

  toggleFaq(i: number): void {
    this.openFaq.set(this.openFaq() === i ? null : i);
  }

  setLocale(code: Locale): void {
    this.locale.setLocale(code);
    this.langMenuOpen.set(false);
  }

  // ---- cockpit 3D tilt on hover ----
  readonly cockpitTilt = signal("");

  onCockpitMove(ev: MouseEvent): void {
    const el = ev.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const px = (ev.clientX - r.left) / r.width - 0.5;
    const py = (ev.clientY - r.top) / r.height - 0.5;
    this.cockpitTilt.set(`rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 10).toFixed(2)}deg)`);
  }

  onCockpitLeave(): void {
    this.cockpitTilt.set("");
  }

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === "undefined") return;
    const root = this.elRef.nativeElement as HTMLElement;

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    root.querySelectorAll(".lp-reveal").forEach((node) => revealObserver.observe(node));
  }
}
