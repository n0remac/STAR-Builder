import "server-only";

import {
  type JobStarDraftsInput,
  JobStarDraftsInputSchema,
  JobStarDraftsOutputSchema,
  type JobStarQuestionsInput,
  JobStarQuestionsInputSchema,
  JobStarQuestionsOutputSchema,
  type NarrativeFeedbackInput,
  NarrativeFeedbackInputSchema,
  NarrativeFeedbackOutputSchema,
  type NarrativeInput,
  NarrativeInputSchema,
  NarrativeOutputSchema,
  type NarrativeScoreInput,
  NarrativeScoreInputSchema,
  NarrativeScoreOutputSchema,
  type NarrativeThemeExtractionInput,
  NarrativeThemeExtractionInputSchema,
  NarrativeThemeExtractionOutputSchema,
  type ProfileMetaNarrativeInput,
  ProfileMetaNarrativeInputSchema,
  ProfileMetaNarrativeOutputSchema,
  type ProfileSummaryInput,
  ProfileSummaryInputSchema,
  ProfileSummaryOutputSchema,
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
  mockCareerNarrative,
  mockCareerNarrativeFeedback,
  mockCareerNarrativeScore,
  mockNarrativeThemeExtraction,
  mockProfileMetaNarrative,
  mockProfileSummary,
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

export async function careerNarrative(input: NarrativeInput) {
  const parsed = NarrativeInputSchema.parse(input);

  if (!hasOpenAIConfig()) {
    return mockCareerNarrative(parsed);
  }

  return parseStructuredResponse({
    name: "career_narrative",
    schema: NarrativeOutputSchema,
    system:
      "Construct an interview-ready narrative from the supplied STAR answers. When targetJob is provided, tailor the narrative to that target role and job description while keeping every claim grounded in the source stories. Cite only supplied STAR response ids, emphasize the selected theme, and do not invent employers, titles, metrics, outcomes, or facts. Return a concise positioning statement, a fuller narrative, a short version, interview delivery guidance, and cited source ids.",
    user: parsed
  });
}

export async function narrativeThemeExtraction(
  input: NarrativeThemeExtractionInput
) {
  const parsed = NarrativeThemeExtractionInputSchema.parse(input);

  if (!hasOpenAIConfig()) {
    return mockNarrativeThemeExtraction(parsed);
  }

  return parseStructuredResponse({
    name: "narrative_theme_extraction",
    schema: NarrativeThemeExtractionOutputSchema,
    system:
      "Extract exactly three interview narrative themes from the supplied STAR answers. Themes should be specific, useful for interview positioning, grounded in the source stories, and distinct from each other. Cite only supplied STAR response ids and do not invent facts.",
    user: parsed
  });
}

export async function careerNarrativeScore(input: NarrativeScoreInput) {
  const parsed = NarrativeScoreInputSchema.parse(input);

  if (!hasOpenAIConfig()) {
    return mockCareerNarrativeScore(parsed);
  }

  return parseStructuredResponse({
    name: "career_narrative_score",
    schema: NarrativeScoreOutputSchema,
    system:
      "Score this interview narrative from 1 to 10. Evaluate clarity of theme, specificity, evidence-backed positioning, usefulness of the short version, practicality of interview delivery guidance, and fit to the target job when provided. Return only the score and a short rationale.",
    user: parsed
  });
}

export async function careerNarrativeFeedback(input: NarrativeFeedbackInput) {
  const parsed = NarrativeFeedbackInputSchema.parse(input);

  if (!hasOpenAIConfig()) {
    return mockCareerNarrativeFeedback(parsed);
  }

  return parseStructuredResponse({
    name: "career_narrative_feedback",
    schema: NarrativeFeedbackOutputSchema,
    system:
      "Give concise, actionable feedback for improving this interview narrative. Focus on evidence, theme clarity, delivery, role fit when target job context is provided, and gaps. Do not rewrite the narrative.",
    user: parsed
  });
}

export async function profileSummary(input: ProfileSummaryInput) {
  const parsed = ProfileSummaryInputSchema.parse(input);

  if (!hasOpenAIConfig()) {
    return mockProfileSummary(parsed);
  }

  return parseStructuredResponse({
    name: "profile_summary",
    schema: ProfileSummaryOutputSchema,
    system:
      "Write a concise public engineer profile summary from the supplied saved narratives. Synthesize a coherent throughline across the narratives, emphasize engineering strengths and evidence-backed impact, and avoid inventing employers, metrics, skills, or claims not supported by the input. Return only the summary.",
    user: parsed
  });
}

export async function profileMetaNarrative(input: ProfileMetaNarrativeInput) {
  const parsed = ProfileMetaNarrativeInputSchema.parse(input);

  if (!hasOpenAIConfig()) {
    return mockProfileMetaNarrative(parsed);
  }

  return parseStructuredResponse({
    name: "profile_meta_narrative",
    schema: ProfileMetaNarrativeOutputSchema,
    system:
      "Write a broad public career meta narrative for an engineer from the supplied profile, resume text, jobs, STAR answers, target job descriptions, and saved narratives. Synthesize recurring themes across the whole career instead of listing facts. Every linked segment must cite only one supplied id and use the matching reference type: answer, job, or narrative. Do not invent employers, metrics, skills, links, ids, or claims not supported by the input.",
    user: parsed
  });
}
