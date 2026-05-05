"use client";

import { useActionState } from "react";

import { generateNarrativeAction } from "@/app/narratives/actions";
import { initialNarrativeGenerationState } from "@/app/narratives/state";
import {
  NARRATIVE_THEME_LABELS,
  NARRATIVE_THEMES
} from "@/lib/narrative";

type NarrativeGenerationPanelProps = {
  jobs: Array<{
    id: string;
    title: string;
    company: string;
    starCount: number;
  }>;
};

export function NarrativeGenerationPanel({
  jobs
}: NarrativeGenerationPanelProps) {
  const [state, formAction, isPending] = useActionState(
    generateNarrativeAction,
    initialNarrativeGenerationState
  );

  return (
    <section className="card space-y-5">
      <div>
        <p className="label">Narrative engine</p>
        <h1 className="mt-3 text-4xl font-black">Generate a narrative.</h1>
        <p className="mt-3 text-sm leading-6 text-ink/65">
          Build career-wide or per-job interview narratives from your saved STAR
          answers.
        </p>
      </div>

      {state.error ? (
        <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {state.error}
        </p>
      ) : null}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="scope" value="career" />
        <label className="block space-y-2">
          <span className="label">Career theme</span>
          <select name="theme" className="field" defaultValue="impact">
            {NARRATIVE_THEMES.map((theme) => (
              <option key={theme} value={theme}>
                {NARRATIVE_THEME_LABELS[theme]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="button" disabled={isPending}>
          {isPending ? "Generating..." : "Generate career narrative"}
        </button>
      </form>

      <div className="border-t border-ink/10 pt-5">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="scope" value="job" />
          <label className="block space-y-2">
            <span className="label">Job</span>
            <select name="positionId" className="field" required>
              <option value="">Choose a job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} at {job.company} ({job.starCount} STAR)
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="label">Job theme</span>
            <select name="theme" className="field" defaultValue="impact">
              {NARRATIVE_THEMES.map((theme) => (
                <option key={theme} value={theme}>
                  {NARRATIVE_THEME_LABELS[theme]}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="button-secondary" disabled={isPending}>
            {isPending ? "Generating..." : "Generate job narrative"}
          </button>
        </form>
      </div>
    </section>
  );
}
