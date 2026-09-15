import { parseCsv } from "./csv.util";

describe("parseCsv", () => {
  it("parses a simple comma-separated file into rows of cells", () => {
    expect(parseCsv("a,b,c\n1,2,3\n")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles quoted fields containing commas", () => {
    expect(parseCsv('name,note\n"Doe, John",hello\n')).toEqual([
      ["name", "note"],
      ["Doe, John", "hello"],
    ]);
  });

  it("handles an escaped double-quote inside a quoted field", () => {
    expect(parseCsv('name\n"He said ""hi"""\n')).toEqual([["name"], ['He said "hi"']]);
  });

  it("handles a quoted field containing a newline", () => {
    expect(parseCsv('name,note\nA,"line1\nline2"\n')).toEqual([
      ["name", "note"],
      ["A", "line1\nline2"],
    ]);
  });

  it("supports CRLF line endings", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("skips blank lines", () => {
    expect(parseCsv("a,b\n\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles a file with no trailing newline", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("returns an empty array for an empty string", () => {
    expect(parseCsv("")).toEqual([]);
  });
});
