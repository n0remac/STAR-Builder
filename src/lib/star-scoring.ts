import "server-only";

import { starScore } from "@/features/ai";
import type { JobContext, StarDraft } from "@/features/ai/schemas";
import { freshStarScoreState } from "@/lib/star";
import { generateStarFeedbackFields } from "@/lib/star-feedback";

export async function scoredStarResponseFields({
  draft,
  job
}: {
  draft: StarDraft;
  job: JobContext;
}) {
  const [score, feedback] = await Promise.all([
    starScore({ draft }),
    generateStarFeedbackFields({ draft, job })
  ]);

  return {
    category: draft.category,
    title: draft.title,
    situation: draft.situation,
    task: draft.task,
    actions: draft.actions,
    result: draft.result,
    ...feedback,
    ...freshStarScoreState(draft, score)
  };
}
