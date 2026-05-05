import { describe, expect, it } from "vitest";

import {
  getNarrativeFingerprint,
  getNarrativeScoreLabel,
  isNarrativeScoreFresh,
  safeNarrativeScope,
  safeNarrativeTheme
} from "@/lib/narrative";

const snapshot = {
  scope: "career" as const,
  theme: "impact" as const,
  sourceIds: ["star_1", "star_2"],
  title: "Impact narrative",
  positioning: "I create measurable impact.",
  fullNarrative: "I repeatedly turn ambiguous problems into clear outcomes.",
  shortVersion: "I create measurable outcomes from ambiguity.",
  interviewGuidance: "Lead with the theme and bridge into STAR evidence."
};

describe("narrative utilities", () => {
  it("falls back for invalid scope and theme values", () => {
    expect(safeNarrativeScope("job")).toBe("job");
    expect(safeNarrativeScope("invalid")).toBe("career");
    expect(safeNarrativeTheme("leadership")).toBe("leadership");
    expect(safeNarrativeTheme("invalid")).toBe("impact");
  });

  it("formats narrative score labels", () => {
    expect(getNarrativeScoreLabel({ score: null, scoreIsStale: false })).toBe(
      "Unscored"
    );
    expect(getNarrativeScoreLabel({ score: 8, scoreIsStale: false })).toBe(
      "Score 8/10"
    );
    expect(getNarrativeScoreLabel({ score: 6, scoreIsStale: true })).toBe(
      "Score 6/10 stale"
    );
  });

  it("changes fingerprints when content changes", () => {
    expect(getNarrativeFingerprint(snapshot)).not.toBe(
      getNarrativeFingerprint({
        ...snapshot,
        fullNarrative: "A different narrative."
      })
    );
  });

  it("changes fingerprints when source ids change", () => {
    expect(getNarrativeFingerprint(snapshot)).not.toBe(
      getNarrativeFingerprint({
        ...snapshot,
        sourceIds: ["star_1"]
      })
    );
  });

  it("detects whether a narrative score is fresh", () => {
    const sourceHash = getNarrativeFingerprint(snapshot);

    expect(
      isNarrativeScoreFresh(snapshot, { score: 8, sourceHash })
    ).toBe(true);
    expect(
      isNarrativeScoreFresh(
        { ...snapshot, shortVersion: "Changed." },
        { score: 8, sourceHash }
      )
    ).toBe(false);
    expect(
      isNarrativeScoreFresh(snapshot, { score: null, sourceHash })
    ).toBe(false);
  });
});
