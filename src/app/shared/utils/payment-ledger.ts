import { Invoice } from "../../core/models/subscription.model";

/**
 * One month of a year, and the invoice covering it if there is one. `trial`
 * is the free period — covered, but nothing was paid for it. `before` is a
 * month the gym did not exist yet: nothing was owed, so it is not a hole.
 */
export interface LedgerCell {
  label: string;
  state: "paid" | "trial" | "missed" | "current" | "future" | "before";
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
 *
 * `since` is the gym's first day. The month it falls in is read from that
 * day instead of the 1st, so a gym that signed up on the 23rd shows its
 * first days as covered; every month before it is `before`, never missed.
 */
export function ledgerFor(year: number, invoices: Invoice[], today = new Date(), since: Date | null = null): LedgerCell[] {
  const start = since ? Date.UTC(since.getUTCFullYear(), since.getUTCMonth(), since.getUTCDate()) : null;

  return MONTHS.map((label, month) => {
    const first = Date.UTC(year, month, 1);
    const next = Date.UTC(year, month + 1, 1);
    if (start !== null && next <= start) return { label, state: "before", invoice: null };

    const day = start !== null && start > first ? start : first;
    const covering = invoices.find(
      (i) => new Date(i.period_start).getTime() <= day && new Date(i.period_end).getTime() >= day
    );
    if (covering) return { label, state: covering.trial ? "trial" : "paid", invoice: covering };

    const isFuture = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());
    if (isFuture) return { label, state: "future", invoice: null };

    const isCurrent = year === today.getFullYear() && month === today.getMonth();
    return { label, state: isCurrent ? "current" : "missed", invoice: null };
  });
}
