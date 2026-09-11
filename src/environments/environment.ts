// Development environment. Swapped for environment.prod.ts on a production
// build via `fileReplacements` in angular.json.
export const environment = {
  production: false,
  // Origin of the Rails API (scheme + host + port), no trailing slash.
  // Empty string means "same origin as the web app".
  apiOrigin: "http://localhost:3000",
  // Blank in dev on purpose — Sentry.init() no-ops with no DSN, so nothing
  // is ever sent from a local machine. See environment.prod.ts.
  sentryDsn: "",
};
