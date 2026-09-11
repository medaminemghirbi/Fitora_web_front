import { SecurityContext } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { DomSanitizer } from "@angular/platform-browser";
import { HighlightPipe } from "./highlight.pipe";

describe("HighlightPipe", () => {
  let pipe: HighlightPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = TestBed.runInInjectionContext(() => new HighlightPipe());
  });

  function render(text: string | null | undefined, term: string | null | undefined): string {
    return sanitizer.sanitize(SecurityContext.HTML, pipe.transform(text, term)) ?? "";
  }

  it("wraps a case-insensitive match in a <mark>", () => {
    expect(render("Sarah Martin", "mar")).toContain('<mark class="fx-hl">Mar</mark>');
  });

  it("wraps every occurrence", () => {
    const html = render("abc abc", "abc");
    expect(html.match(/<mark/g)?.length).toBe(2);
  });

  it("returns the raw text unchanged when the term is empty (no escaping needed — never wrapped as trusted)", () => {
    expect(pipe.transform("Sarah & co", "")).toBe("Sarah & co");
  });

  it("returns the raw text unchanged when the term is null", () => {
    expect(pipe.transform("Sarah", null)).toBe("Sarah");
  });

  it("escapes HTML in the source text", () => {
    expect(render("<script>x</script>", "script")).not.toContain("<script>x</script>");
  });

  it("escapes regex special characters in the term", () => {
    expect(render("a.b", ".")).toContain('<mark class="fx-hl">.</mark>');
  });

  it("treats null/undefined text as an empty string", () => {
    expect(render(null, "x")).toBe("");
    expect(render(undefined, "x")).toBe("");
  });
});
