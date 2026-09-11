import { bootstrapApplication } from '@angular/platform-browser';
import * as Sentry from '@sentry/angular';
import { Chart, registerables } from 'chart.js';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

Chart.register(...registerables);

// No-ops with no DSN (see environment.prod.ts) — nothing is ever sent from
// a local dev build. Errors only, no performance/APM tracing (no
// tracesSampleRate) — that's a separate, quota-costing decision to make later.
if (environment.sentryDsn) {
  Sentry.init({ dsn: environment.sentryDsn, environment: environment.production ? 'production' : 'development' });
}

// The landing header's section links (routerLink="/" + fragment) leave a
// `#features` / `#metiers` / `#pricing` hash in the URL. With router
// anchorScrolling enabled, a later full-page load (reload, reopened tab)
// would jump straight to that section. Strip a bare in-page anchor on the
// initial load so the app always opens at the top; in-app clicks still
// re-add the fragment and scroll at that moment. `=`/`&`/`/` hashes
// (tokens, hash-routes) are left untouched.
{
  const h = window.location.hash;
  if (h.length > 1 && !/[=&/]/.test(h)) {
    history.replaceState(history.state, '', window.location.pathname + window.location.search);
  }
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
