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
        { provide: AuthService, useValue: { currentUser: () => ({ role, staff_role: null }), hasPermission: () => true } },
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

  it("isOwner is true for an owner login", () => {
    build("owner", "company");
    expect(component.isOwner).toBe(true);
  });

  it("isOwner is false for a staff login", () => {
    build("staff", "activities");
    expect(component.isOwner).toBe(false);
  });

  it("redirects to the first known section when the URL section is unknown", () => {
    build("owner", "not-a-real-section");
    expect(router.navigate).toHaveBeenCalledWith(["/owner/settings", "company"], { replaceUrl: true });
  });

  it("sets the active section when the URL section is known", () => {
    build("owner", "branding");
    expect(component.activeSection()?.path).toBe("branding");
  });

  it("redirects to the first section when none is given", () => {
    build("owner", null);
    expect(router.navigate).toHaveBeenCalledWith(["/owner/settings", "company"], { replaceUrl: true });
  });

  it("goto navigates to the given section", () => {
    build("owner", "company");
    component.goto("branding");
    expect(router.navigate).toHaveBeenCalledWith(["/owner/settings", "branding"]);
  });

  it("goto does nothing for an empty path", () => {
    build("owner", "company");
    (router.navigate as jasmine.Spy).calls.reset();
    component.goto("");
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("navGroups always includes the appearance group, visible to any role", () => {
    build("staff", "appearance");
    expect(component.navGroups().some((g) => g.key === "appearance")).toBe(true);
  });
});
