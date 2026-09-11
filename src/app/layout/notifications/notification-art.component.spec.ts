import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotificationArtComponent } from "./notification-art.component";

describe("NotificationArtComponent", () => {
  let fixture: ComponentFixture<NotificationArtComponent>;
  let component: NotificationArtComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NotificationArtComponent] }).compileComponents();
    fixture = TestBed.createComponent(NotificationArtComponent);
    component = fixture.componentInstance;
  });

  it("shows the birthday cake emoji and renders the birthday scene", () => {
    component.kind = "employee_birthday";
    fixture.detectChanges();
    expect(component.emoji).toBe("🎂");
    expect(fixture.nativeElement.querySelector(".flame")).not.toBeNull();
  });

  it("shows the contract clipboard emoji and renders the contract scene", () => {
    component.kind = "contract_expiring";
    fixture.detectChanges();
    expect(component.emoji).toBe("📋");
  });

  it("shows the document emoji and falls back to the default scene", () => {
    component.kind = "document_expiring";
    fixture.detectChanges();
    expect(component.emoji).toBe("📄");
  });

  it("shows the rocket emoji for a system update", () => {
    component.kind = "system_update";
    fixture.detectChanges();
    expect(component.emoji).toBe("🚀");
  });

  it("falls back to the bell emoji for an unrecognized kind", () => {
    component.kind = "something_unexpected" as never;
    fixture.detectChanges();
    expect(component.emoji).toBe("🔔");
  });

  it("applies the mini modifier class when mini is true", () => {
    component.kind = "system_update";
    component.mini = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".art--mini")).not.toBeNull();
  });
});
