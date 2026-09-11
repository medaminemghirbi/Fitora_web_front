import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { ComingSoonComponent } from "./coming-soon.component";

describe("ComingSoonComponent", () => {
  function build(data: Record<string, unknown>): ComponentFixture<ComingSoonComponent> {
    TestBed.configureTestingModule({
      imports: [ComingSoonComponent, TranslateModule.forRoot()],
      providers: [{ provide: ActivatedRoute, useValue: { snapshot: { data } } }],
    });
    const fixture = TestBed.createComponent(ComingSoonComponent);
    fixture.detectChanges();
    return fixture;
  }

  it("uses the route's titleKey when provided", () => {
    const fixture = build({ titleKey: "hr.title" });
    expect(fixture.componentInstance.titleKey).toBe("hr.title");
  });

  it("falls back to the generic coming_soon.title when no titleKey is set", () => {
    const fixture = build({});
    expect(fixture.componentInstance.titleKey).toBe("coming_soon.title");
  });
});
