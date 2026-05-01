export function normalizeTextareaText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

export function firstWords(value: string, count: number) {
  return value
    .replace(/[^\w\s%.-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, count)
    .join(" ");
}

export function compactSentence(value: string, fallback: string) {
  const normalized = firstWords(value, 14);
  return normalized.length > 0 ? normalized : fallback;
}
