"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";

import { profileMetaNarrative } from "@/features/ai";
import { requireCurrentUserForAction } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { formString, formStrings } from "@/lib/form";
import {
  DEFAULT_RESUME_PATH,
  buildProfileMetaNarrativeInput,
  flattenProfileMetaNarrative,
  normalizeProfileLinks,
  normalizePublicSlug,
  serializeProfileMetaNarrative,
  validateProfileMetaNarrativeReferences
} from "@/lib/profile";
import { getOrCreateProfile } from "@/lib/profile.server";

const MAX_RESUME_BYTES = 10 * 1024 * 1024;

function parseProfileOrder(value: string) {
  const parsed = Number(value);

  return Number.isInteger(parsed) ? parsed : 0;
}

function revalidateProfilePaths() {
  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  revalidatePath("/profile/publish");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireCurrentUserForAction();
  const displayName = formString(formData, "displayName", user.name ?? "");
  const headline = formString(formData, "headline");
  const contactEmail = formString(formData, "contactEmail", user.email ?? "");
  const location = formString(formData, "location");
  const links = normalizeProfileLinks(formString(formData, "links"));
  const resumePath =
    formString(formData, "resumePath", DEFAULT_RESUME_PATH) ||
    DEFAULT_RESUME_PATH;
  const summary = formString(formData, "summary");

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      displayName,
      headline,
      contactEmail,
      location,
      links,
      resumePath,
      summary
    },
    create: {
      userId: user.id,
      displayName,
      headline,
      contactEmail,
      location,
      links,
      resumePath,
      summary
    }
  });

  revalidateProfilePaths();
}

export async function updateProfileCurationAction(formData: FormData) {
  const user = await requireCurrentUserForAction();
  const isPublic = formData.get("isPublic") === "on";
  const publicResumeVisible = formData.get("publicResumeVisible") === "on";
  const publicSlug = normalizePublicSlug(formString(formData, "publicSlug"));
  const visiblePositionIds = new Set(formStrings(formData, "positionVisible"));
  const visibleAnswerIds = new Set(formStrings(formData, "answerVisible"));
  const visibleNarrativeIds = new Set(formStrings(formData, "narrativeVisible"));
  const profile = await getOrCreateProfile(user.id, user.name);

  if (isPublic && !publicSlug) {
    throw new Error("Choose a public slug before publishing your profile.");
  }

  if (publicSlug) {
    const existing = await prisma.profile.findFirst({
      where: {
        publicSlug,
        NOT: {
          userId: user.id
        }
      },
      select: {
        id: true
      }
    });

    if (existing) {
      throw new Error("That public slug is already taken.");
    }
  }

  const [positions, answers, narratives] = await Promise.all([
    prisma.position.findMany({
      where: {
        resume: {
          userId: user.id
        }
      },
      select: {
        id: true
      }
    }),
    prisma.starResponse.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true
      }
    }),
    prisma.narrative.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true
      }
    })
  ]);

  await prisma.$transaction([
    prisma.profile.update({
      where: { id: profile.id },
      data: {
        isPublic,
        publicResumeVisible,
        publicSlug: publicSlug || null
      }
    }),
    ...positions.map((position) =>
      prisma.position.update({
        where: { id: position.id },
        data: {
          profileVisible: visiblePositionIds.has(position.id),
          profileOrder: parseProfileOrder(
            formString(formData, `positionOrder:${position.id}`)
          ),
          profileSummary: formString(
            formData,
            `positionSummary:${position.id}`
          )
        }
      })
    ),
    ...answers.map((answer) =>
      prisma.starResponse.update({
        where: { id: answer.id },
        data: {
          profileVisible: visibleAnswerIds.has(answer.id),
          profileOrder: parseProfileOrder(
            formString(formData, `answerOrder:${answer.id}`)
          )
        }
      })
    ),
    ...narratives.map((narrative) =>
      prisma.narrative.update({
        where: { id: narrative.id },
        data: {
          profileVisible: visibleNarrativeIds.has(narrative.id),
          profileOrder: parseProfileOrder(
            formString(formData, `narrativeOrder:${narrative.id}`)
          )
        }
      })
    )
  ]);

  revalidateProfilePaths();
  if (publicSlug) {
    revalidatePath(`/u/${publicSlug}`);
  }
}

export async function generateProfileMetaNarrativeAction() {
  const user = await requireCurrentUserForAction();
  const profile = await getOrCreateProfile(user.id, user.name);
  const [latestResume, jobs, narratives, targetJobs] = await Promise.all([
    prisma.resume.findFirst({
      where: {
        userId: user.id
      },
      orderBy: {
        importedAt: "desc"
      }
    }),
    prisma.position.findMany({
      where: {
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
      },
      orderBy: [
        { end: "desc" },
        { start: "desc" },
        { updatedAt: "desc" }
      ]
    }),
    prisma.narrative.findMany({
      where: {
        userId: user.id
      },
      include: {
        sources: true,
        targetJob: true
      },
      orderBy: [
        { scope: "asc" },
        { updatedAt: "desc" }
      ]
    }),
    prisma.targetJob.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        updatedAt: "desc"
      }
    })
  ]);
  const input = buildProfileMetaNarrativeInput({
    profile: {
      displayName: profile.displayName || user.name || "",
      headline: profile.headline,
      contactEmail: profile.contactEmail || user.email || "",
      location: profile.location
    },
    resumeText: latestResume?.text ?? "",
    jobs: jobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      start: job.start ?? "",
      end: job.end ?? "",
      profileSummary: job.profileSummary,
      starAnswers: job.starResponses.map((answer) => ({
        id: answer.id,
        category: answer.category,
        title: answer.title,
        situation: answer.situation,
        task: answer.task,
        actions: answer.actions,
        result: answer.result,
        score: answer.score
      }))
    })),
    narratives: narratives.map((narrative) => ({
      id: narrative.id,
      scope: narrative.scope,
      theme: narrative.theme,
      title: narrative.title,
      positioning: narrative.positioning,
      fullNarrative: narrative.fullNarrative,
      shortVersion: narrative.shortVersion,
      positionId: narrative.positionId,
      targetJob: narrative.targetJob
        ? {
            title: narrative.targetJob.title,
            company: narrative.targetJob.company,
            description: narrative.targetJob.description
          }
        : undefined,
      sources: narrative.sources.map((source) => ({
        starResponseId: source.starResponseId,
        roleInNarrative: source.roleInNarrative
      }))
    })),
    targetJobs: targetJobs.map((targetJob) => ({
      id: targetJob.id,
      title: targetJob.title,
      company: targetJob.company,
      description: targetJob.description
    }))
  });

  const answerIds = new Set(
    input.jobs.flatMap((job) => job.starAnswers.map((answer) => answer.id))
  );
  const jobIds = new Set(input.jobs.map((job) => job.id));
  const narrativeIds = new Set(input.narratives.map((narrative) => narrative.id));

  if (answerIds.size === 0 && jobIds.size === 0 && narrativeIds.size === 0) {
    throw new Error("Add career evidence before generating a profile narrative.");
  }

  const generated = await profileMetaNarrative(input);
  const { narrative, validReferenceCount } =
    validateProfileMetaNarrativeReferences(generated, {
      answerIds,
      jobIds,
      narrativeIds
    });

  if (validReferenceCount === 0) {
    throw new Error("Generated narrative did not include any valid evidence links.");
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      metaNarrativeJson: serializeProfileMetaNarrative(narrative),
      metaNarrativeGeneratedAt: new Date(),
      summary: flattenProfileMetaNarrative(narrative)
    }
  });

  revalidateProfilePaths();
}

export async function generateProfileSummaryAction() {
  return generateProfileMetaNarrativeAction();
}

export async function uploadProfileResumeAction(formData: FormData) {
  const user = await requireCurrentUserForAction();
  const profile = await getOrCreateProfile(user.id, user.name);
  const file = formData.get("resume");

  if (!(file instanceof File)) {
    throw new Error("Choose a PDF resume to upload.");
  }

  if (file.size <= 0) {
    throw new Error("The selected resume file is empty.");
  }

  if (file.size > MAX_RESUME_BYTES) {
    throw new Error("Resume PDF must be 10 MB or smaller.");
  }

  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    throw new Error("Resume upload must be a PDF.");
  }

  const publicDir = path.join(process.cwd(), "public");
  const resumePath = `/resumes/${user.id}.pdf`;
  const resumeFilePath = path.join(publicDir, resumePath);

  await mkdir(path.dirname(resumeFilePath), { recursive: true });
  await writeFile(resumeFilePath, Buffer.from(await file.arrayBuffer()));
  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      resumePath
    }
  });

  revalidateProfilePaths();
}
