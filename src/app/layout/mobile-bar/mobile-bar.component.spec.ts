import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";
import { MobileBarComponent } from "./mobile-bar.component";

describe("MobileBarComponent", () => {
  let fixture: ComponentFixture<MobileBarComponent>;
  let component: MobileBarComponent;

  function build(granted: string[]): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [MobileBarComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { hasPermission: (key: string) => granted.includes(key), hasFeature: () => false } },
      ],
    });
    fixture = TestBed.createComponent(MobileBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it("offers the three things a desk does on a phone", () => {
    build(["reports", "clients", "payments"]);
    expect(component.items().map((i) => i.path)).toEqual([
      "/owner/dashboard",
      "/owner/clients",
      "/owner/payments",
    ]);
  });

  it("drops a destination the login may not reach", () => {
    build(["clients"]);
    expect(component.items().map((i) => i.path)).toEqual(["/owner/clients"]);
  });

  it("renders nothing at all rather than an empty bar", () => {
    build([]);
    expect(fixture.nativeElement.querySelector(".app-mobilebar")).toBeNull();
  });

  it("opens the payment form rather than the list", () => {
    build(["payments"]);
    expect(component.items()[0].query).toEqual({ action: "new" });
  });
});
