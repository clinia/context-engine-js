/**
 * A `multipart/form-data` request body, built from the object form of the schema.
 *
 * An array-valued field becomes one part per item under the same field name — how a schema
 * declaring an array of items is sent — and every other field becomes a single part. A field
 * left `undefined` or `null` is omitted rather than sent as the string `"undefined"` or `"null"`.
 *
 * Values are appended as given, so a string is sent as text and a `Blob` or `File` keeps the
 * filename and content type it was created with.
 *
 * No `Content-Type` is set anywhere: the header carries the multipart boundary, which only
 * the runtime sending the request can know.
 */
export function toFormData(body: unknown): FormData {
  const form = new FormData();
  if (body === null || typeof body !== "object") return form;

  for (const [field, value] of Object.entries(body)) {
    if (value === undefined || value === null) continue;
    for (const part of Array.isArray(value) ? value : [value]) {
      form.append(field, part as string | Blob);
    }
  }
  return form;
}
