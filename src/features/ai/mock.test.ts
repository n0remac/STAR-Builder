import { describe, expect, it } from "vitest";

import {
  mockCareerNarrative,
  mockCareerNarrativeFeedback,
  mockCareerNarrativeScore,
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
  NarrativeFeedbackOutputSchema,
  NarrativeOutputSchema,
  NarrativeScoreOutputSchema,
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

  it("creates schema-valid career narrative output with cited sources", () => {
    const output = mockCareerNarrative({
      scope: "career",
      theme: "leadership",
      jobs: [
        {
          job: {
            title: "Senior Product Engineer",
            company: "Acme Labs",
            start: "",
            end: ""
          },
          stories: [
            {
              id: "star_1",
              category: "leadership",
              title: "Led build migration",
              situation: "Builds were slow.",
              task: "I owned the migration.",
              actions: "I aligned teams and migrated pipelines.",
              result: "Builds became 35% faster.",
              score: 8
            }
          ]
        }
      ]
    });

    expect(() => NarrativeOutputSchema.parse(output)).not.toThrow();
    expect(output.citedSourceIds).toContain("star_1");
  });

  it("creates schema-valid job narrative output", () => {
    const output = mockCareerNarrative({
      scope: "job",
      theme: "technical_depth",
      job: {
        title: "Staff Engineer",
        company: "Beta Co",
        start: "",
        end: ""
      },
      jobs: [
        {
          job: {
            title: "Staff Engineer",
            company: "Beta Co",
            start: "",
            end: ""
          },
          stories: [
            {
              id: "star_2",
              category: "achievement",
              title: "Rebuilt data sync",
              situation: "Sync jobs failed often.",
              task: "I owned reliability.",
              actions: "I redesigned retries and observability.",
              result: "Failures dropped by 40%.",
              score: 7
            }
          ]
        }
      ]
    });

    expect(() => NarrativeOutputSchema.parse(output)).not.toThrow();
    expect(output.positioning).toContain("Staff Engineer");
    expect(output.citedSourceIds).toEqual(["star_2"]);
  });

  it("scores and gives feedback for a narrative", () => {
    const draft = {
      title: "Impact narrative",
      positioning:
        "My narrative centers on impact through measurable engineering work.",
      fullNarrative:
        "Across my roles, I have repeatedly found ambiguous technical problems, clarified the path forward, and delivered improvements that teams could measure. I use STAR stories to connect that pattern to concrete outcomes.",
      shortVersion:
        "I turn ambiguous engineering problems into measurable product and team outcomes.",
      interviewGuidance:
        "Lead with the positioning statement, then move into the clearest STAR story and close with the result before offering a second proof point."
    };
    const score = mockCareerNarrativeScore({
      scope: "career",
      theme: "impact",
      draft
    });
    const feedback = mockCareerNarrativeFeedback({
      scope: "career",
      theme: "impact",
      draft
    });

    expect(() => NarrativeScoreOutputSchema.parse(score)).not.toThrow();
    expect(score.score).toBeGreaterThanOrEqual(1);
    expect(score.score).toBeLessThanOrEqual(10);
    expect(() => NarrativeFeedbackOutputSchema.parse(feedback)).not.toThrow();
  });
});
