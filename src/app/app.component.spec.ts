import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "./core/auth/auth.service";
import { AppComponent } from "./app.component";

describe("AppComponent", () => {
  let authStub: { isAuthenticated: jasmine.Spy; loadConfiguration: jasmine.Spy };

  function build(authenticated: boolean): void {
    TestBed.resetTestingModule();
    authStub = {
      isAuthenticated: jasmine.createSpy().and.returnValue(authenticated),
      loadConfiguration: jasmine.createSpy(),
    };

    TestBed.configureTestingModule({
      imports: [AppComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authStub },
      ],
    });
  }

  it("should create the app", () => {
    build(false);
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("refreshes configuration on construction for an already-authenticated session (hard reload)", () => {
    build(true);
    TestBed.createComponent(AppComponent);
    expect(authStub.loadConfiguration).toHaveBeenCalled();
  });

  it("does not load configuration for a signed-out visitor", () => {
    build(false);
    TestBed.createComponent(AppComponent);
    expect(authStub.loadConfiguration).not.toHaveBeenCalled();
  });
});
