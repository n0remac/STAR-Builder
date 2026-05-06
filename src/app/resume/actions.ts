"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { resumeExtraction } from "@/features/ai";
import { ResumeExtractionOutputSchema } from "@/features/ai/schemas";
import type { ResumeExtractionState } from "@/app/resume/state";
import { requireCurrentUserForAction } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { formString, parseJsonField } from "@/lib/form";
import { normalizeTextareaText } from "@/lib/normalization";
import { scoredStarResponseFields } from "@/lib/star-scoring";

export async function extractResumeAction(
  _previousState: ResumeExtractionState,
  formData: FormData
): Promise<ResumeExtractionState> {
  const resumeText = normalizeTextareaText(formString(formData, "resumeText"));
  const source = formString(formData, "source", "paste") || "paste";

  if (resumeText.length < 20) {
    return {
      resumeText,
      source,
      error: "Paste at least a few resume lines before extracting."
    };
  }

  try {
    const extraction = await resumeExtraction({ resumeText });
    return {
      resumeText,
      source,
      extraction
    };
  } catch (error) {
    return {
      resumeText,
      source,
      error:
        error instanceof Error
          ? error.message
          : "Resume extraction failed. Try again with more resume detail."
    };
  }
}

export async function saveExtractionAction(formData: FormData) {
  const resumeText = normalizeTextareaText(formString(formData, "resumeText"));
  const source = formString(formData, "source", "paste") || "paste";
  const extraction = parseJsonField(formData, "extraction", (value) =>
    ResumeExtractionOutputSchema.parse(value)
  );

  if (!resumeText || extraction.positions.length === 0) {
    throw new Error("Cannot save an empty extraction.");
  }

  const user = await requireCurrentUserForAction();
  const scoredPositions = await Promise.all(
    extraction.positions.map(async (position) => ({
      ...position,
      starAnswers: await Promise.all(
        position.starAnswers.map((answer) =>
          scoredStarResponseFields({
            draft: answer,
            job: {
              title: position.title,
              company: position.company,
              start: position.start,
              end: position.end
            }
          })
        )
      )
    }))
  );

  await prisma.resume.create({
    data: {
      userId: user.id,
      text: resumeText,
      source,
      positions: {
        create: scoredPositions.map((position) => ({
          title: position.title,
          company: position.company,
          start: position.start,
          end: position.end,
          starResponses: {
            create: position.starAnswers.map((answer) => ({
              userId: user.id,
              ...answer
            }))
          }
        }))
      }
    }
  });

  revalidatePath("/jobs");
  revalidatePath("/resume");
  redirect("/jobs");
}
