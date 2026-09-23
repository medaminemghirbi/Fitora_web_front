/**
 * Whether a typed phone number looks like one. Mirrors SupportTicket's
 * PHONE_FORMAT + PHONE_DIGITS on the backend: digits with the usual
 * separators, an optional leading "+" or "(+", and 8 to 15 digits in all —
 * "+216 22 123 456" and "22123456" both pass.
 */
export function isValidPhone(value: string | null | undefined): boolean {
  const phone = (value ?? "").trim();
  if (!/^\(?\+?[\d\s().-]+$/.test(phone)) return false;

  const digits = phone.replace(/\D/g, "").length;
  return digits >= 8 && digits <= 15;
}
