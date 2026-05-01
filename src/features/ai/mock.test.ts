import { describe, expect, it } from "vitest";

import {
  mockJobStarDrafts,
  mockJobStarQuestions,
  mockResumeExtraction,
  mockStarAssist,
  mockStarFeedback,
  mockStarScore
} from "@/features/ai/mock";
import {
  JobStarDraftsOutputSchema,
  JobStarQuestionsOutputSchema,
  ResumeExtractionOutputSchema,
  StarAssistOutputSchema,
  StarFeedbackOutputSchema,
  StarScoreOutputSchema
} from "@/features/ai/schemas";

describe("AI mock outputs", () => {
  it("extracts schema-valid resume STAR drafts", () => {
    const output = mockResumeExtraction({
      resumeText: `
        Senior Product Engineer at Acme Labs
        Led migration that reduced build time by 35% across three teams.
        Partnered with support to cut escalations by 20%.
      `
    });

    expect(() => ResumeExtractionOutputSchema.parse(output)).not.toThrow();
    expect(output.positions[0]?.starAnswers.length).toBeGreaterThan(0);
    expect(output.positions[0]?.starAnswers[0]?.result).toContain("35");
  });

  it("creates schema-valid job-level STAR questions", () => {
    const output = mockJobStarQuestions({
      job: {
        title: "Senior Product Engineer",
        company: "Acme Labs",
        start: "",
        end: ""
      },
      starAnswers: [
        {
          title: "Reduced support escalations",
          category: "collaboration",
          situation: "Worked with support and engineering.",
          task: "",
          actions: "",
          result: "20% reduction"
        }
      ]
    });

    expect(() => JobStarQuestionsOutputSchema.parse(output)).not.toThrow();
    expect(output.questions[0]?.focus).toBeTruthy();
  });

  it("creates schema-valid partial STAR drafts from job answers", () => {
    const output = mockJobStarDrafts({
      job: {
        title: "Senior Product Engineer",
        company: "Acme Labs",
        start: "",
        end: ""
      },
      starAnswers: [],
      questions: [
        {
          question: "What measurable outcome did you create?",
          rationale: "Metrics help.",
          focus: "achievement"
        }
      ],
      answers: [
        {
          question: "What measurable outcome did you create?",
          answer: "I led a migration that reduced build time by 35%.",
          focus: "achievement"
        }
      ]
    });

    expect(() => JobStarDraftsOutputSchema.parse(output)).not.toThrow();
    expect(output.starAnswers[0]?.result).toContain("35%");
    expect(output.starAnswers[0]?.task).toBe("");
  });

  it("assists a STAR response from job context and current draft", () => {
    const output = mockStarAssist({
      mode: "generate",
      scope: "all",
      job: {
        title: "Senior Product Engineer",
        company: "Acme Labs",
        start: "",
        end: ""
      },
      draft: {
        category: "achievement",
        title: "Reduced build time",
        situation: "",
        task: "",
        actions: "",
        result: ""
      }
    });

    expect(() => StarAssistOutputSchema.parse(output)).not.toThrow();
    expect(output.situation).toContain("Acme Labs");
  });

  it("creates schema-valid section feedback for a STAR response", () => {
    const output = mockStarFeedback({
      job: {
        title: "Senior Product Engineer",
        company: "Acme Labs",
        start: "",
        end: ""
      },
      draft: {
        category: "achievement",
        title: "Reduced build time",
        situation: "Builds were slow across several product teams.",
        task: "I owned the migration plan.",
        actions:
          "I profiled the slowest jobs, removed duplicate work, and coordinated rollout.",
        result: "Builds became 35% faster."
      }
    });

    expect(() => StarFeedbackOutputSchema.parse(output)).not.toThrow();
    expect(output.situation).toContain("stakes");
    expect(output.result).toContain("impact");
  });

  it("scores a STAR response deterministically", () => {
    const output = mockStarScore({
      draft: {
        category: "achievement",
        title: "Reduced build time",
        situation: "Builds were slow across several product teams.",
        task: "I owned the migration plan.",
        actions:
          "I profiled the slowest jobs, removed duplicate steps, moved shared setup into cached layers, and coordinated rollout with team leads.",
        result:
          "Builds became 35% faster, which helped engineers ship changes with less waiting."
      }
    });

    expect(() => StarScoreOutputSchema.parse(output)).not.toThrow();
    expect(output.score).toBeGreaterThanOrEqual(7);
    expect(output.rationale).toContain("measurable");
  });
});
