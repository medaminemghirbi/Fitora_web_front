import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AuthService } from "../../core/auth/auth.service";
import { GymsService } from "../../core/services/gyms.service";
import { MemberShellComponent } from "./member-shell.component";

describe("MemberShellComponent", () => {
  let fixture: ComponentFixture<MemberShellComponent>;
  let component: MemberShellComponent;
  let gymsStub: jasmine.SpyObj<GymsService>;

  async function build(): Promise<void> {
    TestBed.resetTestingModule();
    gymsStub = jasmine.createSpyObj<GymsService>("GymsService", ["loadMine"], { mine: (() => []) as never });
    gymsStub.loadMine.and.returnValue(of({ gyms: [] }));

    await TestBed.configureTestingModule({
      imports: [MemberShellComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentClient: () => ({ full_name: "Jane Member", email: "jane@x.test" }), logout: jasmine.createSpy() } },
        { provide: GymsService, useValue: gymsStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MemberShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => build());

  it("loads the person's gyms on construction, not one gym's branding", () => {
    expect(gymsStub.loadMine).toHaveBeenCalled();
  });

  it("still renders when the gyms cannot be loaded", async () => {
    TestBed.resetTestingModule();
    gymsStub = jasmine.createSpyObj<GymsService>("GymsService", ["loadMine"], { mine: (() => []) as never });
    gymsStub.loadMine.and.returnValue(throwError(() => new Error("offline")));

    await TestBed.configureTestingModule({
      imports: [MemberShellComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentClient: () => null, logout: jasmine.createSpy() } },
        { provide: GymsService, useValue: gymsStub },
      ],
    }).compileComponents();

    expect(() => {
      const f = TestBed.createComponent(MemberShellComponent);
      f.detectChanges();
    }).not.toThrow();
  });

  it("carries the gyms directory in the nav", () => {
    expect(component.navItems.map((i) => i.path)).toEqual([
      "/member/home",
      "/member/explore",
      "/member/gyms",
      "/member/bookings",
      "/member/progress",
      "/member/profile",
    ]);
  });

  it("starts with the user menu closed", () => {
    expect(component.userMenuOpen()).toBe(false);
  });

  it("logout delegates to AuthService", () => {
    const auth = TestBed.inject(AuthService);
    component.logout();
    expect(auth.logout).toHaveBeenCalled();
  });
});
