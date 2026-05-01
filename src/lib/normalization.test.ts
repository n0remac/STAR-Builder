import { describe, expect, it } from "vitest";

import {
  compactSentence,
  firstWords,
  normalizeTextareaText
} from "@/lib/normalization";

describe("normalization utilities", () => {
  it("normalizes textarea content", () => {
    expect(normalizeTextareaText(" first \r\n\r\n second  ")).toBe(
      "first\nsecond"
    );
  });

  it("limits text to the requested number of words", () => {
    expect(firstWords("one two three four", 2)).toBe("one two");
  });

  it("uses fallback for empty compact sentences", () => {
    expect(compactSentence("!!!", "Fallback")).toBe("Fallback");
  });
});
