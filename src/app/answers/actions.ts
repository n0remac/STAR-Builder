"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { starScore } from "@/features/ai";
import type { StarDraft } from "@/features/ai/schemas";
import { requireCurrentUserForAction } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { formString } from "@/lib/form";
import { normalizeTextareaText } from "@/lib/normalization";
import {
  freshStarScoreState,
  safeStarCategory,
  scoreStateForStarDraft
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

async function scoreDraft(draft: StarDraft) {
  const output = await starScore({ draft });

  return freshStarScoreState(draft, output);
}

async function findUserAnswer(answerId: string) {
  const user = await requireCurrentUserForAction();

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

  if (!id || !draft.title.trim()) {
    throw new Error("STAR answer id and title are required.");
  }

  const answer = await findUserAnswer(id);

  if (!answer) {
    throw new Error("STAR answer not found.");
  }

  const scoreState = scoreStateForStarDraft(draft, answer);

  await prisma.starResponse.update({
    where: { id },
    data: {
      ...draft,
      ...scoreState
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

  if (!id || !draft.title.trim()) {
    throw new Error("STAR answer id and title are required.");
  }

  const answer = await findUserAnswer(id);

  if (!answer) {
    throw new Error("STAR answer not found.");
  }

  const scoreState = scoreStateForStarDraft(draft, answer);
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
      ...scoreState
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
      ...score
    }
  });

  revalidatePath(`/answers/${id}`);
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${answer.positionId}`);
  redirect(`/answers/${id}`);
}
