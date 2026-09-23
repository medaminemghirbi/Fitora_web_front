import { ComponentFixture, TestBed } from "@angular/core/testing";
import { StatusFilterComponent, StatusFilterOption } from "./status-filter.component";

describe("StatusFilterComponent", () => {
  let fixture: ComponentFixture<StatusFilterComponent>;
  let component: StatusFilterComponent;

  const options: StatusFilterOption[] = [
    { value: "", label: "Tous", count: 165, color: "var(--color-primary)" },
    { value: "active", label: "Actifs", count: 138, color: "var(--color-success)" },
    { value: "overdue", label: "En retard", count: 4, color: "var(--color-danger)" },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StatusFilterComponent] }).compileComponents();
    fixture = TestBed.createComponent(StatusFilterComponent);
    component = fixture.componentInstance;
    component.name = "client-status";
    component.legend = "Statut";
    component.options = options;
    component.value = "";
    fixture.detectChanges();
  });

  it("renders one pill per status, each carrying its count", () => {
    const chips = [...fixture.nativeElement.querySelectorAll(".fx-chip")] as HTMLElement[];

    expect(chips.length).toBe(3);
    expect(chips[2].textContent).toContain("En retard");
    expect(chips[2].textContent).toContain("4");
  });

  // Picking a status is picking one of a set, so the radios stay even though
  // the pills are what you see.
  it("keeps real radios behind the pills, one group, one checked", () => {
    const radios = [...fixture.nativeElement.querySelectorAll("input[type=radio]")] as HTMLInputElement[];

    expect(radios.length).toBe(3);
    expect(radios.every((r) => r.name === "client-status")).toBe(true);
    expect(radios.filter((r) => r.checked).length).toBe(1);
  });

  it("labels each pill for its own radio, so clicking it selects", () => {
    const label = fixture.nativeElement.querySelector('label[for="client-status-active"]');
    const input = fixture.nativeElement.querySelector("#client-status-active");

    expect(label).toBeTruthy();
    expect(input).toBeTruthy();
  });

  it("emits the value that was picked", () => {
    const emitted: string[] = [];
    component.valueChange.subscribe((v) => emitted.push(v));

    fixture.nativeElement.querySelector("#client-status-overdue").dispatchEvent(new Event("change"));

    expect(emitted).toEqual(["overdue"]);
  });

  it("moves the checked state when the value changes", () => {
    component.value = "active";
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector("#client-status-active").checked).toBe(true);
    expect(fixture.nativeElement.querySelector("#client-status-").checked).toBe(false);
  });

  // The pill takes the colour of the strip the matching rows carry, so the
  // filter and the rows read as the same thing.
  it("gives each pill its status colour", () => {
    const chip = fixture.nativeElement.querySelector('label[for="client-status-overdue"]') as HTMLElement;

    expect(chip.style.getPropertyValue("--fx-chip-color")).toBe("var(--color-danger)");
  });

  it("still names the group for anyone who cannot see the pills", () => {
    expect(fixture.nativeElement.querySelector("legend")?.textContent).toContain("Statut");
  });
});
