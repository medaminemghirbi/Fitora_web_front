import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AuthService } from "../auth/auth.service";
import { HasPermissionDirective } from "./access.directives";

@Component({
  standalone: true,
  imports: [HasPermissionDirective],
  template: `<div *appHasPermission="perm()" class="protected">secret</div>`,
})
class HostComponent {
  readonly perm = signal("payments");
}

describe("HasPermissionDirective", () => {
  let fixture: ComponentFixture<HostComponent>;
  let hasPermission: jasmine.Spy;

  beforeEach(() => {
    hasPermission = jasmine.createSpy().and.returnValue(false);

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: AuthService, useValue: { hasPermission } }],
    });

    fixture = TestBed.createComponent(HostComponent);
  });

  function rendered(): boolean {
    return !!fixture.nativeElement.querySelector(".protected");
  }

  it("hides the content when the login lacks the permission", () => {
    fixture.detectChanges();
    expect(rendered()).toBe(false);
  });

  it("shows the content when the login has the permission", () => {
    hasPermission.and.returnValue(true);
    fixture.detectChanges();
    expect(rendered()).toBe(true);
    expect(hasPermission).toHaveBeenCalledWith("payments");
  });

  it("re-evaluates when the bound permission key changes", () => {
    fixture.detectChanges();
    expect(rendered()).toBe(false);

    hasPermission.and.callFake((key: string) => key === "clients");
    fixture.componentInstance.perm.set("clients");
    fixture.detectChanges();

    expect(rendered()).toBe(true);
  });

  it("hides content that was previously shown once the permission is revoked", () => {
    hasPermission.and.returnValue(true);
    fixture.detectChanges();
    expect(rendered()).toBe(true);

    hasPermission.and.returnValue(false);
    fixture.componentInstance.perm.set("payments2");
    fixture.detectChanges();

    expect(rendered()).toBe(false);
  });

  it("re-showing an already-visible view is a no-op (doesn't re-create the embedded view)", () => {
    hasPermission.and.returnValue(true);
    fixture.detectChanges();
    const first = fixture.nativeElement.querySelector(".protected");

    fixture.componentInstance.perm.set("payments"); // same key, still permitted
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector(".protected")).toBe(first);
  });
});
