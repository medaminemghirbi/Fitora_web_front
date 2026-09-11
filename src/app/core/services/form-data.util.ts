// Builds a multipart FormData body under one root key, e.g.
// toFormData("supplier", { name: "Alpha", photo: file }) → "supplier[name]", "supplier[photo]".
// Skips undefined/null so a PATCH can omit fields it isn't changing, and
// leaves File values as-is (everything else is stringified).
export function toFormData<T extends object>(rootKey: string, payload: T): FormData {
  const formData = new FormData();
  Object.entries(payload as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    formData.append(`${rootKey}[${key}]`, value instanceof File ? value : String(value));
  });
  return formData;
}
