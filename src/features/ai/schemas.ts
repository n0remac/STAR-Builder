import { z } from "zod";

export const StarCategorySchema = z.enum([
  "achievement",
  "challenge",
  "collaboration",
  "leadership",
  "other"
]);

export const StarDraftSchema = z.object({
  category: StarCategorySchema.default("achievement"),
  title: z.string().min(1),
  situation: z.string().default(""),
  task: z.string().default(""),
  actions: z.string().default(""),
  result: z.string().default("")
});

export const ResumeExtractionInputSchema = z.object({
  resumeText: z.string().min(20, "Paste at least a few resume lines.")
});

export const ResumeExtractionOutputSchema = z.object({
  positions: z
    .array(
      z.object({
        title: z.string().min(1),
        company: z.string().min(1),
        start: z.string().default(""),
        end: z.string().default(""),
        starAnswers: z.array(StarDraftSchema).min(1)
      })
    )
    .min(1)
});

export const JobContextSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  start: z.string().default(""),
  end: z.string().default("")
});

export const JobStarContextSchema = StarDraftSchema;

export const JobStarQuestionsInputSchema = z.object({
  job: JobContextSchema,
  starAnswers: z.array(JobStarContextSchema).default([])
});

export const JobStarQuestionSchema = z.object({
  question: z.string().min(1),
  rationale: z.string().default(""),
  focus: z.string().default("")
});

export const JobStarQuestionsOutputSchema = z.object({
  questions: z.array(JobStarQuestionSchema).min(1)
});

export const JobStarDraftsInputSchema = z.object({
  job: JobContextSchema,
  starAnswers: z.array(JobStarContextSchema).default([]),
  questions: z.array(JobStarQuestionSchema).min(1),
  answers: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
        focus: z.string().default("")
      })
    )
    .min(1)
});

export const JobStarDraftsOutputSchema = z.object({
  starAnswers: z.array(StarDraftSchema).min(1).max(5)
});

export const StarAssistInputSchema = z.object({
  mode: z.enum(["generate", "rewrite"]),
  scope: z.enum([
    "all",
    "title",
    "situation",
    "task",
    "actions",
    "result"
  ]),
  job: JobContextSchema,
  draft: StarDraftSchema.partial().extend({
    category: StarCategorySchema.default("achievement"),
    title: z.string().default(""),
    situation: z.string().default(""),
    task: z.string().default(""),
    actions: z.string().default(""),
    result: z.string().default("")
  })
});

export const StarAssistOutputSchema = StarDraftSchema;

export const StarFeedbackSchema = z.object({
  situation: z.string().default(""),
  task: z.string().default(""),
  actions: z.string().default(""),
  result: z.string().default("")
});

export const StarFeedbackInputSchema = z.object({
  job: JobContextSchema,
  draft: StarDraftSchema
});

export const StarFeedbackOutputSchema = StarFeedbackSchema;

export const StarScoreInputSchema = z.object({
  draft: StarDraftSchema
});

export const StarScoreOutputSchema = z.object({
  score: z.number().int().min(1).max(10),
  rationale: z.string().min(1)
});

export const NarrativeScopeSchema = z.enum(["career", "job"]);

export const NarrativeThemeSchema = z.enum([
  "leadership",
  "ownership",
  "ambiguity",
  "technical_depth",
  "collaboration",
  "impact"
]).or(z.string().trim().min(1).max(80));

export const NarrativeStorySchema = StarDraftSchema.extend({
  id: z.string().min(1),
  score: z.number().int().min(1).max(10).nullable().default(null)
});

export const NarrativeJobStoriesSchema = z.object({
  job: JobContextSchema,
  stories: z.array(NarrativeStorySchema).min(1)
});

export const NarrativeInputSchema = z.object({
  scope: NarrativeScopeSchema,
  theme: NarrativeThemeSchema,
  job: JobContextSchema.optional(),
  jobs: z.array(NarrativeJobStoriesSchema).min(1)
});

export const NarrativeOutputSchema = z.object({
  title: z.string().min(1),
  positioning: z.string().min(1),
  fullNarrative: z.string().min(1),
  shortVersion: z.string().min(1),
  interviewGuidance: z.string().min(1),
  citedSourceIds: z.array(z.string().min(1)).min(1)
});

export const NarrativeThemeSuggestionSchema = z.object({
  theme: z.string().trim().min(1).max(80),
  rationale: z.string().min(1),
  citedSourceIds: z.array(z.string().min(1)).min(1)
});

export const NarrativeThemeExtractionInputSchema = NarrativeInputSchema.omit({
  theme: true
});

export const NarrativeThemeExtractionOutputSchema = z.object({
  themes: z.array(NarrativeThemeSuggestionSchema).length(3)
});

export const NarrativeDraftSchema = z.object({
  title: z.string().min(1),
  positioning: z.string().default(""),
  fullNarrative: z.string().min(1),
  shortVersion: z.string().default(""),
  interviewGuidance: z.string().default("")
});

export const NarrativeScoreInputSchema = z.object({
  scope: NarrativeScopeSchema,
  theme: NarrativeThemeSchema,
  draft: NarrativeDraftSchema
});

export const NarrativeScoreOutputSchema = z.object({
  score: z.number().int().min(1).max(10),
  rationale: z.string().min(1)
});

export const NarrativeFeedbackInputSchema = z.object({
  scope: NarrativeScopeSchema,
  theme: NarrativeThemeSchema,
  draft: NarrativeDraftSchema
});

export const NarrativeFeedbackOutputSchema = z.object({
  feedback: z.string().min(1)
});

export type ResumeExtractionInput = z.infer<typeof ResumeExtractionInputSchema>;
export type ResumeExtractionOutput = z.infer<
  typeof ResumeExtractionOutputSchema
>;
export type StarDraft = z.infer<typeof StarDraftSchema>;
export type JobContext = z.infer<typeof JobContextSchema>;
export type JobStarQuestionsInput = z.infer<typeof JobStarQuestionsInputSchema>;
export type JobStarQuestionsOutput = z.infer<
  typeof JobStarQuestionsOutputSchema
>;
export type JobStarDraftsInput = z.infer<typeof JobStarDraftsInputSchema>;
export type JobStarDraftsOutput = z.infer<typeof JobStarDraftsOutputSchema>;
export type StarAssistInput = z.infer<typeof StarAssistInputSchema>;
export type StarAssistOutput = z.infer<typeof StarAssistOutputSchema>;
export type StarFeedback = z.infer<typeof StarFeedbackSchema>;
export type StarFeedbackInput = z.infer<typeof StarFeedbackInputSchema>;
export type StarFeedbackOutput = z.infer<typeof StarFeedbackOutputSchema>;
export type StarScoreInput = z.infer<typeof StarScoreInputSchema>;
export type StarScoreOutput = z.infer<typeof StarScoreOutputSchema>;
export type NarrativeScope = z.infer<typeof NarrativeScopeSchema>;
export type NarrativeTheme = z.infer<typeof NarrativeThemeSchema>;
export type NarrativeStory = z.infer<typeof NarrativeStorySchema>;
export type NarrativeJobStories = z.infer<typeof NarrativeJobStoriesSchema>;
export type NarrativeInput = z.infer<typeof NarrativeInputSchema>;
export type NarrativeOutput = z.infer<typeof NarrativeOutputSchema>;
export type NarrativeThemeSuggestion = z.infer<
  typeof NarrativeThemeSuggestionSchema
>;
export type NarrativeThemeExtractionInput = z.infer<
  typeof NarrativeThemeExtractionInputSchema
>;
export type NarrativeThemeExtractionOutput = z.infer<
  typeof NarrativeThemeExtractionOutputSchema
>;
export type NarrativeDraft = z.infer<typeof NarrativeDraftSchema>;
export type NarrativeScoreInput = z.infer<typeof NarrativeScoreInputSchema>;
export type NarrativeScoreOutput = z.infer<typeof NarrativeScoreOutputSchema>;
export type NarrativeFeedbackInput = z.infer<
  typeof NarrativeFeedbackInputSchema
>;
export type NarrativeFeedbackOutput = z.infer<
  typeof NarrativeFeedbackOutputSchema
>;
