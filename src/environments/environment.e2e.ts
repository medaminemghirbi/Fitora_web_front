// The Playwright smoke suite (e2e/). Its Rails server runs on 3100 against
// its own database, so it never collides with — or writes into — the one on
// 3000 you develop against. See playwright.config.ts.
export const environment = {
  production: false,
  apiOrigin: "http://localhost:3100",
  sentryDsn: "",
};
