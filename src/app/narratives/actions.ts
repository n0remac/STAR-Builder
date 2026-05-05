"use server";

import type {
  NarrativeScope,
  StarCategory
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type {
  NarrativeGenerationState,
  NarrativeThemeExtractionState
} from "@/app/narratives/state";
import {
  normalizeNarrativeTheme,
  safeNarrativeScope,
  validateNarrativeDraft,
  validateNarrativeGeneration,
  validateNarrativeId
} from "@/app/narratives/validation";
import {
  careerNarrative,
  careerNarrativeFeedback,
  careerNarrativeScore,
  narrativeThemeExtraction
} from "@/features/ai";
import type {
  JobContext,
  NarrativeDraft,
  NarrativeInput
} from "@/features/ai/schemas";
import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/default-user";
import { formString } from "@/lib/form";
import {
  getNarrativeFingerprint,
  isNarrativeScoreFresh
} from "@/lib/narrative";
import { normalizeTextareaText } from "@/lib/normalization";

type StarSource = {
  id: string;
  category: StarCategory;
  title: string;
  situation: string;
  task: string;
  actions: string;
  result: string;
  score: number | null;
  position: {
    title: string;
    company: string;
    start: string | null;
    end: string | null;
  };
};

function jobContext(job: {
  title: string;
  company: string;
  start: string | null;
  end: string | null;
}): JobContext {
  return {
    title: job.title,
    company: job.company,
    start: job.start ?? "",
    end: job.end ?? ""
  };
}

function draftFromFormData(formData: FormData): NarrativeDraft {
  return {
    title: formString(formData, "title"),
    positioning: normalizeTextareaText(formString(formData, "positioning")),
    fullNarrative: normalizeTextareaText(
      formString(formData, "fullNarrative")
    ),
    shortVersion: normalizeTextareaText(formString(formData, "shortVersion")),
    interviewGuidance: normalizeTextareaText(
      formString(formData, "interviewGuidance")
    )
  };
}

function scoreStateFromFormData(formData: FormData) {
  const rawScore = Number(formString(formData, "score"));
  const score =
    Number.isInteger(rawScore) && rawScore >= 1 && rawScore <= 10
      ? rawScore
      : null;

  return {
    score,
    scoreRationale: normalizeTextareaText(formString(formData, "scoreRationale")),
    sourceHash: formString(formData, "sourceHash")
  };
}

function sourceIdsFromFormData(formData: FormData) {
  return formData
    .getAll("sourceIds")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean);
}

function fingerprint({
  draft,
  scope,
  sourceIds,
  theme
}: {
  draft: NarrativeDraft;
  scope: NarrativeScope;
  sourceIds: string[];
  theme: string;
}) {
  return getNarrativeFingerprint({
    ...draft,
    scope,
    sourceIds,
    theme
  });
}

function narrativeScoreInput({
  draft,
  scope,
  theme
}: {
  draft: NarrativeDraft;
  scope: NarrativeScope;
  theme: string;
}) {
  return {
    draft,
    scope,
    theme
  };
}

function themeFromFormData(formData: FormData) {
  return normalizeNarrativeTheme(
    formString(formData, "manualTheme") ||
      formString(formData, "theme") ||
      formString(formData, "presetTheme"),
    "impact"
  );
}

function groupSourcesForAi({
  job,
  scope,
  sources
}: {
  job?: JobContext;
  scope: NarrativeScope;
  sources: StarSource[];
}): NarrativeInput["jobs"] {
  if (scope === "job" && job) {
    return [
      {
        job,
        stories: sources.map((source) => ({
          id: source.id,
          category: source.category,
          title: source.title,
          situation: source.situation,
          task: source.task,
          actions: source.actions,
          result: source.result,
          score: source.score
        }))
      }
    ];
  }

  const grouped = new Map<string, NarrativeInput["jobs"][number]>();

  for (const source of sources) {
    const key = `${source.position.company}:${source.position.title}:${source.position.start ?? ""}:${source.position.end ?? ""}`;
    const existing = grouped.get(key);
    const story = {
      id: source.id,
      category: source.category,
      title: source.title,
      situation: source.situation,
      task: source.task,
      actions: source.actions,
      result: source.result,
      score: source.score
    };

    if (existing) {
      existing.stories.push(story);
    } else {
      grouped.set(key, {
        job: jobContext(source.position),
        stories: [story]
      });
    }
  }

  return Array.from(grouped.values());
}

async function findSources({
  positionId,
  scope
}: {
  positionId: string;
  scope: NarrativeScope;
}) {
  const user = await getDefaultUser();

  if (scope === "job") {
    const job = await prisma.position.findFirst({
      where: {
        id: positionId,
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

    if (!job) {
      throw new Error("Job not found.");
    }

    return {
      user,
      job: jobContext(job),
      positionId: job.id,
      sources: job.starResponses.map((source) => ({
        ...source,
        position: job
      }))
    };
  }

  const sources = await prisma.starResponse.findMany({
    where: {
      userId: user.id
    },
    include: {
      position: true
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  return {
    user,
    job: undefined,
    positionId: null,
    sources
  };
}

async function findUserNarrative(narrativeId: string) {
  const user = await getDefaultUser();

  return prisma.narrative.findFirst({
    where: {
      id: narrativeId,
      userId: user.id
    },
    include: {
      sources: {
        include: {
          starResponse: {
            include: {
              position: true
            }
          }
        },
        orderBy: {
          starResponseId: "asc"
        }
      },
      position: true
    }
  });
}

export async function generateNarrativeAction(
  _previousState: NarrativeGenerationState,
  formData: FormData
): Promise<NarrativeGenerationState> {
  const scope = safeNarrativeScope(formString(formData, "scope", "career"));
  const theme = themeFromFormData(formData);
  const positionId = formString(formData, "positionId");
  const validationError = validateNarrativeGeneration({ positionId, scope });
  let narrativeId = "";

  if (validationError) {
    return { error: validationError };
  }

  try {
    const sourceSet = await findSources({ positionId, scope });

    if (sourceSet.sources.length === 0) {
      return {
        error:
          scope === "job"
            ? "Add at least one STAR answer to this job before generating a narrative."
            : "Add at least one STAR answer before generating a career narrative."
      };
    }

    const input: NarrativeInput = {
      scope,
      theme,
      job: sourceSet.job,
      jobs: groupSourcesForAi({
        job: sourceSet.job,
        scope,
        sources: sourceSet.sources
      })
    };
    const generated = await careerNarrative(input);
    const sourceIds = sourceSet.sources.map((source) => source.id);
    const citedIds = new Set(generated.citedSourceIds);
    const draft = {
      title: generated.title,
      positioning: generated.positioning,
      fullNarrative: generated.fullNarrative,
      shortVersion: generated.shortVersion,
      interviewGuidance: generated.interviewGuidance
    };
    const score = await careerNarrativeScore(
      narrativeScoreInput({ draft, scope, theme })
    );
    const sourceHash = fingerprint({ draft, scope, sourceIds, theme });
    const narrative = await prisma.narrative.create({
      data: {
        userId: sourceSet.user.id,
        positionId: sourceSet.positionId,
        scope,
        theme,
        ...draft,
        score: score.score,
        scoreRationale: score.rationale,
        scoredAt: new Date(),
        scoreIsStale: false,
        sourceHash,
        sources: {
          create: sourceIds.map((sourceId) => ({
            starResponseId: sourceId,
            roleInNarrative: citedIds.has(sourceId) ? "Cited" : "Source"
          }))
        }
      }
    });

    revalidatePath("/narratives");
    narrativeId = narrative.id;
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not generate narrative."
    };
  }

  redirect(`/narratives/${narrativeId}`);
}

export async function extractNarrativeThemesAction(
  _previousState: NarrativeThemeExtractionState,
  formData: FormData
): Promise<NarrativeThemeExtractionState> {
  const scope = safeNarrativeScope(formString(formData, "scope", "career"));
  const positionId = formString(formData, "positionId");
  const validationError = validateNarrativeGeneration({ positionId, scope });

  if (validationError) {
    return { scope, positionId, error: validationError };
  }

  try {
    const sourceSet = await findSources({ positionId, scope });

    if (sourceSet.sources.length === 0) {
      return {
        scope,
        positionId,
        error:
          scope === "job"
            ? "Add at least one STAR answer to this job before extracting themes."
            : "Add at least one STAR answer before extracting themes."
      };
    }

    return {
      scope,
      positionId,
      output: await narrativeThemeExtraction({
        scope,
        job: sourceSet.job,
        jobs: groupSourcesForAi({
          job: sourceSet.job,
          scope,
          sources: sourceSet.sources
        })
      })
    };
  } catch (error) {
    return {
      scope,
      positionId,
      error:
        error instanceof Error ? error.message : "Could not extract themes."
    };
  }
}

export async function updateNarrativeAction(formData: FormData) {
  const id = formString(formData, "id");
  const scope = safeNarrativeScope(formString(formData, "scope", "career"));
  const theme = themeFromFormData(formData);
  const draft = draftFromFormData(formData);
  const sourceIds = sourceIdsFromFormData(formData);
  const currentScore = scoreStateFromFormData(formData);
  const idError = validateNarrativeId(id);
  const draftError = validateNarrativeDraft(draft);

  if (idError ?? draftError) {
    throw new Error(idError ?? draftError ?? "Invalid narrative.");
  }

  const narrative = await findUserNarrative(id);

  if (!narrative) {
    throw new Error("Narrative not found.");
  }

  const scoreMatchesDraft = isNarrativeScoreFresh(
    {
      ...draft,
      scope,
      sourceIds,
      theme
    },
    currentScore
  );

  await prisma.narrative.update({
    where: { id },
    data: {
      ...draft,
      score: currentScore.score,
      scoreRationale:
        currentScore.score === null ? "" : currentScore.scoreRationale,
      scoreIsStale: currentScore.score === null ? false : !scoreMatchesDraft,
      sourceHash: currentScore.score === null ? null : currentScore.sourceHash,
      scoredAt:
        currentScore.score === null
          ? null
          : scoreMatchesDraft
            ? new Date()
            : narrative.scoredAt
    }
  });

  revalidatePath("/narratives");
  revalidatePath(`/narratives/${id}`);
  redirect(`/narratives/${id}`);
}

export async function regenerateNarrativeScoreAction(formData: FormData) {
  const id = formString(formData, "id");
  const scope = safeNarrativeScope(formString(formData, "scope", "career"));
  const theme = themeFromFormData(formData);
  const draft = draftFromFormData(formData);
  const sourceIds = sourceIdsFromFormData(formData);
  const idError = validateNarrativeId(id);
  const draftError = validateNarrativeDraft(draft);

  if (idError ?? draftError) {
    throw new Error(idError ?? draftError ?? "Invalid narrative.");
  }

  const narrative = await findUserNarrative(id);

  if (!narrative) {
    throw new Error("Narrative not found.");
  }

  const score = await careerNarrativeScore(
    narrativeScoreInput({ draft, scope, theme })
  );

  await prisma.narrative.update({
    where: { id },
    data: {
      ...draft,
      score: score.score,
      scoreRationale: score.rationale,
      scoredAt: new Date(),
      scoreIsStale: false,
      sourceHash: fingerprint({ draft, scope, sourceIds, theme })
    }
  });

  revalidatePath("/narratives");
  revalidatePath(`/narratives/${id}`);
  redirect(`/narratives/${id}`);
}

export async function requestNarrativeFeedbackAction(formData: FormData) {
  const id = formString(formData, "id");
  const scope = safeNarrativeScope(formString(formData, "scope", "career"));
  const theme = themeFromFormData(formData);
  const draft = draftFromFormData(formData);
  const sourceIds = sourceIdsFromFormData(formData);
  const currentScore = scoreStateFromFormData(formData);
  const idError = validateNarrativeId(id);
  const draftError = validateNarrativeDraft(draft);

  if (idError ?? draftError) {
    throw new Error(idError ?? draftError ?? "Invalid narrative.");
  }

  const narrative = await findUserNarrative(id);

  if (!narrative) {
    throw new Error("Narrative not found.");
  }

  const scoreMatchesDraft = isNarrativeScoreFresh(
    {
      ...draft,
      scope,
      sourceIds,
      theme
    },
    currentScore
  );
  const feedback = await careerNarrativeFeedback({
    draft,
    scope,
    theme
  });

  await prisma.narrative.update({
    where: { id },
    data: {
      ...draft,
      feedback: feedback.feedback,
      score: currentScore.score,
      scoreRationale:
        currentScore.score === null ? "" : currentScore.scoreRationale,
      scoreIsStale: currentScore.score === null ? false : !scoreMatchesDraft,
      sourceHash: currentScore.score === null ? null : currentScore.sourceHash,
      scoredAt:
        currentScore.score === null
          ? null
          : scoreMatchesDraft
            ? new Date()
            : narrative.scoredAt
    }
  });

  revalidatePath("/narratives");
  revalidatePath(`/narratives/${id}`);
  redirect(`/narratives/${id}`);
}
