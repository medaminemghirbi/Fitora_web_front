import { HttpErrorResponse } from "@angular/common/http";

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke on the next tick — revoking synchronously can cancel the
  // download in Firefox/Safari before the browser has read the blob.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// With responseType: "blob", a non-2xx response body arrives as a Blob (the
// raw JSON bytes), not a parsed object — has to be read back out
// asynchronously before the backend's error code is usable.
export async function readBlobErrorCode(err: unknown): Promise<string | null> {
  if (!(err instanceof HttpErrorResponse) || !(err.error instanceof Blob)) return null;

  try {
    const parsed = JSON.parse(await err.error.text());
    return typeof parsed?.error === "string" ? parsed.error : null;
  } catch {
    return null;
  }
}
