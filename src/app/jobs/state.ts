import type { JobStarQuestionsOutput } from "@/features/ai/schemas";

export type JobQuestionsState = {
  jobId?: string;
  output?: JobStarQuestionsOutput;
  error?: string;
};

export const initialJobQuestionsState: JobQuestionsState = {};
