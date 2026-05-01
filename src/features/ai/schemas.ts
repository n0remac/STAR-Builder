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
