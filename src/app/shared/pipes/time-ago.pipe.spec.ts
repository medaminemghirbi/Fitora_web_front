import { TestBed } from "@angular/core/testing";
import { TranslateService } from "@ngx-translate/core";
import { TimeAgoPipe } from "./time-ago.pipe";

describe("TimeAgoPipe", () => {
  let pipe: TimeAgoPipe;
  let translate: jasmine.SpyObj<TranslateService>;

  beforeEach(() => {
    translate = jasmine.createSpyObj<TranslateService>("TranslateService", ["instant"], { currentLang: "fr" });
    translate.instant.and.callFake((key: string) => key);

    TestBed.configureTestingModule({
      providers: [{ provide: TranslateService, useValue: translate }],
    });
    pipe = TestBed.runInInjectionContext(() => new TimeAgoPipe());
  });

  it("returns an empty string for a falsy value", () => {
    expect(pipe.transform(null)).toBe("");
    expect(pipe.transform(undefined)).toBe("");
    expect(pipe.transform("")).toBe("");
  });

  it("returns an empty string for an unparsable date", () => {
    expect(pipe.transform("not-a-date")).toBe("");
  });

  it("uses time.now under 45 seconds", () => {
    pipe.transform(new Date(Date.now() - 10_000).toISOString());
    expect(translate.instant).toHaveBeenCalledWith("time.now", undefined);
  });

  it("uses time.minutes between 45s and an hour", () => {
    pipe.transform(new Date(Date.now() - 5 * 60_000).toISOString());
    expect(translate.instant).toHaveBeenCalledWith("time.minutes", { n: 5 });
  });

  it("uses time.hours between an hour and a day", () => {
    pipe.transform(new Date(Date.now() - 3 * 3_600_000).toISOString());
    expect(translate.instant).toHaveBeenCalledWith("time.hours", { n: 3 });
  });

  it("uses time.days between a day and a week", () => {
    pipe.transform(new Date(Date.now() - 2 * 86_400_000).toISOString());
    expect(translate.instant).toHaveBeenCalledWith("time.days", { n: 2 });
  });

  it("falls back to a localized date past a week", () => {
    const old = new Date(Date.now() - 30 * 86_400_000);
    expect(pipe.transform(old.toISOString())).toBe(
      old.toLocaleDateString("fr", { day: "2-digit", month: "short" })
    );
  });
});
