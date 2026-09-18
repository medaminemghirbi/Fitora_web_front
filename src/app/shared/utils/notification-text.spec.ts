import { TranslateService } from "@ngx-translate/core";
import { AppNotification } from "../../core/models/notification.model";
import { notificationCtaKey, notificationText } from "./notification-text";

describe("notification-text utils", () => {
  let translate: jasmine.SpyObj<TranslateService>;

  beforeEach(() => {
    translate = jasmine.createSpyObj<TranslateService>("TranslateService", ["instant"], { currentLang: "fr" });
    translate.instant.and.callFake((key: string, params?: object) => (params ? `${key}:${JSON.stringify(params)}` : key));
  });

  function notif(kind: AppNotification["kind"], data: Record<string, string | null>): AppNotification {
    return { id: "n1", kind, data, url: "/x", subject: null, read: false, created_at: new Date().toISOString() };
  }

  describe("notificationText", () => {
    it("composes a contract_expiring notification", () => {
      const n = notif("contract_expiring", { client_name: "Rami", contract_type: "Mensuel", expires_at: "2026-09-20" });
      const { title, body } = notificationText(translate, n);
      expect(title).toBe("notifications.contract_expiring.title");
      expect(body).toContain("notifications.contract_expiring.body");
      expect(body).toContain("Rami");
      expect(body).toContain("Mensuel");
    });

    it("composes an employee_birthday notification", () => {
      const n = notif("employee_birthday", { name: "Sarah" });
      const { title, body } = notificationText(translate, n);
      expect(title).toBe("notifications.employee_birthday.title");
      expect(body).toContain("Sarah");
    });

    it("composes a system_update notification straight from data", () => {
      const n = notif("system_update", { version: "1.2", title: "Nouvelle fonctionnalité" });
      const { title, body } = notificationText(translate, n);
      expect(title).toContain("1.2");
      expect(body).toBe("Nouvelle fonctionnalité");
    });

    it("composes an invoice_issued notification", () => {
      const n = notif("invoice_issued", { number: "FIT-2026-0007", amount: "99.00", currency: "TND" });
      const { title, body } = notificationText(translate, n);
      expect(title).toContain("FIT-2026-0007");
      expect(body).toContain("99.00");
      expect(body).toContain("TND");
    });

    // An open tab can outlive the deploy that taught the backend a new kind.
    // It has to render something rather than hand the template an undefined.
    it("renders a generic notification for a kind this build never heard of", () => {
      const n = notif("payment_received" as AppNotification["kind"], {});
      const { title, body } = notificationText(translate, n);
      expect(title).toBe("notifications.title");
      expect(body).toBe("");
    });

    it("falls back to an em dash for missing fields", () => {
      const n = notif("employee_birthday", { name: null });
      const { body } = notificationText(translate, n);
      expect(body).toContain("—");
    });

    it("formatDate falls back to 'fr' when the translate service has no currentLang", () => {
      const noLang = jasmine.createSpyObj<TranslateService>("TranslateService", ["instant"], { currentLang: "" });
      noLang.instant.and.callFake((key: string, params?: object) => (params ? `${key}:${JSON.stringify(params)}` : key));
      const n = notif("contract_expiring", { client_name: "Rami", contract_type: "Mensuel", expires_at: "2026-09-20" });
      const { body } = notificationText(noLang, n);
      expect(body).toBeTruthy();
    });
  });

  describe("notificationCtaKey", () => {
    it("maps each kind to its CTA key", () => {
      expect(notificationCtaKey(notif("contract_expiring", {}))).toBe("notifications.open_contract");
      expect(notificationCtaKey(notif("employee_birthday", {}))).toBe("notifications.open_employee");
      expect(notificationCtaKey(notif("system_update", {}))).toBe("notifications.open_system_update");
      expect(notificationCtaKey(notif("invoice_issued", {}))).toBe("notifications.open_invoice");
    });

    it("gives an unknown kind a generic button rather than a raw key", () => {
      expect(notificationCtaKey(notif("payment_received" as AppNotification["kind"], {}))).toBe("notifications.open_generic");
    });
  });
});
