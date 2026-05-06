import {
  normalizeNarrativeTheme,
  safeNarrativeScope
} from "@/lib/narrative";

export { normalizeNarrativeTheme, safeNarrativeScope };

export function resolveNarrativeTheme({
  fallback = "impact",
  manualTheme,
  presetTheme,
  theme
}: {
  fallback?: string;
  manualTheme?: string;
  presetTheme?: string;
  theme?: string;
}) {
  return normalizeNarrativeTheme(
    manualTheme || theme || presetTheme || "",
    fallback
  );
}

export function validateNarrativeId(narrativeId: string) {
  if (!narrativeId.trim()) {
    return "Missing narrative id.";
  }

  return null;
}

export function validateNarrativeGeneration({
  positionId,
  scope
}: {
  positionId: string;
  scope: string;
}) {
  const safeScope = safeNarrativeScope(scope);

  if (safeScope === "job" && !positionId.trim()) {
    return "Choose a job before generating a per-job narrative.";
  }

  if (safeScope === "target_job") {
    return "Use the target job form to generate a job-fit narrative.";
  }

  return null;
}

export function validateTargetJobNarrativeInput({
  company,
  description,
  sourceIds,
  theme,
  title
}: {
  company: string;
  description: string;
  sourceIds: string[];
  theme: string;
  title: string;
}) {
  if (!title.trim() || !company.trim()) {
    return "Target job title and company are required.";
  }

  if (description.trim().length < 20) {
    return "Paste at least a few lines from the target job description.";
  }

  if (!theme.trim()) {
    return "Choose or enter a narrative theme.";
  }

  if (sourceIds.length === 0) {
    return "Select at least one STAR answer for this target job narrative.";
  }

  return null;
}

export function validateTargetJobSourceOwnership({
  foundSourceIds,
  requestedSourceIds
}: {
  foundSourceIds: string[];
  requestedSourceIds: string[];
}) {
  const found = new Set(foundSourceIds);
  const missing = requestedSourceIds.filter((sourceId) => !found.has(sourceId));

  if (missing.length > 0) {
    return "One or more selected STAR answers could not be found.";
  }

  return null;
}

export function validateNarrativeDraft({
  fullNarrative,
  title
}: {
  fullNarrative: string;
  title: string;
}) {
  if (!title.trim()) {
    return "Narrative title is required.";
  }

  if (!fullNarrative.trim()) {
    return "Full narrative is required.";
  }

  return null;
}
