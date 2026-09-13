import { TranslateService } from "@ngx-translate/core";
import { AppNotification } from "../../core/models/notification.model";

function formatDate(t: TranslateService, iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(t.currentLang || "fr", { day: "2-digit", month: "long", year: "numeric" });
}

/** The localized title + body for a notification, composed from `kind` + `data`. */
export function notificationText(t: TranslateService, n: AppNotification): { title: string; body: string } {
  const d = n.data;
  switch (n.kind) {
    case "contract_expiring":
      return {
        title: t.instant("notifications.contract_expiring.title"),
        body: t.instant("notifications.contract_expiring.body", {
          name: d["client_name"] ?? "—",
          type: d["contract_type"] ?? "—",
          date: formatDate(t, d["expires_at"]),
        }),
      };
    case "employee_birthday":
      return {
        title: t.instant("notifications.employee_birthday.title"),
        body: t.instant("notifications.employee_birthday.body", { name: d["name"] ?? "—" }),
      };
    case "system_update":
      return {
        title: t.instant("notifications.system_update.title", { version: d["version"] ?? "" }),
        body: d["title"] ?? "",
      };
  }
}

/** i18n key for the "open the related resource" button on the detail page. */
export function notificationCtaKey(n: AppNotification): string {
  return {
    contract_expiring: "notifications.open_contract",
    employee_birthday: "notifications.open_employee",
    system_update: "notifications.open_system_update",
  }[n.kind];
}
