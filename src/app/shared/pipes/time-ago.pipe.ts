import { Pipe, PipeTransform, inject } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";

// Localized "il y a 3 min" / "2 h" / "5 j" — falls back to a plain date past
// a week. Impure so it refreshes as time passes (lists are short).
@Pipe({ name: "timeAgo", standalone: true, pure: false })
export class TimeAgoPipe implements PipeTransform {
  private readonly translate = inject(TranslateService);

  transform(value: string | Date | null | undefined): string {
    if (!value) return "";
    const then = new Date(value).getTime();
    if (Number.isNaN(then)) return "";

    const secs = Math.round((Date.now() - then) / 1000);
    const t = (key: string, n?: number) => this.translate.instant(key, n === undefined ? undefined : { n });

    if (secs < 45) return t("time.now");
    if (secs < 3600) return t("time.minutes", Math.max(1, Math.round(secs / 60)));
    if (secs < 86400) return t("time.hours", Math.round(secs / 3600));
    if (secs < 7 * 86400) return t("time.days", Math.round(secs / 86400));

    return new Date(value).toLocaleDateString(this.translate.currentLang || "fr", { day: "2-digit", month: "short" });
  }
}
