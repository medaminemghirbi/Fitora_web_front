import { API_ORIGIN } from "../../core/models/api-config";
import { MediaUrlPipe } from "./media-url.pipe";

describe("MediaUrlPipe", () => {
  const pipe = new MediaUrlPipe();

  it("prefixes a host-relative path with the API origin", () => {
    expect(pipe.transform("/uploads/logo.png")).toBe(`${API_ORIGIN}/uploads/logo.png`);
  });

  it("returns null for an empty/null/undefined path", () => {
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeNull();
    expect(pipe.transform("")).toBeNull();
  });
});
