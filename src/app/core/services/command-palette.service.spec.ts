import { TestBed } from "@angular/core/testing";
import { CommandPaletteService } from "./command-palette.service";

describe("CommandPaletteService", () => {
  let service: CommandPaletteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommandPaletteService);
  });

  it("starts closed", () => {
    expect(service.isOpen()).toBe(false);
  });

  it("open() sets isOpen true", () => {
    service.open();
    expect(service.isOpen()).toBe(true);
  });

  it("close() sets isOpen false", () => {
    service.open();
    service.close();
    expect(service.isOpen()).toBe(false);
  });

  it("toggle() flips the state", () => {
    service.toggle();
    expect(service.isOpen()).toBe(true);
    service.toggle();
    expect(service.isOpen()).toBe(false);
  });
});
