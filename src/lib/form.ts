export function formString(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : fallback;
}

export function formStrings(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function parseJsonField<T>(
  formData: FormData,
  key: string,
  parser: (value: unknown) => T
) {
  const value = formString(formData, key);
  if (!value) {
    throw new Error(`Missing ${key}.`);
  }

  return parser(JSON.parse(value));
}
