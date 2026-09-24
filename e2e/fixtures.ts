import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Page, expect } from "@playwright/test";
import fr from "../src/assets/i18n/fr.json";

/** What backend/lib/tasks/e2e.rake seeded, read once the servers are up. */
export interface Seeded {
  admin: { email: string; password: string };
  member: { email: string; invitation_token: string; name: string };
  gym: { name: string; activity: string; plan: string };
}

export function seeded(): Seeded {
  return JSON.parse(readFileSync(join(__dirname, "../../backend/tmp/e2e.json"), "utf8")) as Seeded;
}

/** The French copy the gym sees — the seeded gym's locale. */
export function t(key: string, params: Record<string, string | number> = {}): string {
  const value = key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], fr);
  if (typeof value !== "string") throw new Error(`No French copy for ${key}`);
  return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => String(params[name] ?? ""));
}

export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/connexion");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: t("auth.sign_in") }).click();
  await expect(page).not.toHaveURL(/\/connexion/);
}
