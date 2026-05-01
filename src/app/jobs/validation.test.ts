import { describe, expect, it } from "vitest";

import {
  normalizeAiAnswers,
  safeStarCategory,
  validateAiAnswers,
  validateJobId,
  validateManualJobInput
} from "@/app/jobs/validation";
import {
  getStarDraftFingerprint,
  getStarScoreLabel,
  isStarScoreFreshForDraft
} from "@/lib/star";

describe("job workflow validation", () => {
  it("requires a job id", () => {
    expect(validateJobId("")).toBe("Missing job id.");
    expect(validateJobId("job_123")).toBeNull();
  });

  it("requires title and company for manual jobs", () => {
    expect(validateManualJobInput({ title: "", company: "Acme" })).toBe(
      "Job title and company are required."
    );
    expect(validateManualJobInput({ title: "Engineer", company: "" })).toBe(
      "Job title and company are required."
    );
    expect(
      validateManualJobInput({ title: "Engineer", company: "Acme" })
    ).toBeNull();
  });

  it("falls back to other for invalid STAR categories", () => {
    expect(safeStarCategory("leadership")).toBe("leadership");
    expect(safeStarCategory("invalid")).toBe("other");
  });

  it("normalizes and validates AI answers", () => {
    expect(normalizeAiAnswers(["", "  led the rollout  "])).toEqual([
      "led the rollout"
    ]);
    expect(validateAiAnswers(["", " "])).toBe(
      "Answer at least one AI question before creating draft STAR answers."
    );
  });

  it("formats STAR score labels", () => {
    expect(getStarScoreLabel({ score: null, scoreIsStale: false })).toBe(
      "Unscored"
    );
    expect(getStarScoreLabel({ score: 8, scoreIsStale: false })).toBe(
      "Score 8/10"
    );
    expect(getStarScoreLabel({ score: 6, scoreIsStale: true })).toBe(
      "Score 6/10 stale"
    );
  });

  it("detects whether a score still matches a draft", () => {
    const draft = {
      title: "Reduced build time",
      situation: "Builds were slow.",
      task: "Own the migration.",
      actions: "Moved pipelines.",
      result: "Builds were 35% faster."
    };
    const scoreDraftHash = getStarDraftFingerprint(draft);

    expect(
      isStarScoreFreshForDraft(draft, { score: 8, scoreDraftHash })
    ).toBe(true);
    expect(
      isStarScoreFreshForDraft(
        { ...draft, result: "Builds were faster." },
        { score: 8, scoreDraftHash }
      )
    ).toBe(false);
    expect(
      isStarScoreFreshForDraft(draft, { score: null, scoreDraftHash })
    ).toBe(false);
  });
});
