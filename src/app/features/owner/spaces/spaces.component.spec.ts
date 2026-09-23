import { HttpErrorResponse } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Activity } from "../../../core/models/activity.model";
import { Space } from "../../../core/models/space.model";
import { ActivitiesService } from "../../../core/services/activities.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { SpacesService } from "../../../core/services/spaces.service";
import { ToastService } from "../../../core/services/toast.service";
import { SpacesComponent } from "./spaces.component";

const pilates = { id: "a1", name: "Pilates", emoji: "🧘", active: true } as Activity;
const boxing = { id: "a2", name: "Boxe", emoji: "🥊", active: true } as Activity;

function space(overrides: Partial<Space> = {}): Space {
  return { id: "s1", name: "Studio 1", kind: "studio", capacity: 12, active: true, activity_ids: [], deletable: true, ...overrides };
}

describe("SpacesComponent", () => {
  let fixture: ComponentFixture<SpacesComponent>;
  let component: SpacesComponent;
  let spaces: jasmine.SpyObj<SpacesService>;
  let activities: jasmine.SpyObj<ActivitiesService>;
  let toast: jasmine.SpyObj<ToastService>;
  let confirm: jasmine.SpyObj<ConfirmService>;

  function build(rows: Space[] = [space()]): void {
    TestBed.resetTestingModule();

    spaces = jasmine.createSpyObj<SpacesService>("SpacesService", ["list", "create", "update", "remove"]);
    spaces.list.and.returnValue(of({ spaces: rows }));
    spaces.create.and.returnValue(of({ space: space() }));
    spaces.update.and.returnValue(of({ space: space() }));
    spaces.remove.and.returnValue(of({ space: space() }));

    activities = jasmine.createSpyObj<ActivitiesService>("ActivitiesService", ["list"]);
    activities.list.and.returnValue(of({ activities: [pilates, boxing] }));

    toast = jasmine.createSpyObj<ToastService>("ToastService", ["success", "error"]);
    confirm = jasmine.createSpyObj<ConfirmService>("ConfirmService", ["ask"]);
    confirm.ask.and.returnValue(Promise.resolve(true));

    TestBed.configureTestingModule({
      imports: [SpacesComponent, TranslateModule.forRoot()],
      providers: [
        { provide: SpacesService, useValue: spaces },
        { provide: ActivitiesService, useValue: activities },
        { provide: ToastService, useValue: toast },
        { provide: ConfirmService, useValue: confirm },
      ],
    });

    fixture = TestBed.createComponent(SpacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it("lists the gym's rooms", () => {
    build();
    expect(component.spaces().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain("Studio 1");
  });

  it("still lists rooms when the activity list cannot be read", () => {
    build();
    activities.list.and.returnValue(throwError(() => new Error("no")));

    component.load();

    expect(component.spaces().length).toBe(1);
    expect(component.activities()).toEqual([]);
  });

  it("says a room with no restriction takes anything", () => {
    build();
    expect(component.restrictionLabel(space())).toBe("spaces.any_activity");
  });

  it("names the activities a room is reserved for", () => {
    build();
    expect(component.restrictionLabel(space({ activity_ids: ["a1", "a2"] }))).toBe("Pilates, Boxe");
  });

  it("sends the restriction list with the room", () => {
    build();
    component.openCreate();
    component.form.patchValue({ name: "Cabine 2" });
    component.toggleActivity("a1");
    component.submit();

    expect(spaces.create).toHaveBeenCalledWith(jasmine.objectContaining({ name: "Cabine 2", activity_ids: ["a1"] }));
  });

  it("refuses to save a room with no name", () => {
    build();
    component.openCreate();
    component.submit();

    expect(spaces.create).not.toHaveBeenCalled();
  });

  it("keeps the form open and shows why when the save is refused", () => {
    build();
    spaces.create.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 422, error: { error: "Name has already been taken" } }))
    );

    component.openCreate();
    component.form.patchValue({ name: "Studio 1" });
    component.submit();

    expect(component.modalOpen()).toBe(true);
    expect(component.formError()).toBe("Name has already been taken");
  });

  it("edits a room with its current restrictions loaded", () => {
    build();
    component.openEdit(space({ activity_ids: ["a2"] }));

    expect(component.isRestrictedTo("a2")).toBe(true);
    expect(component.isRestrictedTo("a1")).toBe(false);
  });

  it("warns about deactivation, not deletion, when sessions are still booked in", async () => {
    build();
    component.remove(space({ deletable: false }));
    await fixture.whenStable();

    expect(confirm.ask).toHaveBeenCalledWith(jasmine.objectContaining({ title: "spaces.deactivate_title" }));
    expect(spaces.remove).toHaveBeenCalled();
  });

  it("does nothing when the confirmation is declined", async () => {
    build();
    confirm.ask.and.returnValue(Promise.resolve(false));

    component.remove(space());
    await fixture.whenStable();

    expect(spaces.remove).not.toHaveBeenCalled();
  });

  it("hides its own heading when embedded in the setup flow", () => {
    build();
    component.embedded = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector("app-page-header")).toBeNull();
  });
});
