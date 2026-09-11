import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of } from "rxjs";
import { Activity } from "../../../core/models/activity.model";
import { ActivitiesService } from "../../../core/services/activities.service";
import { ActivitiesComponent } from "./activities.component";

describe("ActivitiesComponent", () => {
  let fixture: ComponentFixture<ActivitiesComponent>;
  let activitiesService: jasmine.SpyObj<ActivitiesService>;

  beforeEach(async () => {
    activitiesService = jasmine.createSpyObj("ActivitiesService", ["list", "create", "update", "deactivate"]);
    activitiesService.list.and.returnValue(of({ activities: [] }));

    await TestBed.configureTestingModule({
      imports: [ActivitiesComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivitiesService, useValue: activitiesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivitiesComponent);
    fixture.detectChanges();
  });

  it("creates an activity", () => {
    activitiesService.create.and.returnValue(of({ activity: { id: 1 } as unknown as Activity }));

    fixture.componentInstance.openCreate();
    fixture.componentInstance.form.patchValue({ name: "Yoga" });
    fixture.componentInstance.submit();

    expect(activitiesService.create).toHaveBeenCalledWith(jasmine.objectContaining({ name: "Yoga" }));
    expect(fixture.componentInstance.modalOpen()).toBe(false);
  });

  it("does not submit when required fields are missing", () => {
    fixture.componentInstance.openCreate();
    fixture.componentInstance.form.patchValue({ name: "" });
    fixture.componentInstance.submit();

    expect(activitiesService.create).not.toHaveBeenCalled();
  });
});
