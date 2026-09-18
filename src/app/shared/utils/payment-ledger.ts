import { Invoice } from "../../core/models/subscription.model";

/** One month of a year, and the invoice covering it if there is one. */
export interface LedgerCell {
  label: string;
  state: "paid" | "missed" | "current" | "future";
  invoice: Invoice | null;
}

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

/**
 * The years a gym's ledger can show: every year its invoices touch, plus the
 * one we are in so a gym with no history still has a grid to look at.
 *
 * Derived rather than fixed because a gym that has been a client for four
 * years has invoices in years a fixed window cannot reach — they exist, and
 * nothing would open them.
 */
export function ledgerYears(invoices: Invoice[], today = new Date()): number[] {
  const years = new Set<number>([today.getFullYear()]);

  for (const invoice of invoices) {
    // A yearly invoice straddles two calendar years; both become reachable.
    const from = new Date(invoice.period_start).getUTCFullYear();
    const to = new Date(invoice.period_end).getUTCFullYear();
    for (let year = from; year <= to; year++) years.add(year);
  }

  return [...years].sort((a, b) => a - b);
}

/**
 * One year as twelve cells. A month is paid when an invoice's period covers
 * its first day — so a single yearly invoice paints all twelve, and a month
 * nobody paid for stays a hole rather than being filled in by arithmetic.
 */
export function ledgerFor(year: number, invoices: Invoice[], today = new Date()): LedgerCell[] {
  return MONTHS.map((label, month) => {
    const first = new Date(Date.UTC(year, month, 1));
    const covering = invoices.find(
      (i) => new Date(i.period_start) <= first && new Date(i.period_end) >= first
    );
    if (covering) return { label, state: "paid", invoice: covering };

    const isFuture = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());
    if (isFuture) return { label, state: "future", invoice: null };

    const isCurrent = year === today.getFullYear() && month === today.getMonth();
    return { label, state: isCurrent ? "current" : "missed", invoice: null };
  });
}
