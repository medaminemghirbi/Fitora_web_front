// ISO 3166-1 alpha-2 codes. Country names are resolved at runtime with
// Intl.DisplayNames (French, the app default) and flags are built from the
// two regional-indicator code points — no name table or image assets to
// maintain. `company.country` stores the alpha-2 code (e.g. "TN").

export interface Country {
  code: string;
  name: string;
  flag: string;
}

// prettier-ignore
const CODES = [
  "AD","AE","AF","AG","AI","AL","AM","AO","AR","AT","AU","AW","AZ",
  "BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS","BT","BW","BY","BZ",
  "CA","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CR","CU","CV","CW","CY","CZ",
  "DE","DJ","DK","DM","DO","DZ",
  "EC","EE","EG","EH","ER","ES","ET",
  "FI","FJ","FK","FM","FO","FR",
  "GA","GB","GD","GE","GF","GG","GH","GI","GL","GM","GN","GP","GQ","GR","GT","GU","GW","GY",
  "HK","HN","HR","HT","HU",
  "ID","IE","IL","IM","IN","IQ","IR","IS","IT",
  "JE","JM","JO","JP",
  "KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ",
  "LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY",
  "MA","MC","MD","ME","MF","MG","MH","MK","ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ",
  "NA","NC","NE","NG","NI","NL","NO","NP","NR","NU","NZ",
  "OM",
  "PA","PE","PF","PG","PH","PK","PL","PM","PR","PS","PT","PW","PY",
  "QA",
  "RE","RO","RS","RU","RW",
  "SA","SB","SC","SD","SE","SG","SH","SI","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ",
  "TC","TD","TG","TH","TJ","TL","TM","TN","TO","TR","TT","TV","TW","TZ",
  "UA","UG","US","UY","UZ",
  "VA","VC","VE","VG","VI","VN","VU",
  "WF","WS",
  "YE","YT",
  "ZA","ZM","ZW",
];

function flag(code: string): string {
  // istanbul ignore if -- every CODES entry below is a real, valid alpha-2 code
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(["fr"], { type: "region", fallback: "code" });
  } catch {
    // istanbul ignore next -- Intl.DisplayNames is supported by every browser this app targets
    return null;
  }
})();

// istanbul ignore next -- real browsers support Intl.DisplayNames and, with fallback:"code", .of() never returns undefined for a valid alpha-2 code
function countryName(code: string): string {
  return regionNames?.of(code) ?? code;
}

export const COUNTRIES: Country[] = CODES.map((code) => ({
  code,
  name: countryName(code),
  flag: flag(code),
})).sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));
const BY_NAME = new Map(COUNTRIES.map((c) => [c.name.toLowerCase(), c]));

// Accepts an alpha-2 code, a French name, or a legacy English name and
// returns the canonical alpha-2 code ("" when nothing matches).
export function toCountryCode(value: string | null | undefined): string {
  if (!value) return "";
  const v = value.trim();
  if (BY_CODE.has(v.toUpperCase())) return v.toUpperCase();
  if (BY_NAME.has(v.toLowerCase())) return BY_NAME.get(v.toLowerCase())!.code;
  try {
    const en = new Intl.DisplayNames(["en"], { type: "region", fallback: "code" });
    const hit = COUNTRIES.find((c) => en.of(c.code)?.toLowerCase() === v.toLowerCase());
    if (hit) return hit.code;
  } catch {
    /* Intl.DisplayNames unavailable — fall through */
  }
  return "";
}

export function countryLabel(code: string | null | undefined): string {
  if (!code) return "";
  const c = BY_CODE.get(code.toUpperCase());
  return c ? `${c.flag} ${c.name}` : code;
}
