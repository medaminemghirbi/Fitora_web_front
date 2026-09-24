// Mirror of the backend CurrencyCatalog (app/models/currency_catalog.rb).
// Kept as a static list so the MoneyPipe can resolve a symbol synchronously
// anywhere, without a round-trip. The superadmin currency picker uses the list the
// API sends (`currency_options`); this is the display fallback + the pipe map.
// `name` here is the French label (app default) — translated names live under
// the `currency.<CODE>` i18n keys.

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "TND", symbol: "DT", name: "Dinar tunisien" },
  { code: "MAD", symbol: "DH", name: "Dirham marocain" },
  { code: "DZD", symbol: "DA", name: "Dinar algérien" },
  { code: "EGP", symbol: "E£", name: "Livre égyptienne" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "Dollar américain" },
  { code: "GBP", symbol: "£", name: "Livre sterling" },
  { code: "CHF", symbol: "CHF", name: "Franc suisse" },
  { code: "CAD", symbol: "CA$", name: "Dollar canadien" },
  { code: "SAR", symbol: "SAR", name: "Riyal saoudien" },
  { code: "AED", symbol: "AED", name: "Dirham des Émirats" },
  { code: "QAR", symbol: "QAR", name: "Riyal qatari" },
  { code: "XOF", symbol: "FCFA", name: "Franc CFA (UEMOA)" },
];

const SYMBOLS: Record<string, string> = Object.fromEntries(CURRENCIES.map((c) => [c.code, c.symbol]));

export function currencySymbol(code: string | null | undefined): string {
  if (!code) return "";
  return SYMBOLS[code] ?? code;
}
