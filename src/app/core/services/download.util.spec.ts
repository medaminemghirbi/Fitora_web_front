import { fakeAsync, tick } from "@angular/core/testing";
import { HttpErrorResponse } from "@angular/common/http";
import { downloadBlob, readBlobErrorCode } from "./download.util";

describe("downloadBlob", () => {
  let createObjectURLSpy: jasmine.Spy;
  let revokeObjectURLSpy: jasmine.Spy;
  let clickSpy: jasmine.Spy;

  beforeEach(() => {
    createObjectURLSpy = spyOn(URL, "createObjectURL").and.returnValue("blob:fake-url");
    revokeObjectURLSpy = spyOn(URL, "revokeObjectURL");
    clickSpy = spyOn(HTMLAnchorElement.prototype, "click");
  });

  it("creates an object URL for the blob and clicks a download link", () => {
    const blob = new Blob(["x"], { type: "application/pdf" });

    downloadBlob(blob, "report.pdf");

    expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalled();
  });

  it("sets the link's download filename and appends/removes it from the DOM", () => {
    let appendedLink: HTMLAnchorElement | null = null;
    const appendSpy = spyOn(document.body, "appendChild").and.callFake(<T extends Node>(node: T) => {
      appendedLink = node as unknown as HTMLAnchorElement;
      return node;
    });

    downloadBlob(new Blob(["x"]), "pre-fiche-paie.pdf");

    expect(appendSpy).toHaveBeenCalled();
    expect(appendedLink!.download).toBe("pre-fiche-paie.pdf");
    expect(appendedLink!.href).toContain("blob:fake-url");
  });

  it("defers revoking the object URL to the next tick (doesn't cancel the download)", fakeAsync(() => {
    downloadBlob(new Blob(["x"]), "f.pdf");

    expect(revokeObjectURLSpy).not.toHaveBeenCalled();
    tick();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:fake-url");
  }));
});

describe("readBlobErrorCode", () => {
  it("returns null when the error isn't an HttpErrorResponse", async () => {
    expect(await readBlobErrorCode(new Error("boom"))).toBeNull();
  });

  it("returns null when the error body isn't a Blob", async () => {
    const err = new HttpErrorResponse({ error: { error: "not_found" }, status: 404 });
    expect(await readBlobErrorCode(err)).toBeNull();
  });

  it("parses the backend's error code out of a Blob body", async () => {
    const blob = new Blob([JSON.stringify({ error: "not_found" })], { type: "application/json" });
    const err = new HttpErrorResponse({ error: blob, status: 404 });
    expect(await readBlobErrorCode(err)).toBe("not_found");
  });

  it("returns null for a Blob that isn't valid JSON", async () => {
    const blob = new Blob(["not json"], { type: "application/json" });
    const err = new HttpErrorResponse({ error: blob, status: 500 });
    expect(await readBlobErrorCode(err)).toBeNull();
  });

  it("returns null when the parsed JSON has no string `error` field", async () => {
    const blob = new Blob([JSON.stringify({ message: "oops" })], { type: "application/json" });
    const err = new HttpErrorResponse({ error: blob, status: 500 });
    expect(await readBlobErrorCode(err)).toBeNull();
  });
});
