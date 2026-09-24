import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { CatalogueComponent } from "./catalogue.component";

describe("CatalogueComponent", () => {
  let fixture: ComponentFixture<CatalogueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogueComponent, TranslateModule.forRoot()],
      // Both halves fetch their own data; the shell only places them.
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogueComponent);
    fixture.detectChanges();
  });

  it("puts plans and activities on the same screen", () => {
    expect(fixture.nativeElement.querySelector("app-plans")).toBeTruthy();
    expect(fixture.nativeElement.querySelector("app-activities")).toBeTruthy();
  });

  it("gives each half one heading, not two", () => {
    // Embedded, so neither half draws its own page header — the shell's
    // section labels are the only headings.
    expect(fixture.nativeElement.querySelectorAll("app-page-header").length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll(".cat-label").length).toBe(2);
  });
});
