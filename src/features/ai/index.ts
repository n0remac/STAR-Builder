import "server-only";

import {
  type JobStarDraftsInput,
  JobStarDraftsInputSchema,
  JobStarDraftsOutputSchema,
  type JobStarQuestionsInput,
  JobStarQuestionsInputSchema,
  JobStarQuestionsOutputSchema,
  type ResumeExtractionInput,
  ResumeExtractionInputSchema,
  ResumeExtractionOutputSchema,
  type StarAssistInput,
  StarAssistInputSchema,
  StarAssistOutputSchema,
  type StarFeedbackInput,
  StarFeedbackInputSchema,
  StarFeedbackOutputSchema,
  type StarScoreInput,
  StarScoreInputSchema,
  StarScoreOutputSchema
} from "@/features/ai/schemas";
import {
  mockJobStarDrafts,
  mockJobStarQuestions,
  mockResumeExtraction,
  mockStarAssist,
  mockStarFeedback,
  mockStarScore
} from "@/features/ai/mock";
import { hasOpenAIConfig, parseStructuredResponse } from "@/features/ai/openai";

export async function resumeExtraction(input: ResumeExtractionInput) {
  const parsed = ResumeExtractionInputSchema.parse(input);

  if (!hasOpenAIConfig()) {
    return mockResumeExtraction(parsed);
  }

  return parseStructuredResponse({
    name: "resume_extraction",
    schema: ResumeExtractionOutputSchema,
    system:
      "Extract resume content into positions and concise job-linked STAR answer drafts. Return only facts supported by the resume text. Leave STAR sections empty when facts are not present.",
    user: parsed
  });
}

export async function jobStarQuestions(input: JobStarQuestionsInput) {
  const parsed = JobStarQuestionsInputSchema.parse(input);

  if (!hasOpenAIConfig()) {
    return mockJobStarQuestions(parsed);
  }

  return parseStructuredResponse({
    name: "job_star_questions",
    schema: JobStarQuestionsOutputSchema,
    system:
      "Generate directed questions that help a user discover additional STAR answers for one job. Use existing STAR drafts to avoid duplicates and look for gaps across impact, leadership, collaboration, ambiguity, conflict, technical depth, and measurable outcomes.",
    user: parsed
  });
}

export async function jobStarDrafts(input: JobStarDraftsInput) {
  const parsed = JobStarDraftsInputSchema.parse(input);

  if (!hasOpenAIConfig()) {
    return mockJobStarDrafts(parsed);
  }

  return parseStructuredResponse({
    name: "job_star_drafts",
    schema: JobStarDraftsOutputSchema,
    system:
      "Turn the user's answers about one job into concise partial STAR answers. Keep every draft grounded in the answers and existing job context. Leave any missing STAR sections empty instead of inventing facts.",
    user: parsed
  });
}

export async function starAssist(input: StarAssistInput) {
  const parsed = StarAssistInputSchema.parse(input);

  if (!hasOpenAIConfig()) {
    return mockStarAssist(parsed);
  }

  return parseStructuredResponse({
    name: "star_assist",
    schema: StarAssistOutputSchema,
    system:
      "Help a user draft a job-linked STAR interview answer. For generate, fill missing sections from the current draft and job context without inventing unsupported facts. For rewrite, improve the requested section or entire draft. Always return the full draft object.",
    user: parsed
  });
}

export async function starFeedback(input: StarFeedbackInput) {
  const parsed = StarFeedbackInputSchema.parse(input);

  if (!hasOpenAIConfig()) {
    return mockStarFeedback(parsed);
  }

  return parseStructuredResponse({
    name: "star_feedback",
    schema: StarFeedbackOutputSchema,
    system:
      "Give concise, actionable guidance for a job-linked STAR interview answer. Consider the whole answer and job context, but return guidance split into Situation, Task, Actions, and Result. Do not rewrite the answer. Focus each section on what would make that section stronger, more specific, and more interview-ready.",
    user: parsed
  });
}

export async function starScore(input: StarScoreInput) {
  const parsed = StarScoreInputSchema.parse(input);

  if (!hasOpenAIConfig()) {
    return mockStarScore(parsed);
  }

  return parseStructuredResponse({
    name: "star_score",
    schema: StarScoreOutputSchema,
    system:
      "Score this STAR interview answer from 1 to 10. Evaluate section length, completeness, specificity, personal ownership, action clarity, and STAR structure. Weight the Result heavily: high scores require a meaningful outcome, preferably a metric or clear before-and-after impact. The Task should be clearly described but should usually be shorter than Actions and Result. Penalize vague, generic, missing, or unsupported sections. Return only the score and a short rationale.",
    user: parsed
  });
}
