import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router, convertToParamMap } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { ReplaySubject } from "rxjs";
import { AuthService } from "../../../core/auth/auth.service";
import { SettingsShellComponent } from "./settings-shell.component";

describe("SettingsShellComponent", () => {
  let fixture: ComponentFixture<SettingsShellComponent>;
  let component: SettingsShellComponent;
  let router: Router;
  let paramMap$: ReplaySubject<ReturnType<typeof convertToParamMap>>;

  function build(role: string, section: string | null) {
    TestBed.resetTestingModule();
    paramMap$ = new ReplaySubject(1);
    paramMap$.next(convertToParamMap(section ? { section } : {}));

    TestBed.configureTestingModule({
      imports: [SettingsShellComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser: () => ({ role, staff_role: null }),
 is_coach: false, hasPermission: () => true } },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMap$, snapshot: { queryParamMap: convertToParamMap({}), paramMap: convertToParamMap({}) } },
        },
      ],
    });

    // Installed before createComponent(): the shell's redirect (for an
    // unknown/missing section) fires from its constructor, synchronously,
    // before fixture.detectChanges() would otherwise run.
    router = TestBed.inject(Router);
    spyOn(router, "navigate");
    fixture = TestBed.createComponent(SettingsShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it("isAdmin is true for an admin login", () => {
    build("admin", "company");
    expect(component.isAdmin).toBe(true);
  });

  it("isAdmin is false for a staff login", () => {
    build("staff", "activities");
    expect(component.isAdmin).toBe(false);
  });

  it("redirects to the first known section when the URL section is unknown", () => {
    build("admin", "not-a-real-section");
    expect(router.navigate).toHaveBeenCalledWith(["/admin/settings", "company"], { replaceUrl: true });
  });

  it("sets the active section when the URL section is known", () => {
    build("admin", "branding");
    expect(component.activeSection()?.path).toBe("branding");
  });

  it("redirects to the first section when none is given", () => {
    build("admin", null);
    expect(router.navigate).toHaveBeenCalledWith(["/admin/settings", "company"], { replaceUrl: true });
  });

  it("goto navigates to the given section", () => {
    build("admin", "company");
    component.goto("branding");
    expect(router.navigate).toHaveBeenCalledWith(["/admin/settings", "branding"]);
  });

  it("goto does nothing for an empty path", () => {
    build("admin", "company");
    (router.navigate as jasmine.Spy).calls.reset();
    component.goto("");
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("puts every section on the tab row, active one marked for a screen reader too", () => {
    build("admin", "company");

    const tabs = [...fixture.nativeElement.querySelectorAll(".settings-tab")] as HTMLElement[];
    const sections = component.flatSections();

    // Every section, plus the one link that leaves the settings area.
    expect(tabs.length).toBe(sections.length + 1);
    expect(fixture.nativeElement.querySelectorAll('.settings-tab[aria-current="page"]').length).toBe(1);
  });

  it("offers the same sections as a picker where the row will not fit", () => {
    build("admin", "company");

    const options = [...fixture.nativeElement.querySelectorAll(".settings-picker option")] as HTMLOptionElement[];

    expect(options.map((o) => o.value)).toEqual(component.flatSections().map((s) => s.path));
  });

  it("navGroups always includes the appearance group, visible to any role", () => {
    build("staff", "appearance");
    expect(component.navGroups().some((g) => g.key === "appearance")).toBe(true);
  });
});
