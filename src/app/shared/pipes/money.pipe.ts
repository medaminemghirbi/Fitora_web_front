import { Pipe, PipeTransform } from "@angular/core";
import { currencySymbol } from "../../core/models/currency";

// Angular's built-in currency pipe has no symbol for TND (and other
// lesser-known ISO codes) and glues the code to the number with no space.
// This pipe formats "amount SYMBOL" directly (e.g. "120 DT", "40 €") using
// the shared currency catalog — unambiguous and locale-independent. Pass the
// ISO code; an unknown code falls back to showing the code itself.
@Pipe({ name: "money", standalone: true })
export class MoneyPipe implements PipeTransform {
  transform(value: number | string | null | undefined, currency: string): string {
    if (value === null || value === undefined) return "—";
    const amount = typeof value === "string" ? parseFloat(value) : value;
    const formatted = Number.isFinite(amount) ? amount.toFixed(2).replace(/\.00$/, "") : value;
    return `${formatted} ${currencySymbol(currency)}`;
  }
}
