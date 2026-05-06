import type { StarDraft, StarFeedback } from "@/features/ai/schemas";

export type StarAnswerEditorState = {
  draft: StarDraft;
  feedback: StarFeedback;
  score: number | null;
  scoreRationale: string;
  scoreIsStale: boolean;
};
