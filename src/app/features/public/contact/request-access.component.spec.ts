import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, convertToParamMap, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { HttpErrorResponse } from "@angular/common/http";
import { of, throwError } from "rxjs";
import { LeadsService } from "../../../core/services/leads.service";
import { RequestAccessComponent } from "./request-access.component";

describe("RequestAccessComponent", () => {
  let fixture: ComponentFixture<RequestAccessComponent>;
  let component: RequestAccessComponent;
  let leads: jasmine.SpyObj<LeadsService>;

  function build(routeData: Record<string, string> = {}, queryParams: Record<string, string> = {}): void {
    TestBed.resetTestingModule();
    leads = jasmine.createSpyObj<LeadsService>("LeadsService", ["submit"]);

    TestBed.configureTestingModule({
      imports: [RequestAccessComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: LeadsService, useValue: leads },
        { provide: ActivatedRoute, useValue: { snapshot: { data: routeData, queryParamMap: convertToParamMap(queryParams) } } },
      ],
    });

    fixture = TestBed.createComponent(RequestAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function fill(): void {
    component.form.setValue({
      contact_name: "Amine Mghirbi", gym_name: "Power Gym", email: "a@example.com",
      phone: "+216 20 111222", city: "Tunis", message: "On veut voir l'app.",
    });
  }

  it("asks for a demo by default", () => {
    build();
    expect(component.kind()).toBe("demo");
  });

  it("asks for a quote when the route says so", () => {
    build({ kind: "quote" });
    expect(component.kind()).toBe("quote");
  });

  it("honours ?kind=quote for a link shared from elsewhere", () => {
    build({}, { kind: "quote" });
    expect(component.kind()).toBe("quote");
  });

  it("sends nothing until the required fields are filled", () => {
    build();
    component.submit();
    expect(leads.submit).not.toHaveBeenCalled();
    expect(component.form.touched).toBe(true);
  });

  it("submits the request with the chosen kind and confirms it was received", () => {
    build();
    leads.submit.and.returnValue(of({ lead: { id: "l1", kind: "quote" as const } }));
    fill();
    component.setKind("quote");

    component.submit();

    expect(leads.submit).toHaveBeenCalledWith(jasmine.objectContaining({ kind: "quote", gym_name: "Power Gym" }));
    expect(component.sent()).toBe(true);
  });

  it("shows the backend's message on failure and stays on the form", () => {
    build();
    leads.submit.and.returnValue(throwError(() => new HttpErrorResponse({ error: { error: "Email is invalid" } })));
    fill();

    component.submit();

    expect(component.sent()).toBe(false);
    expect(component.error()).toBe("Email is invalid");
  });
});
