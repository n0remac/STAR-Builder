import type { NarrativeThemeExtractionOutput } from "@/features/ai/schemas";

export type NarrativeGenerationState = {
  error?: string;
};

export const initialNarrativeGenerationState: NarrativeGenerationState = {};

export type NarrativeThemeExtractionState = {
  error?: string;
  scope?: "career" | "job";
  positionId?: string;
  output?: NarrativeThemeExtractionOutput;
};

export const initialNarrativeThemeExtractionState: NarrativeThemeExtractionState = {};
