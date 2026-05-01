import type { StarCategory } from "@prisma/client";

export const STAR_CATEGORIES = [
  "achievement",
  "challenge",
  "collaboration",
  "leadership",
  "other"
] as const satisfies readonly StarCategory[];

export const STAR_CATEGORY_LABELS: Record<StarCategory, string> = {
  achievement: "Achievement",
  challenge: "Challenge",
  collaboration: "Collaboration",
  leadership: "Leadership",
  other: "Other"
};

export type StarDraftSnapshot = {
  title: string;
  situation: string;
  task: string;
  actions: string;
  result: string;
};

export type StarScoreSnapshot = {
  score: number | null;
  scoreIsStale: boolean;
};

export type StarScoreDraftSnapshot = {
  score: number | null;
  scoreDraftHash: string | null;
};

export function safeStarCategory(value: string): StarCategory {
  return STAR_CATEGORIES.includes(value as StarCategory)
    ? (value as StarCategory)
    : "other";
}

export function getStarDraftFingerprint({
  actions,
  result,
  situation,
  task,
  title
}: StarDraftSnapshot) {
  const content = JSON.stringify({
    title: title.trim(),
    situation: situation.trim(),
    task: task.trim(),
    actions: actions.trim(),
    result: result.trim()
  });
  let hash = 2166136261;

  for (let index = 0; index < content.length; index += 1) {
    hash ^= content.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function getStarScoreLabel({
  score,
  scoreIsStale
}: StarScoreSnapshot) {
  if (score === null) {
    return "Unscored";
  }

  return `Score ${score}/10${scoreIsStale ? " stale" : ""}`;
}

export function isStarScoreFreshForDraft(
  draft: StarDraftSnapshot,
  score: StarScoreDraftSnapshot
) {
  return (
    score.score !== null &&
    Boolean(score.scoreDraftHash) &&
    score.scoreDraftHash === getStarDraftFingerprint(draft)
  );
}
