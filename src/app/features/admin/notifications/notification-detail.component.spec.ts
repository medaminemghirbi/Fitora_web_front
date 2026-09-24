import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, convertToParamMap } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AppNotification } from "../../../core/models/notification.model";
import { NotificationService } from "../../../core/services/notification.service";
import { NotificationDetailComponent } from "./notification-detail.component";

describe("NotificationDetailComponent", () => {
  let fixture: ComponentFixture<NotificationDetailComponent>;
  let component: NotificationDetailComponent;
  let notifications: jasmine.SpyObj<Pick<NotificationService, "get" | "markRead">>;

  const notification = { id: "n1", kind: "contract_expiring", data: {}, read: false } as unknown as AppNotification;

  function build(succeeds: boolean): void {
    TestBed.resetTestingModule();
    notifications = jasmine.createSpyObj("NotificationService", ["get", "markRead"]);
    notifications.get.and.returnValue(succeeds ? of({ notification }) : throwError(() => new Error("nope")));

    TestBed.configureTestingModule({
      imports: [NotificationDetailComponent, TranslateModule.forRoot()],
      providers: [
        { provide: NotificationService, useValue: notifications },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: "n1" }) } } },
      ],
    });

    fixture = TestBed.createComponent(NotificationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it("loads the notification and marks it read", () => {
    build(true);
    expect(component.notification()).toEqual(notification);
    expect(component.loading()).toBe(false);
    expect(notifications.markRead).toHaveBeenCalledWith("n1");
  });

  it("sets the error flag when loading fails", () => {
    build(false);
    expect(component.error()).toBe(true);
  });

  it("text()/ctaKey() are blank without a loaded notification", () => {
    build(false);
    expect(component.text()).toEqual({ title: "", body: "" });
    expect(component.ctaKey()).toBe("");
  });

  it("text()/ctaKey() derive from the loaded notification", () => {
    build(true);
    expect(component.text().title).toBeTruthy();
    expect(component.ctaKey()).toBeTruthy();
  });
});
