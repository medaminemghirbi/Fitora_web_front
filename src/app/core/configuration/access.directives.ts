import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from "@angular/core";
import { AuthService } from "../auth/auth.service";

// *hasPermission="'clients'" — renders its content only when the current
// login holds that capability (owners come back from /bootstrap with the
// full set). Reactive: appears/disappears when configuration lands.
//
//   <a *hasPermission="'payments'" routerLink="/owner/payments">…</a>
@Directive({ selector: "[hasPermission]", standalone: true })
export class HasPermissionDirective {
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);
  private key = "";

  @Input({ required: true }) set hasPermission(value: string) {
    this.key = value;
    this.update();
  }

  constructor() {
    effect(() => this.update());
  }

  private update(): void {
    const show = !!this.key && this.auth.hasPermission(this.key);
    if (show && this.vcr.length === 0) this.vcr.createEmbeddedView(this.tpl);
    else if (!show && this.vcr.length > 0) this.vcr.clear();
  }
}
