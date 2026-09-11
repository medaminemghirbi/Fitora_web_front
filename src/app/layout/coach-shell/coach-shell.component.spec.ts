import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";
import { BrandingService } from "../../core/services/branding.service";
import { CoachShellComponent } from "./coach-shell.component";

describe("CoachShellComponent", () => {
  let fixture: ComponentFixture<CoachShellComponent>;
  let component: CoachShellComponent;
  let brandingStub: jasmine.SpyObj<BrandingService>;

  beforeEach(async () => {
    brandingStub = jasmine.createSpyObj<BrandingService>("BrandingService", ["load", "logoUrl"]);

    await TestBed.configureTestingModule({
      imports: [CoachShellComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser: () => ({ full_name: "Coach C", email: "c@x.test" }), logout: jasmine.createSpy() } },
        { provide: BrandingService, useValue: brandingStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CoachShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("loads branding on construction", () => {
    expect(brandingStub.load).toHaveBeenCalled();
  });

  it("starts with the sidebar closed", () => {
    expect(component.sidebarOpen()).toBe(false);
  });

  it("toggleSidebar flips the state", () => {
    component.toggleSidebar();
    expect(component.sidebarOpen()).toBe(true);
    component.toggleSidebar();
    expect(component.sidebarOpen()).toBe(false);
  });

  it("closeSidebar always closes it", () => {
    component.toggleSidebar();
    component.closeSidebar();
    expect(component.sidebarOpen()).toBe(false);
  });

  it("Escape closes the sidebar", () => {
    component.toggleSidebar();
    component.onEsc();
    expect(component.sidebarOpen()).toBe(false);
  });

  it("logout delegates to AuthService", () => {
    const auth = TestBed.inject(AuthService);
    component.logout();
    expect(auth.logout).toHaveBeenCalled();
  });
});
