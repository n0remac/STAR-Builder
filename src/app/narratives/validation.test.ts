import { describe, expect, it } from "vitest";

import {
  resolveNarrativeTheme,
  validateNarrativeGeneration,
  validateTargetJobNarrativeInput,
  validateTargetJobSourceOwnership
} from "@/app/narratives/validation";

describe("narrative validation", () => {
  it("rejects target job generation through the legacy generator", () => {
    expect(
      validateNarrativeGeneration({ scope: "target_job", positionId: "" })
    ).toBe("Use the target job form to generate a job-fit narrative.");
  });

  it("requires target job narrative fields", () => {
    expect(
      validateTargetJobNarrativeInput({
        title: "",
        company: "Acme Labs",
        description: "A detailed enough target job description.",
        theme: "impact",
        sourceIds: ["star_1"]
      })
    ).toBe("Target job title and company are required.");

    expect(
      validateTargetJobNarrativeInput({
        title: "Staff Engineer",
        company: "Acme Labs",
        description: "Too short",
        theme: "impact",
        sourceIds: ["star_1"]
      })
    ).toBe("Paste at least a few lines from the target job description.");

    expect(
      validateTargetJobNarrativeInput({
        title: "Staff Engineer",
        company: "Acme Labs",
        description: "A detailed enough target job description.",
        theme: "",
        sourceIds: ["star_1"]
      })
    ).toBe("Choose or enter a narrative theme.");

    expect(
      validateTargetJobNarrativeInput({
        title: "Staff Engineer",
        company: "Acme Labs",
        description: "A detailed enough target job description.",
        theme: "impact",
        sourceIds: []
      })
    ).toBe("Select at least one STAR answer for this target job narrative.");
  });

  it("rejects selected STAR answers that are not found for the user", () => {
    expect(
      validateTargetJobSourceOwnership({
        requestedSourceIds: ["star_1", "star_2"],
        foundSourceIds: ["star_1"]
      })
    ).toBe("One or more selected STAR answers could not be found.");

    expect(
      validateTargetJobSourceOwnership({
        requestedSourceIds: ["star_1"],
        foundSourceIds: ["star_1"]
      })
    ).toBeNull();
  });

  it("uses custom themes before preset themes and falls back to presets", () => {
    expect(
      resolveNarrativeTheme({
        manualTheme: "  platform reliability  ",
        presetTheme: "impact"
      })
    ).toBe("platform reliability");

    expect(
      resolveNarrativeTheme({
        manualTheme: "",
        presetTheme: "leadership"
      })
    ).toBe("leadership");
  });
});
