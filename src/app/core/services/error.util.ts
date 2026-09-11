import { HttpErrorResponse } from "@angular/common/http";
import { FormGroup } from "@angular/forms";

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse && error.error?.error) {
    return error.error.error as string;
  }
  return fallback;
}

// A handful of endpoints (password reset/email verification token checks,
// the login rate-limiter) return a short machine-readable code in the same
// `error` field extractErrorMessage otherwise treats as user-facing text —
// e.g. "invalid_or_expired_token", "rate_limited". Callers that know their
// endpoint can return one of these use this first so that code never
// leaks into the UI raw, and fall back to extractErrorMessage's normal
// "show the backend's real message" behavior for anything else (a genuine
// validation error is worth showing as-is).
export function isErrorCode(error: unknown, code: string): boolean {
  return error instanceof HttpErrorResponse && error.error?.error === code;
}

// Some endpoints (suppliers so far — see their
// controllers' `errors: model.errors.to_hash`) return validation errors
// keyed by field: `{ "name": ["can't be blank"], "photo": ["must be an
// image..."] }`, instead of the flat `full_messages` array most endpoints
// still send. Used to attach the right message to the right control rather
// than only showing one generic banner above the whole form.
export type FieldErrors = Record<string, string[]>;

export function extractFieldErrors(error: unknown): FieldErrors | null {
  if (!(error instanceof HttpErrorResponse)) return null;
  const errors = error.error?.errors;
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) return null;
  return errors as FieldErrors;
}

/**
 * Attaches each field error to its matching FormGroup control (as a
 * `server` validation error, shown in the template like any other) and
 * returns the messages for keys that have no matching control — e.g.
 * `photo`, which most of these forms track outside the FormGroup as a
 * plain File — so the caller can still show those somewhere (its own
 * inline slot, or a fallback banner).
 */
export function applyFieldErrors(form: FormGroup, fieldErrors: FieldErrors): Record<string, string> {
  const unmatched: Record<string, string> = {};
  for (const [ field, messages ] of Object.entries(fieldErrors)) {
    const message = messages[0];
    const control = form.get(field);
    if (control) {
      control.setErrors({ ...control.errors, server: message });
      control.markAsTouched();
    } else {
      unmatched[field] = message;
    }
  }
  return unmatched;
}
