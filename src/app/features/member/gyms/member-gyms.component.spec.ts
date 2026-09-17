import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Gym, MyGym } from "../../../core/models/gym.model";
import { GymsService } from "../../../core/services/gyms.service";
import { ToastService } from "../../../core/services/toast.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { MemberGymsComponent } from "./member-gyms.component";

describe("MemberGymsComponent", () => {
  let fixture: ComponentFixture<MemberGymsComponent>;
  let component: MemberGymsComponent;
  let gymsService: jasmine.SpyObj<GymsService>;
  let toast: ToastService;
  let confirm: ConfirmService;

  const gym = { id: "g1", name: "Power Gym", city: "Tunis", activity_names: ["Boxe"], primary_color: null } as unknown as Gym;
  const mine = { ...gym, joined_at: "2026-01-01", active: true, current_contract: null } as unknown as MyGym;

  function build(myGyms: MyGym[] = []): void {
    TestBed.resetTestingModule();
    gymsService = jasmine.createSpyObj<GymsService>("GymsService", ["loadMine", "search", "join", "leave"], {
      mine: (() => myGyms) as never,
    });
    gymsService.loadMine.and.returnValue(of({ gyms: myGyms }));

    TestBed.configureTestingModule({
      imports: [MemberGymsComponent, TranslateModule.forRoot()],
      providers: [{ provide: GymsService, useValue: gymsService }],
    });

    fixture = TestBed.createComponent(MemberGymsComponent);
    component = fixture.componentInstance;
    toast = TestBed.inject(ToastService);
    confirm = TestBed.inject(ConfirmService);
    fixture.detectChanges();
  }

  it("loads the gyms the person already belongs to", () => {
    build([mine]);
    expect(gymsService.loadMine).toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  it("searches the directory and keeps the results", () => {
    build();
    gymsService.search.and.returnValue(of({ gyms: [gym] }));

    component.query.set("power");
    component.search();

    expect(gymsService.search).toHaveBeenCalledWith("power");
    expect(component.results()).toEqual([gym]);
    expect(component.searched()).toBe(true);
  });

  it("marks a gym the person has already joined instead of offering to join again", () => {
    build([mine]);
    expect(component.isMember(gym)).toBe(true);
  });

  it("joins a gym and says so", () => {
    build();
    gymsService.join.and.returnValue(of({ gym: mine }));

    component.join(gym);

    expect(gymsService.join).toHaveBeenCalledWith("g1");
    expect(toast.toasts()[0].kind).toBe("success");
    expect(component.joiningId()).toBeNull();
  });

  it("surfaces a failed join rather than pretending it worked", () => {
    build();
    gymsService.join.and.returnValue(throwError(() => new Error("nope")));

    component.join(gym);

    expect(toast.toasts()[0].kind).toBe("error");
  });

  it("asks before leaving a gym, and does nothing when the answer is no", async () => {
    build([mine]);
    spyOn(confirm, "ask").and.resolveTo(false);

    await component.leave(mine);

    expect(gymsService.leave).not.toHaveBeenCalled();
  });

  it("leaves the gym once confirmed", async () => {
    build([mine]);
    spyOn(confirm, "ask").and.resolveTo(true);
    gymsService.leave.and.returnValue(of(undefined));

    await component.leave(mine);

    expect(gymsService.leave).toHaveBeenCalledWith("g1");
    expect(toast.toasts()[0].kind).toBe("success");
  });
});
