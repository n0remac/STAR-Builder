import {
  normalizeNarrativeTheme,
  safeNarrativeScope
} from "@/lib/narrative";

export { normalizeNarrativeTheme, safeNarrativeScope };

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
