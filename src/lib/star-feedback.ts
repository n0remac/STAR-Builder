import "server-only";

import { starFeedback } from "@/features/ai";
import type {
  JobContext,
  StarDraft,
  StarFeedbackOutput
} from "@/features/ai/schemas";

export function starFeedbackFields(feedback: StarFeedbackOutput) {
  return {
    situationFeedback: feedback.situation,
    taskFeedback: feedback.task,
    actionsFeedback: feedback.actions,
    resultFeedback: feedback.result
  };
}

export async function generateStarFeedbackFields({
  draft,
  job
}: {
  draft: StarDraft;
  job: JobContext;
}) {
  return starFeedbackFields(await starFeedback({ draft, job }));
}
