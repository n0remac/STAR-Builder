"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { JobQuestionsState } from "@/app/jobs/state";
import {
  normalizeAiAnswers,
  safeStarCategory,
  validateAiAnswers,
  validateJobId,
  validateManualJobInput,
  validateManualStarInput
} from "@/app/jobs/validation";
import { jobStarDrafts, jobStarQuestions, starScore } from "@/features/ai";
import {
  JobStarQuestionsOutputSchema,
  type StarDraft
} from "@/features/ai/schemas";
import { prisma } from "@/lib/db";
import { getDefaultUser, getManualResume } from "@/lib/default-user";
import { formString, parseJsonField } from "@/lib/form";
import { normalizeTextareaText } from "@/lib/normalization";
import { getStarDraftFingerprint } from "@/lib/star";
import { generateStarFeedbackFields } from "@/lib/star-feedback";

async function findUserJob(jobId: string) {
  const user = await getDefaultUser();

  return prisma.position.findFirst({
    where: {
      id: jobId,
      resume: {
        userId: user.id
      }
    },
    include: {
      starResponses: {
        orderBy: {
          updatedAt: "desc"
        }
      }
    }
  });
}

function jobAiInput(job: NonNullable<Awaited<ReturnType<typeof findUserJob>>>) {
  return {
    job: {
      title: job.title,
      company: job.company,
      start: job.start ?? "",
      end: job.end ?? ""
    },
    starAnswers: job.starResponses.map((answer) => ({
      title: answer.title,
      category: answer.category,
      situation: answer.situation,
      task: answer.task,
      actions: answer.actions,
      result: answer.result
    }))
  };
}

async function scoredStarData({
  answer,
  job
}: {
  answer: StarDraft;
  job: NonNullable<Awaited<ReturnType<typeof findUserJob>>>;
}) {
  const [score, feedback] = await Promise.all([
    starScore({ draft: answer }),
    generateStarFeedbackFields({
      draft: answer,
      job: {
        title: job.title,
        company: job.company,
        start: job.start ?? "",
        end: job.end ?? ""
      }
    })
  ]);

  return {
    category: answer.category,
    title: answer.title,
    situation: answer.situation,
    task: answer.task,
    actions: answer.actions,
    result: answer.result,
    ...feedback,
    score: score.score,
    scoreRationale: score.rationale,
    scoredAt: new Date(),
    scoreIsStale: false,
    scoreDraftHash: getStarDraftFingerprint(answer)
  };
}

export async function createJobAction(formData: FormData) {
  const title = formString(formData, "title");
  const company = formString(formData, "company");
  const validationError = validateManualJobInput({ title, company });

  if (validationError) {
    throw new Error(validationError);
  }

  const resume = await getManualResume();
  const job = await prisma.position.create({
    data: {
      resumeId: resume.id,
      title,
      company,
      start: formString(formData, "start"),
      end: formString(formData, "end")
    }
  });

  revalidatePath("/jobs");
  revalidatePath("/resume");
  redirect(`/jobs/${job.id}`);
}

export async function createJobStarAction(formData: FormData) {
  const jobId = formString(formData, "jobId");
  const title = formString(formData, "title");
  const validationError = validateManualStarInput({ jobId, title });

  if (validationError) {
    throw new Error(validationError);
  }

  const user = await getDefaultUser();
  const job = await findUserJob(jobId);

  if (!job) {
    throw new Error("Job not found.");
  }

  const draft = {
    category: safeStarCategory(formString(formData, "category")),
    title,
    situation: normalizeTextareaText(formString(formData, "situation")),
    task: normalizeTextareaText(formString(formData, "task")),
    actions: normalizeTextareaText(formString(formData, "actions")),
    result: normalizeTextareaText(formString(formData, "result"))
  };
  const feedback = await generateStarFeedbackFields({
    draft,
    job: {
      title: job.title,
      company: job.company,
      start: job.start ?? "",
      end: job.end ?? ""
    }
  });

  const answer = await prisma.starResponse.create({
    data: {
      userId: user.id,
      positionId: job.id,
      ...draft,
      ...feedback
    }
  });

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${job.id}`);
  redirect(`/answers/${answer.id}`);
}

export async function generateJobQuestionsAction(
  _previousState: JobQuestionsState,
  formData: FormData
): Promise<JobQuestionsState> {
  const jobId = formString(formData, "jobId");
  const validationError = validateJobId(jobId);

  if (validationError) {
    return { error: validationError };
  }

  const job = await findUserJob(jobId);

  if (!job) {
    return { jobId, error: "Job not found." };
  }

  try {
    return {
      jobId,
      output: await jobStarQuestions(jobAiInput(job))
    };
  } catch (error) {
    return {
      jobId,
      error:
        error instanceof Error
          ? error.message
          : "Could not generate job questions."
    };
  }
}

export async function createJobDraftStarsAction(formData: FormData) {
  const jobId = formString(formData, "jobId");
  const validationError = validateJobId(jobId);

  if (validationError) {
    throw new Error(validationError);
  }

  const user = await getDefaultUser();
  const job = await findUserJob(jobId);

  if (!job) {
    throw new Error("Job not found.");
  }

  const questions = parseJsonField(formData, "questions", (value) =>
    JobStarQuestionsOutputSchema.parse(value)
  );
  const rawAnswers = formData
    .getAll("answers")
    .map((value) => (typeof value === "string" ? value : ""));
  const answers = normalizeAiAnswers(rawAnswers);
  const answerError = validateAiAnswers(answers);

  if (answerError) {
    throw new Error(answerError);
  }

  const answeredQuestions = questions.questions
    .map((question, index) => ({
      question: question.question,
      answer: normalizeTextareaText(rawAnswers[index] ?? ""),
      focus: question.focus
    }))
    .filter((answer) => answer.answer.length > 0);

  const drafts = await jobStarDrafts({
    ...jobAiInput(job),
    questions: questions.questions,
    answers: answeredQuestions
  });
  const scoredDrafts = await Promise.all(
    drafts.starAnswers.map((answer) => scoredStarData({ answer, job }))
  );

  await prisma.starResponse.createMany({
    data: scoredDrafts.map((answer) => ({
      userId: user.id,
      positionId: job.id,
      ...answer
    }))
  });

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${job.id}`);
  redirect(`/jobs/${job.id}`);
}
