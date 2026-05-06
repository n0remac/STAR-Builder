import type { NarrativeScope } from "@prisma/client";

export const NARRATIVE_SCOPES = [
  "career",
  "job",
  "target_job"
] as const satisfies readonly NarrativeScope[];

export const NARRATIVE_THEMES = [
  "leadership",
  "ownership",
  "ambiguity",
  "technical_depth",
  "collaboration",
  "impact"
] as const;

export const NARRATIVE_SCOPE_LABELS: Record<NarrativeScope, string> = {
  career: "Career-wide",
  job: "Per-job",
  target_job: "Target job"
};

export type NarrativeTargetJobSnapshot = {
  title: string;
  company: string;
  description: string;
};

export const NARRATIVE_THEME_LABELS: Record<(typeof NARRATIVE_THEMES)[number], string> = {
  leadership: "Leadership",
  ownership: "Ownership",
  ambiguity: "Ambiguity",
  technical_depth: "Technical depth",
  collaboration: "Collaboration",
  impact: "Impact"
};

export type NarrativeDraftSnapshot = {
  title: string;
  positioning: string;
  fullNarrative: string;
  shortVersion: string;
  interviewGuidance: string;
};

export type NarrativeFingerprintSnapshot = NarrativeDraftSnapshot & {
  scope: NarrativeScope;
  theme: string;
  sourceIds: string[];
  targetJob?: NarrativeTargetJobSnapshot | null;
};

export type NarrativeScoreSnapshot = {
  score: number | null;
  scoreIsStale: boolean;
};

export type NarrativeScoreHashSnapshot = {
  score: number | null;
  sourceHash: string | null;
};

export type NarrativePersistedScoreSnapshot = NarrativeScoreHashSnapshot & {
  scoreRationale: string;
  scoredAt: Date | null;
};

export type NarrativeScoreOutputSnapshot = {
  score: number;
  rationale: string;
};

function hashString(content: string) {
  let hash = 2166136261;

  for (let index = 0; index < content.length; index += 1) {
    hash ^= content.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function safeNarrativeScope(value: string): NarrativeScope {
  return NARRATIVE_SCOPES.includes(value as NarrativeScope)
    ? (value as NarrativeScope)
    : "career";
}

export function normalizeNarrativeTheme(value: string, fallback = "impact") {
  const normalized = value.trim().replace(/\s+/g, " ");

  return normalized || fallback;
}

export function narrativeThemeLabel(theme: string) {
  const preset = theme as (typeof NARRATIVE_THEMES)[number];

  return NARRATIVE_THEMES.includes(preset)
    ? NARRATIVE_THEME_LABELS[preset]
    : normalizeNarrativeTheme(theme);
}

export function getNarrativeFingerprint({
  fullNarrative,
  interviewGuidance,
  positioning,
  scope,
  shortVersion,
  sourceIds,
  targetJob,
  theme,
  title
}: NarrativeFingerprintSnapshot) {
  return hashString(
    JSON.stringify({
      scope,
      theme,
      sourceIds: [...sourceIds].sort(),
      targetJob: targetJob
        ? {
            title: targetJob.title.trim(),
            company: targetJob.company.trim(),
            description: targetJob.description.trim()
          }
        : null,
      title: title.trim(),
      positioning: positioning.trim(),
      fullNarrative: fullNarrative.trim(),
      shortVersion: shortVersion.trim(),
      interviewGuidance: interviewGuidance.trim()
    })
  );
}

export function getNarrativeScoreLabel({
  score,
  scoreIsStale
}: NarrativeScoreSnapshot) {
  if (score === null) {
    return "Unscored";
  }

  return `Score ${score}/10${scoreIsStale ? " stale" : ""}`;
}

export function isNarrativeScoreFresh(
  snapshot: NarrativeFingerprintSnapshot,
  score: NarrativeScoreHashSnapshot
) {
  return (
    score.score !== null &&
    Boolean(score.sourceHash) &&
    score.sourceHash === getNarrativeFingerprint(snapshot)
  );
}

export function scoreStateForNarrative(
  snapshot: NarrativeFingerprintSnapshot,
  current: NarrativePersistedScoreSnapshot
) {
  if (current.score === null) {
    return {
      score: null,
      scoreRationale: "",
      scoredAt: null,
      scoreIsStale: false,
      sourceHash: null
    };
  }

  const scoreIsFresh = isNarrativeScoreFresh(snapshot, current);

  return {
    score: current.score,
    scoreRationale: current.scoreRationale,
    scoredAt: current.scoredAt,
    scoreIsStale: !scoreIsFresh,
    sourceHash: current.sourceHash
  };
}

export function freshNarrativeScoreState(
  snapshot: NarrativeFingerprintSnapshot,
  score: NarrativeScoreOutputSnapshot,
  scoredAt = new Date()
) {
  return {
    score: score.score,
    scoreRationale: score.rationale,
    scoredAt,
    scoreIsStale: false,
    sourceHash: getNarrativeFingerprint(snapshot)
  };
}
