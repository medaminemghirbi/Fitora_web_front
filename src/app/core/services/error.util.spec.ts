import { HttpErrorResponse } from "@angular/common/http";
import { FormBuilder } from "@angular/forms";
import { applyFieldErrors, extractErrorMessage, extractFieldErrors, isErrorCode } from "./error.util";

describe("error.util", () => {
  describe("extractErrorMessage", () => {
    it("returns the backend's error message", () => {
      const err = new HttpErrorResponse({ error: { error: "Email already taken" }, status: 422 });
      expect(extractErrorMessage(err, "fallback")).toBe("Email already taken");
    });

    it("falls back when the error isn't an HttpErrorResponse", () => {
      expect(extractErrorMessage(new Error("boom"), "fallback")).toBe("fallback");
    });

    it("falls back when the body has no `error` field", () => {
      const err = new HttpErrorResponse({ error: {}, status: 500 });
      expect(extractErrorMessage(err, "fallback")).toBe("fallback");
    });
  });

  describe("isErrorCode", () => {
    it("matches the exact machine-readable code", () => {
      const err = new HttpErrorResponse({ error: { error: "invalid_or_expired_token" }, status: 422 });
      expect(isErrorCode(err, "invalid_or_expired_token")).toBe(true);
      expect(isErrorCode(err, "rate_limited")).toBe(false);
    });

    it("is false for a non-HttpErrorResponse", () => {
      expect(isErrorCode(new Error("x"), "rate_limited")).toBe(false);
    });
  });

  describe("extractFieldErrors", () => {
    it("returns the field => messages map", () => {
      const err = new HttpErrorResponse({ error: { errors: { name: ["can't be blank"] } }, status: 422 });
      expect(extractFieldErrors(err)).toEqual({ name: ["can't be blank"] });
    });

    it("returns null when there is no `errors` object", () => {
      const err = new HttpErrorResponse({ error: { error: "nope" }, status: 422 });
      expect(extractFieldErrors(err)).toBeNull();
    });

    it("returns null when `errors` is an array, not a field map", () => {
      const err = new HttpErrorResponse({ error: { errors: ["bad"] }, status: 422 });
      expect(extractFieldErrors(err)).toBeNull();
    });

    it("returns null for a non-HttpErrorResponse", () => {
      expect(extractFieldErrors(new Error("x"))).toBeNull();
    });
  });

  describe("applyFieldErrors", () => {
    const fb = new FormBuilder();

    it("attaches a server error to a matching control and marks it touched", () => {
      const form = fb.group({ name: [""], email: [""] });
      const unmatched = applyFieldErrors(form, { name: ["can't be blank"] });

      expect(form.get("name")!.errors).toEqual({ server: "can't be blank" });
      expect(form.get("name")!.touched).toBe(true);
      expect(unmatched).toEqual({});
    });

    it("preserves pre-existing errors on the control", () => {
      const form = fb.group({ email: [""] });
      form.get("email")!.setErrors({ required: true });

      applyFieldErrors(form, { email: ["is invalid"] });

      expect(form.get("email")!.errors).toEqual({ required: true, server: "is invalid" });
    });

    it("returns fields with no matching control as unmatched", () => {
      const form = fb.group({ name: [""] });
      const unmatched = applyFieldErrors(form, { name: ["bad"], photo: ["too large"] });

      expect(unmatched).toEqual({ photo: "too large" });
    });
  });
});
