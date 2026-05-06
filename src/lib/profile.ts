import type { NarrativeScope } from "@prisma/client";

import {
  ProfileMetaNarrativeOutputSchema,
  type ProfileMetaNarrativeInput,
  type ProfileMetaNarrativeOutput,
  type ProfileMetaReferenceType
} from "@/features/ai/schemas";

export const DEFAULT_RESUME_PATH = "/resume.pdf";

export type ProfileLink = {
  label: string;
  url: string;
};

export type ProfileSummaryNarrativeInput = {
  scope: NarrativeScope;
  theme: string;
  title: string;
  positioning: string;
  fullNarrative: string;
  shortVersion: string;
  job?: {
    title: string;
    company: string;
    start: string;
    end: string;
  };
  targetJob?: {
    title: string;
    company: string;
    description: string;
  };
};

export type ProfileSummaryInputSnapshot = {
  profile: {
    displayName: string;
    headline: string;
    location: string;
  };
  narratives: ProfileSummaryNarrativeInput[];
};

export type ProfileReference = {
  type: ProfileMetaReferenceType;
  id: string;
};

export type ProfileReferenceSets = {
  answerIds: Set<string>;
  jobIds: Set<string>;
  narrativeIds: Set<string>;
};

export type ProfileMetaNarrativeValidationResult = {
  narrative: ProfileMetaNarrativeOutput;
  validReferenceCount: number;
};

export function normalizeProfileLinks(links: string) {
  return links
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function labelFromUrl(url: string) {
  try {
    const parsed = new URL(url);

    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function parseProfileLinks(links: string): ProfileLink[] {
  return normalizeProfileLinks(links)
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [rawLabel, ...rawUrlParts] = line.split("|");
      const label = rawLabel.trim();
      const url = rawUrlParts.join("|").trim();

      if (url) {
        return {
          label: label || labelFromUrl(url),
          url
        };
      }

      return {
        label: labelFromUrl(label),
        url: label
      };
    });
}

export function profileDisplayName({
  displayName,
  userName
}: {
  displayName: string;
  userName?: string | null;
}) {
  return displayName.trim() || userName?.trim() || "Profile";
}

export function normalizePublicSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function profileReferenceHref(reference: ProfileReference) {
  switch (reference.type) {
    case "answer":
      return `/answers/${reference.id}`;
    case "job":
      return `/jobs/${reference.id}`;
    case "narrative":
      return `/narratives/${reference.id}`;
  }
}

export function publicProfileReferenceHref(
  slug: string,
  reference: ProfileReference
) {
  switch (reference.type) {
    case "answer":
      return `/u/${slug}/answers/${reference.id}`;
    case "job":
      return `/u/${slug}#job-${reference.id}`;
    case "narrative":
      return `/u/${slug}/narratives/${reference.id}`;
  }
}

export function buildProfileSummaryInput({
  profile,
  narratives
}: ProfileSummaryInputSnapshot): ProfileSummaryInputSnapshot {
  return {
    profile: {
      displayName: profile.displayName.trim(),
      headline: profile.headline.trim(),
      location: profile.location.trim()
    },
    narratives: narratives
      .map((narrative) => ({
        ...narrative,
        title: narrative.title.trim(),
        theme: narrative.theme.trim(),
        positioning: narrative.positioning.trim(),
        fullNarrative: narrative.fullNarrative.trim(),
        shortVersion: narrative.shortVersion.trim()
      }))
      .filter(
        (narrative) =>
          narrative.title ||
          narrative.positioning ||
          narrative.fullNarrative ||
          narrative.shortVersion
      )
  };
}

export function isValidProfileReference(
  reference: ProfileReference,
  sets: ProfileReferenceSets
) {
  switch (reference.type) {
    case "answer":
      return sets.answerIds.has(reference.id);
    case "job":
      return sets.jobIds.has(reference.id);
    case "narrative":
      return sets.narrativeIds.has(reference.id);
  }
}

export function parseProfileMetaNarrativeJson(value: string) {
  if (!value.trim()) {
    return null;
  }

  try {
    return ProfileMetaNarrativeOutputSchema.parse(JSON.parse(value));
  } catch {
    return null;
  }
}

export function flattenProfileMetaNarrative(
  narrative: ProfileMetaNarrativeOutput
) {
  return narrative.paragraphs
    .map((paragraph) =>
      paragraph.segments.map((segment) => segment.text).join("").trim()
    )
    .filter(Boolean)
    .join("\n\n");
}

export function validateProfileMetaNarrativeReferences(
  narrative: ProfileMetaNarrativeOutput,
  sets: ProfileReferenceSets
): ProfileMetaNarrativeValidationResult {
  let validReferenceCount = 0;
  const validated = {
    ...narrative,
    paragraphs: narrative.paragraphs.map((paragraph) => ({
      segments: paragraph.segments.map((segment) => {
        if (!segment.reference) {
          return segment;
        }

        if (isValidProfileReference(segment.reference, sets)) {
          validReferenceCount += 1;

          return segment;
        }

          return {
            text: segment.text,
            reference: null
          };
        })
      }))
  };

  return {
    narrative: validated,
    validReferenceCount
  };
}

export function serializeProfileMetaNarrative(
  narrative: ProfileMetaNarrativeOutput
) {
  return JSON.stringify(narrative);
}

export function buildProfileMetaNarrativeInput(
  input: ProfileMetaNarrativeInput
): ProfileMetaNarrativeInput {
  return {
    profile: {
      displayName: input.profile.displayName.trim(),
      headline: input.profile.headline.trim(),
      contactEmail: input.profile.contactEmail.trim(),
      location: input.profile.location.trim()
    },
    resumeText: input.resumeText.trim(),
    jobs: input.jobs.map((job) => ({
      ...job,
      title: job.title.trim(),
      company: job.company.trim(),
      start: job.start.trim(),
      end: job.end.trim(),
      profileSummary: job.profileSummary.trim(),
      starAnswers: job.starAnswers.map((answer) => ({
        ...answer,
        title: answer.title.trim(),
        situation: answer.situation.trim(),
        task: answer.task.trim(),
        actions: answer.actions.trim(),
        result: answer.result.trim()
      }))
    })),
    narratives: input.narratives.map((narrative) => ({
      ...narrative,
      theme: narrative.theme.trim(),
      title: narrative.title.trim(),
      positioning: narrative.positioning.trim(),
      fullNarrative: narrative.fullNarrative.trim(),
      shortVersion: narrative.shortVersion.trim(),
      targetJob: narrative.targetJob
        ? {
            title: narrative.targetJob.title.trim(),
            company: narrative.targetJob.company.trim(),
            description: narrative.targetJob.description.trim()
          }
        : undefined,
      sources: narrative.sources.map((source) => ({
        starResponseId: source.starResponseId.trim(),
        roleInNarrative: source.roleInNarrative.trim()
      }))
    })),
    targetJobs: input.targetJobs.map((targetJob) => ({
      id: targetJob.id,
      title: targetJob.title.trim(),
      company: targetJob.company.trim(),
      description: targetJob.description.trim()
    }))
  };
}
