import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, convertToParamMap } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Activity } from "../../../core/models/activity.model";
import { ActivitiesService } from "../../../core/services/activities.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { ToastService } from "../../../core/services/toast.service";
import { ActivitiesComponent } from "./activities.component";

describe("ActivitiesComponent", () => {
  let fixture: ComponentFixture<ActivitiesComponent>;
  let component: ActivitiesComponent;
  let activitiesService: jasmine.SpyObj<ActivitiesService>;
  let confirmService: ConfirmService;
  let toast: ToastService;

  const activity: Activity = {
    id: "a1", location_id: "l1", name: "Yoga", emoji: "🧘", description: null,
    session_format: "collective", duration: 60, capacity: 15, active: true,
  };

  function build(queryParams: Record<string, string> = {}): void {
    TestBed.resetTestingModule();
    activitiesService = jasmine.createSpyObj("ActivitiesService", ["list", "create", "update", "deactivate"]);
    activitiesService.list.and.returnValue(of({ activities: [activity] }));

    TestBed.configureTestingModule({
      imports: [ActivitiesComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ActivitiesService, useValue: activitiesService },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } },
      ],
    });

    fixture = TestBed.createComponent(ActivitiesComponent);
    component = fixture.componentInstance;
    confirmService = TestBed.inject(ConfirmService);
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  }

  beforeEach(() => build());

  it("loads activities on init", () => {
    expect(component.activities()).toEqual([activity]);
  });

  it("sets the error flag when loading fails", () => {
    activitiesService.list.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });

  it("opens the create modal automatically for ?action=new", () => {
    build({ action: "new" });
    expect(component.modalOpen()).toBe(true);
  });

  it("filtered/meta reflect the search term", () => {
    component.search.set("yoga");
    expect(component.filtered().length).toBe(1);
    component.search.set("zzz");
    expect(component.meta().total).toBe(0);
  });

  it("changing the search term resets to page 1", () => {
    component.page.set(3);
    component.search.set("y");
    fixture.detectChanges();
    expect(component.page()).toBe(1);
  });

  describe("session format / capacity coherence", () => {
    it("switching to individual locks capacity at 1 and disables the field", () => {
      component.form.controls.session_format.setValue("individual");
      expect(component.form.controls.capacity.value).toBe(1);
      expect(component.form.controls.capacity.disabled).toBe(true);
    });

    it("switching to small_group re-enables capacity and snaps out-of-range values to the preset", () => {
      component.form.controls.session_format.setValue("individual");
      component.form.controls.session_format.setValue("small_group");
      expect(component.form.controls.capacity.enabled).toBe(true);
      expect(component.form.controls.capacity.value).toBe(6);
    });

    it("keeps an in-range capacity value when switching formats", () => {
      component.form.patchValue({ capacity: 5 });
      component.form.controls.session_format.setValue("small_group");
      expect(component.form.controls.capacity.value).toBe(5);
    });
  });

  it("openCreate resets to the collective defaults", () => {
    component.openCreate();
    expect(component.editing()).toBeNull();
    expect(component.form.value.session_format).toBe("collective");
    expect(component.capacityBounds()).toEqual({ min: 10, max: null });
    expect(component.modalOpen()).toBe(true);
  });

  it("openEdit hydrates the form and applies that activity's format bounds", () => {
    const individual: Activity = { ...activity, session_format: "individual", capacity: 1 };
    component.openEdit(individual);
    expect(component.editing()).toBe(individual);
    expect(component.capacityBounds()).toEqual({ min: 1, max: 1 });
  });

  it("closeModal closes it", () => {
    component.modalOpen.set(true);
    component.closeModal();
    expect(component.modalOpen()).toBe(false);
  });

  it("selectEmoji toggles the same emoji off, or sets a new one", () => {
    component.selectEmoji("🔥");
    expect(component.form.value.emoji).toBe("🔥");
    component.selectEmoji("🔥");
    expect(component.form.value.emoji).toBe("");
  });

  it("does not submit when required fields are missing", () => {
    component.openCreate();
    component.form.patchValue({ name: "" });
    component.submit();
    expect(activitiesService.create).not.toHaveBeenCalled();
  });

  it("creates an activity", () => {
    activitiesService.create.and.returnValue(of({ activity }));
    component.openCreate();
    component.form.patchValue({ name: "Yoga" });
    component.submit();
    expect(activitiesService.create).toHaveBeenCalledWith(jasmine.objectContaining({ name: "Yoga" }));
    expect(component.modalOpen()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("updates an existing activity", () => {
    component.openEdit(activity);
    activitiesService.update.and.returnValue(of({ activity }));
    component.submit();
    expect(activitiesService.update).toHaveBeenCalledWith("a1", jasmine.any(Object));
  });

  it("shows the backend error on failure", () => {
    component.openCreate();
    component.form.patchValue({ name: "Yoga" });
    activitiesService.create.and.returnValue(throwError(() => new Error("nope")));
    component.submit();
    expect(component.formError()).toBeTruthy();
  });

  it("deactivate does nothing when declined", async () => {
    spyOn(confirmService, "ask").and.resolveTo(false);
    await component.deactivate(activity);
    expect(activitiesService.deactivate).not.toHaveBeenCalled();
  });

  it("deactivate deactivates on confirmation", async () => {
    spyOn(confirmService, "ask").and.resolveTo(true);
    activitiesService.deactivate.and.returnValue(of({ activity }));
    await component.deactivate(activity);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("deactivate shows an error toast on failure", async () => {
    spyOn(confirmService, "ask").and.resolveTo(true);
    activitiesService.deactivate.and.returnValue(throwError(() => new Error("nope")));
    await component.deactivate(activity);
    expect(toast.toasts()[0].kind).toBe("error");
  });
});
