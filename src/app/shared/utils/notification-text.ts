import { TranslateService } from "@ngx-translate/core";
import { AppNotification, NotificationKind } from "../../core/models/notification.model";

function formatDate(t: TranslateService, iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(t.currentLang || "fr", { day: "2-digit", month: "long", year: "numeric" });
}

type Composer = (t: TranslateService, data: AppNotification["data"]) => { title: string; body: string };

/**
 * One composer per kind, as a total map rather than a switch.
 *
 * A switch without a default returned `undefined` for a kind nobody had
 * taught it about, and the page read `.title` off it — a blank screen and a
 * console full of TypeErrors, for a notification the backend was perfectly
 * happy to send. A Record over the union makes the next missing kind a
 * compile error instead.
 */
const COMPOSERS: Record<NotificationKind, Composer> = {
  contract_expiring: (t, d) => ({
    title: t.instant("notifications.contract_expiring.title"),
    body: t.instant("notifications.contract_expiring.body", {
      name: d["client_name"] ?? "—",
      type: d["contract_type"] ?? "—",
      date: formatDate(t, d["expires_at"]),
    }),
  }),
  employee_birthday: (t, d) => ({
    title: t.instant("notifications.employee_birthday.title"),
    body: t.instant("notifications.employee_birthday.body", { name: d["name"] ?? "—" }),
  }),
  system_update: (t, d) => ({
    title: t.instant("notifications.system_update.title", { version: d["version"] ?? "" }),
    body: d["title"] ?? "",
  }),
  invoice_issued: (t, d) => ({
    title: t.instant("notifications.invoice_issued.title", { number: d["number"] ?? "—" }),
    body: t.instant("notifications.invoice_issued.body", {
      amount: d["amount"] ?? "—",
      currency: d["currency"] ?? "",
    }),
  }),
};

const CTA_KEYS: Record<NotificationKind, string> = {
  contract_expiring: "notifications.open_contract",
  employee_birthday: "notifications.open_employee",
  system_update: "notifications.open_system_update",
  invoice_issued: "notifications.open_invoice",
};

/** The localized title + body for a notification, composed from `kind` + `data`. */
export function notificationText(t: TranslateService, n: AppNotification): { title: string; body: string } {
  // A kind this build does not know about still has to render something: an
  // older tab can outlive a deploy that added one.
  const composer = COMPOSERS[n.kind];
  if (!composer) return { title: t.instant("notifications.title"), body: "" };

  return composer(t, n.data);
}

/** i18n key for the "open the related resource" button on the detail page. */
export function notificationCtaKey(n: AppNotification): string {
  return CTA_KEYS[n.kind] ?? "notifications.open_generic";
}
