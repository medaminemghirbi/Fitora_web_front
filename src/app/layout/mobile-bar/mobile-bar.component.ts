import { Component, computed, inject } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";

/**
 * The phone's bottom bar: the three things a desk does on a phone, one tap
 * each. Everything else is still reachable from the burger menu — a small
 * screen is a reason to put the daily work first, not to hide the rest.
 *
 * Hidden above 768px, where the top bar already carries the full navigation.
 */
@Component({
  selector: "app-mobile-bar",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  template: `
    @if (items().length > 0) {
      <nav class="app-mobilebar" [attr.aria-label]="'nav.primary' | translate">
        @for (item of items(); track item.path) {
          <a
            [routerLink]="item.path"
            [queryParams]="item.query"
            routerLinkActive="is-active"
            class="app-mobilebar-item"
          >
            <i class="bi" [class]="item.icon"></i>
            <span>{{ item.labelKey | translate }}</span>
          </a>
        }
      </nav>
    }
  `,
  styleUrl: "./mobile-bar.component.scss",
})
export class MobileBarComponent {
  private readonly auth = inject(AuthService);

  readonly items = computed(() =>
    [
      { path: "/admin/dashboard", query: {}, icon: "bi-sun", labelKey: "nav.today", permission: "reports" },
      { path: "/admin/clients", query: {}, icon: "bi-people", labelKey: "nav.clients", permission: "clients" },
      { path: "/admin/payments", query: { action: "new" }, icon: "bi-cash-coin", labelKey: "payments.collect", permission: "payments" },
    ].filter((item) => this.auth.hasPermission(item.permission))
  );
}
