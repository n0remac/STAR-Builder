import { describe, expect, it } from "vitest";

import {
  freshNarrativeScoreState,
  getNarrativeFingerprint,
  getNarrativeScoreLabel,
  isNarrativeScoreFresh,
  narrativeThemeLabel,
  normalizeNarrativeTheme,
  safeNarrativeScope,
  scoreStateForNarrative
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
    expect(safeNarrativeScope("target_job")).toBe("target_job");
    expect(safeNarrativeScope("invalid")).toBe("career");
    expect(normalizeNarrativeTheme("  custom theme  ")).toBe("custom theme");
    expect(normalizeNarrativeTheme("")).toBe("impact");
    expect(narrativeThemeLabel("technical_depth")).toBe("Technical depth");
    expect(narrativeThemeLabel("custom theme")).toBe("custom theme");
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

  it("changes fingerprints when target job context changes", () => {
    const targetSnapshot = {
      ...snapshot,
      scope: "target_job" as const,
      targetJob: {
        title: "Staff Engineer",
        company: "Acme Labs",
        description: "Build reliable customer-facing platform systems."
      }
    };

    expect(getNarrativeFingerprint(targetSnapshot)).not.toBe(
      getNarrativeFingerprint({
        ...targetSnapshot,
        targetJob: {
          ...targetSnapshot.targetJob,
          description: "Lead developer productivity and infrastructure work."
        }
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

  it("keeps unscored narratives unscored on save", () => {
    expect(
      scoreStateForNarrative(snapshot, {
        score: null,
        scoreRationale: "",
        scoredAt: null,
        sourceHash: null
      })
    ).toEqual({
      score: null,
      scoreRationale: "",
      scoredAt: null,
      scoreIsStale: false,
      sourceHash: null
    });
  });

  it("preserves fresh narrative score state when the snapshot matches the DB hash", () => {
    const scoredAt = new Date("2026-01-01T00:00:00.000Z");
    const sourceHash = getNarrativeFingerprint(snapshot);

    expect(
      scoreStateForNarrative(snapshot, {
        score: 8,
        scoreRationale: "Clear narrative.",
        scoredAt,
        sourceHash
      })
    ).toEqual({
      score: 8,
      scoreRationale: "Clear narrative.",
      scoredAt,
      scoreIsStale: false,
      sourceHash
    });
  });

  it("marks existing narrative scores stale when the snapshot changes", () => {
    const scoredAt = new Date("2026-01-01T00:00:00.000Z");
    const sourceHash = getNarrativeFingerprint(snapshot);

    expect(
      scoreStateForNarrative(
        { ...snapshot, theme: "leadership" },
        {
          score: 8,
          scoreRationale: "Clear narrative.",
          scoredAt,
          sourceHash
        }
      )
    ).toEqual({
      score: 8,
      scoreRationale: "Clear narrative.",
      scoredAt,
      scoreIsStale: true,
      sourceHash
    });
  });

  it("creates fresh narrative score state after regeneration", () => {
    const scoredAt = new Date("2026-01-01T00:00:00.000Z");

    expect(
      freshNarrativeScoreState(
        snapshot,
        { score: 9, rationale: "Ready to use." },
        scoredAt
      )
    ).toEqual({
      score: 9,
      scoreRationale: "Ready to use.",
      scoredAt,
      scoreIsStale: false,
      sourceHash: getNarrativeFingerprint(snapshot)
    });
  });
});
