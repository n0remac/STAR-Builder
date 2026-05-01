import type { ResumeExtractionOutput } from "@/features/ai/schemas";

export type ResumeExtractionState = {
  resumeText: string;
  source: string;
  extraction?: ResumeExtractionOutput;
  error?: string;
};

export const initialResumeExtractionState: ResumeExtractionState = {
  resumeText: "",
  source: "paste"
};
