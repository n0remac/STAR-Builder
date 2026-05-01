"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { starScore } from "@/features/ai";
import type { StarDraft } from "@/features/ai/schemas";
import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/default-user";
import { formString } from "@/lib/form";
import { normalizeTextareaText } from "@/lib/normalization";
import {
  getStarDraftFingerprint,
  isStarScoreFreshForDraft,
  safeStarCategory
} from "@/lib/star";
import { generateStarFeedbackFields } from "@/lib/star-feedback";

function draftFromFormData(formData: FormData): StarDraft {
  return {
    category: safeStarCategory(formString(formData, "category")),
    title: formString(formData, "title"),
    situation: normalizeTextareaText(formString(formData, "situation")),
    task: normalizeTextareaText(formString(formData, "task")),
    actions: normalizeTextareaText(formString(formData, "actions")),
    result: normalizeTextareaText(formString(formData, "result"))
  };
}

function scoreStateFromFormData(formData: FormData) {
  const rawScore = Number(formString(formData, "score"));
  const score = Number.isInteger(rawScore) && rawScore >= 1 && rawScore <= 10
    ? rawScore
    : null;

  return {
    score,
    scoreRationale: normalizeTextareaText(formString(formData, "scoreRationale")),
    scoreIsStale: formString(formData, "scoreIsStale") === "true",
    scoreDraftHash: formString(formData, "scoreDraftHash")
  };
}

async function scoreDraft(draft: StarDraft) {
  const output = await starScore({ draft });

  return {
    score: output.score,
    scoreRationale: output.rationale,
    scoreIsStale: false,
    scoreDraftHash: getStarDraftFingerprint(draft)
  };
}

async function findUserAnswer(answerId: string) {
  const user = await getDefaultUser();

  return prisma.starResponse.findFirst({
    where: {
      id: answerId,
      userId: user.id
    },
    include: {
      position: true
    }
  });
}

export async function updateStarAnswerAction(formData: FormData) {
  const id = formString(formData, "id");
  const draft = draftFromFormData(formData);
  const currentScore = scoreStateFromFormData(formData);

  if (!id || !draft.title.trim()) {
    throw new Error("STAR answer id and title are required.");
  }

  const answer = await findUserAnswer(id);

  if (!answer) {
    throw new Error("STAR answer not found.");
  }

  const scoreMatchesDraft = isStarScoreFreshForDraft(draft, currentScore);

  await prisma.starResponse.update({
    where: { id },
    data: {
      ...draft,
      score: currentScore.score,
      scoreRationale: currentScore.score === null ? "" : currentScore.scoreRationale,
      scoreIsStale: currentScore.score === null ? false : !scoreMatchesDraft,
      scoreDraftHash: currentScore.score === null ? null : currentScore.scoreDraftHash,
      scoredAt:
        currentScore.score === null
          ? null
          : scoreMatchesDraft
            ? new Date()
            : answer.scoredAt
    }
  });

  revalidatePath(`/answers/${id}`);
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${answer.positionId}`);
  redirect(`/answers/${id}`);
}

export async function requestStarFeedbackAction(formData: FormData) {
  const id = formString(formData, "id");
  const draft = draftFromFormData(formData);
  const currentScore = scoreStateFromFormData(formData);

  if (!id || !draft.title.trim()) {
    throw new Error("STAR answer id and title are required.");
  }

  const answer = await findUserAnswer(id);

  if (!answer) {
    throw new Error("STAR answer not found.");
  }

  const scoreMatchesDraft = isStarScoreFreshForDraft(draft, currentScore);
  const feedback = await generateStarFeedbackFields({
    draft,
    job: {
      title: answer.position.title,
      company: answer.position.company,
      start: answer.position.start ?? "",
      end: answer.position.end ?? ""
    }
  });

  await prisma.starResponse.update({
    where: { id },
    data: {
      ...draft,
      ...feedback,
      score: currentScore.score,
      scoreRationale: currentScore.score === null ? "" : currentScore.scoreRationale,
      scoreIsStale: currentScore.score === null ? false : !scoreMatchesDraft,
      scoreDraftHash: currentScore.score === null ? null : currentScore.scoreDraftHash,
      scoredAt:
        currentScore.score === null
          ? null
          : scoreMatchesDraft
            ? new Date()
            : answer.scoredAt
    }
  });

  revalidatePath(`/answers/${id}`);
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${answer.positionId}`);
  redirect(`/answers/${id}`);
}

export async function regenerateStarScoreAction(formData: FormData) {
  const id = formString(formData, "id");
  const draft = draftFromFormData(formData);

  if (!id || !draft.title.trim()) {
    throw new Error("STAR answer id and title are required.");
  }

  const answer = await findUserAnswer(id);

  if (!answer) {
    throw new Error("STAR answer not found.");
  }

  const score = await scoreDraft(draft);

  await prisma.starResponse.update({
    where: { id },
    data: {
      ...draft,
      score: score.score,
      scoreRationale: score.scoreRationale,
      scoredAt: new Date(),
      scoreIsStale: false,
      scoreDraftHash: score.scoreDraftHash
    }
  });

  revalidatePath(`/answers/${id}`);
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${answer.positionId}`);
  redirect(`/answers/${id}`);
}
