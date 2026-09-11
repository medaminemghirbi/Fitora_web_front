import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";
import { TrialExpiredComponent } from "./trial-expired.component";

describe("TrialExpiredComponent", () => {
  let fixture: ComponentFixture<TrialExpiredComponent>;
  let component: TrialExpiredComponent;
  let authStub: { logout: jasmine.Spy; currentUser: jasmine.Spy };

  beforeEach(async () => {
    authStub = { logout: jasmine.createSpy(), currentUser: jasmine.createSpy().and.returnValue({ email: "s@x.test" }) };

    await TestBed.configureTestingModule({
      imports: [TrialExpiredComponent, TranslateModule.forRoot()],
      providers: [{ provide: AuthService, useValue: authStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(TrialExpiredComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("logout delegates to AuthService", () => {
    component.logout();
    expect(authStub.logout).toHaveBeenCalled();
  });
});
