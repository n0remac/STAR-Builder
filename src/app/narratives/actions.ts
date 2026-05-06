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
  resolveNarrativeTheme,
  safeNarrativeScope,
  validateNarrativeDraft,
  validateNarrativeGeneration,
  validateNarrativeId,
  validateTargetJobNarrativeInput,
  validateTargetJobSourceOwnership
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
  NarrativeInput,
  TargetJobContext
} from "@/features/ai/schemas";
import { requireCurrentUserForAction } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { formString } from "@/lib/form";
import {
  freshNarrativeScoreState,
  scoreStateForNarrative
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

function targetJobContext(job: {
  title: string;
  company: string;
  description: string;
}): TargetJobContext {
  return {
    title: job.title,
    company: job.company,
    description: job.description
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

function narrativeScoreInput({
  draft,
  scope,
  targetJob,
  theme
}: {
  draft: NarrativeDraft;
  scope: NarrativeScope;
  targetJob?: TargetJobContext;
  theme: string;
}) {
  return {
    draft,
    scope,
    targetJob,
    theme
  };
}

function themeFromFormData(formData: FormData) {
  return resolveNarrativeTheme({
    manualTheme: formString(formData, "manualTheme"),
    theme: formString(formData, "theme"),
    presetTheme: formString(formData, "presetTheme"),
    fallback: "impact"
  });
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
  const user = await requireCurrentUserForAction();

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

async function findSelectedTargetSources(sourceIds: string[]) {
  const user = await requireCurrentUserForAction();
  const uniqueSourceIds = Array.from(new Set(sourceIds));
  const sources = await prisma.starResponse.findMany({
    where: {
      id: {
        in: uniqueSourceIds
      },
      userId: user.id
    },
    include: {
      position: true
    }
  });
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const ownershipError = validateTargetJobSourceOwnership({
    requestedSourceIds: uniqueSourceIds,
    foundSourceIds: sources.map((source) => source.id)
  });

  if (ownershipError) {
    throw new Error(ownershipError);
  }

  return {
    user,
    sourceIds: uniqueSourceIds,
    sources: uniqueSourceIds.map((sourceId) => sourceById.get(sourceId)!)
  };
}

async function findUserNarrative(narrativeId: string) {
  const user = await requireCurrentUserForAction();

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
      position: true,
      targetJob: true
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
    const scoreState = freshNarrativeScoreState(
      {
        ...draft,
        scope,
        sourceIds,
        theme
      },
      score
    );
    const narrative = await prisma.narrative.create({
      data: {
        userId: sourceSet.user.id,
        positionId: sourceSet.positionId,
        scope,
        theme,
        ...draft,
        ...scoreState,
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

export async function generateTargetJobNarrativeAction(
  _previousState: NarrativeGenerationState,
  formData: FormData
): Promise<NarrativeGenerationState> {
  const title = formString(formData, "targetTitle");
  const company = formString(formData, "targetCompany");
  const description = normalizeTextareaText(
    formString(formData, "targetDescription")
  );
  const theme = themeFromFormData(formData);
  const sourceIds = formData
    .getAll("sourceIds")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  const validationError = validateTargetJobNarrativeInput({
    title,
    company,
    description,
    theme,
    sourceIds
  });
  let narrativeId = "";

  if (validationError) {
    return { error: validationError };
  }

  try {
    const sourceSet = await findSelectedTargetSources(sourceIds);
    const targetJob = targetJobContext({
      title,
      company,
      description
    });
    const input: NarrativeInput = {
      scope: "target_job",
      theme,
      targetJob,
      jobs: groupSourcesForAi({
        scope: "target_job",
        sources: sourceSet.sources
      })
    };
    const generated = await careerNarrative(input);
    const citedIds = new Set(generated.citedSourceIds);
    const draft = {
      title: generated.title,
      positioning: generated.positioning,
      fullNarrative: generated.fullNarrative,
      shortVersion: generated.shortVersion,
      interviewGuidance: generated.interviewGuidance
    };
    const score = await careerNarrativeScore(
      narrativeScoreInput({
        draft,
        scope: "target_job",
        targetJob,
        theme
      })
    );
    const scoreState = freshNarrativeScoreState(
      {
        ...draft,
        scope: "target_job",
        sourceIds: sourceSet.sourceIds,
        targetJob,
        theme
      },
      score
    );
    const narrative = await prisma.$transaction(async (tx) => {
      const savedTargetJob = await tx.targetJob.create({
        data: {
          userId: sourceSet.user.id,
          title,
          company,
          description
        }
      });

      return tx.narrative.create({
        data: {
          userId: sourceSet.user.id,
          targetJobId: savedTargetJob.id,
          scope: "target_job",
          theme,
          ...draft,
          ...scoreState,
          sources: {
            create: sourceSet.sourceIds.map((sourceId) => ({
              starResponseId: sourceId,
              roleInNarrative: citedIds.has(sourceId) ? "Cited" : "Source"
            }))
          }
        }
      });
    });

    revalidatePath("/narratives");
    narrativeId = narrative.id;
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not generate target job narrative."
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
  const draft = draftFromFormData(formData);
  const idError = validateNarrativeId(id);
  const draftError = validateNarrativeDraft(draft);

  if (idError ?? draftError) {
    throw new Error(idError ?? draftError ?? "Invalid narrative.");
  }

  const narrative = await findUserNarrative(id);

  if (!narrative) {
    throw new Error("Narrative not found.");
  }

  const sourceIds = narrative.sources.map((source) => source.starResponseId);
  const targetJob = narrative.targetJob
    ? targetJobContext(narrative.targetJob)
    : undefined;
  const scoreState = scoreStateForNarrative(
    {
      ...draft,
      scope: narrative.scope,
      sourceIds,
      targetJob,
      theme: narrative.theme
    },
    narrative
  );

  await prisma.narrative.update({
    where: { id },
    data: {
      ...draft,
      ...scoreState
    }
  });

  revalidatePath("/narratives");
  revalidatePath(`/narratives/${id}`);
  redirect(`/narratives/${id}`);
}

export async function regenerateNarrativeScoreAction(formData: FormData) {
  const id = formString(formData, "id");
  const draft = draftFromFormData(formData);
  const idError = validateNarrativeId(id);
  const draftError = validateNarrativeDraft(draft);

  if (idError ?? draftError) {
    throw new Error(idError ?? draftError ?? "Invalid narrative.");
  }

  const narrative = await findUserNarrative(id);

  if (!narrative) {
    throw new Error("Narrative not found.");
  }

  const sourceIds = narrative.sources.map((source) => source.starResponseId);
  const targetJob = narrative.targetJob
    ? targetJobContext(narrative.targetJob)
    : undefined;
  const snapshot = {
    ...draft,
    scope: narrative.scope,
    sourceIds,
    targetJob,
    theme: narrative.theme
  };
  const score = await careerNarrativeScore(
    narrativeScoreInput({
      draft,
      scope: narrative.scope,
      targetJob,
      theme: narrative.theme
    })
  );

  await prisma.narrative.update({
    where: { id },
    data: {
      ...draft,
      ...freshNarrativeScoreState(snapshot, score)
    }
  });

  revalidatePath("/narratives");
  revalidatePath(`/narratives/${id}`);
  redirect(`/narratives/${id}`);
}

export async function requestNarrativeFeedbackAction(formData: FormData) {
  const id = formString(formData, "id");
  const draft = draftFromFormData(formData);
  const idError = validateNarrativeId(id);
  const draftError = validateNarrativeDraft(draft);

  if (idError ?? draftError) {
    throw new Error(idError ?? draftError ?? "Invalid narrative.");
  }

  const narrative = await findUserNarrative(id);

  if (!narrative) {
    throw new Error("Narrative not found.");
  }

  const sourceIds = narrative.sources.map((source) => source.starResponseId);
  const targetJob = narrative.targetJob
    ? targetJobContext(narrative.targetJob)
    : undefined;
  const scoreState = scoreStateForNarrative(
    {
      ...draft,
      scope: narrative.scope,
      sourceIds,
      targetJob,
      theme: narrative.theme
    },
    narrative
  );
  const feedback = await careerNarrativeFeedback({
    draft,
    scope: narrative.scope,
    targetJob,
    theme: narrative.theme
  });

  await prisma.narrative.update({
    where: { id },
    data: {
      ...draft,
      feedback: feedback.feedback,
      ...scoreState
    }
  });

  revalidatePath("/narratives");
  revalidatePath(`/narratives/${id}`);
  redirect(`/narratives/${id}`);
}
