import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { PublicHomeComponent } from "./public-home.component";

describe("PublicHomeComponent", () => {
  let fixture: ComponentFixture<PublicHomeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PublicHomeComponent, TranslateModule.forRoot()],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(PublicHomeComponent);
    fixture.detectChanges();
  });

  it("offers both doors, each leading into its own half of the app", () => {
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.ph-door--gym a[href="/pro/devis"]')).toBeTruthy();
    expect(el.querySelector('.ph-door--gym a[href="/pro/demo"]')).toBeTruthy();
    expect(el.querySelector('.ph-door--member a[href="/inscription"]')).toBeTruthy();
    expect(el.querySelector('.ph-door--member a[href="/gyms"]')).toBeTruthy();
  });

  it("gives each audience a way in that asks for nothing yet", () => {
    const el: HTMLElement = fixture.nativeElement;

    // A gym can look at a demo before asking for a price; a person can browse
    // the directory before creating an account.
    expect(el.querySelectorAll(".ph-door .ph-btn--ghost").length).toBe(2);
  });

  it("lists three proofs and three steps for each audience", () => {
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelectorAll(".ph-door--gym li").length).toBe(3);
    expect(el.querySelectorAll(".ph-door--member li").length).toBe(3);
    expect(el.querySelectorAll(".ph-steps ol li").length).toBe(6);
  });
});
