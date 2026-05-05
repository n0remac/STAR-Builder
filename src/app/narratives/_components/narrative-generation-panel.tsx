"use client";

import { useActionState, useState } from "react";

import {
  extractNarrativeThemesAction,
  generateNarrativeAction
} from "@/app/narratives/actions";
import {
  initialNarrativeGenerationState,
  initialNarrativeThemeExtractionState
} from "@/app/narratives/state";
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
  const [generationScope, setGenerationScope] = useState<"career" | "job">(
    "career"
  );
  const [state, formAction, isPending] = useActionState(
    generateNarrativeAction,
    initialNarrativeGenerationState
  );
  const [themeState, themeFormAction, isThemePending] = useActionState(
    extractNarrativeThemesAction,
    initialNarrativeThemeExtractionState
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

      <div className="rounded-[1.5rem] border border-ink/10 bg-paper/70 p-4">
        <p className="label">Theme extraction</p>
        <div className="mt-4 grid gap-4">
          <form action={themeFormAction} className="space-y-3">
            <input type="hidden" name="scope" value="career" />
            <button
              type="submit"
              className="button-secondary"
              disabled={isThemePending}
            >
              {isThemePending ? "Extracting..." : "Extract career themes"}
            </button>
          </form>

          <form action={themeFormAction} className="space-y-3">
            <input type="hidden" name="scope" value="job" />
            <label className="block space-y-2">
              <span className="label">Job themes</span>
              <select name="positionId" className="field" required>
                <option value="">Choose a job</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} at {job.company} ({job.starCount} STAR)
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="button-secondary"
              disabled={isThemePending}
            >
              {isThemePending ? "Extracting..." : "Extract job themes"}
            </button>
          </form>
        </div>

        {themeState.error ? (
          <p className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {themeState.error}
          </p>
        ) : null}

        {themeState.output ? (
          <div className="mt-4 grid gap-3">
            {themeState.output.themes.map((theme) => (
              <div
                key={theme.theme}
                className="rounded-2xl border border-ink/10 bg-white/70 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-black">{theme.theme}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/65">
                      {theme.rationale}
                    </p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-ink/45">
                      {theme.citedSourceIds.length} cited source
                      {theme.citedSourceIds.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <form action={formAction}>
                    <input
                      type="hidden"
                      name="scope"
                      value={themeState.scope ?? "career"}
                    />
                    <input
                      type="hidden"
                      name="positionId"
                      value={themeState.positionId ?? ""}
                    />
                    <input type="hidden" name="theme" value={theme.theme} />
                    <button
                      type="submit"
                      className="button-secondary whitespace-nowrap"
                      disabled={isPending}
                    >
                      Generate
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <form action={formAction} className="space-y-4 border-t border-ink/10 pt-5">
        <fieldset className="space-y-3">
          <legend className="label">Narrative scope</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["career", "Career"],
              ["job", "Job"]
            ].map(([value, label]) => (
              <label
                key={value}
                className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3 text-sm font-bold text-ink/70"
              >
                <input
                  type="radio"
                  name="scope"
                  value={value}
                  checked={generationScope === value}
                  onChange={() =>
                    setGenerationScope(value as "career" | "job")
                  }
                  className="h-4 w-4 border-ink/20 text-moss focus:ring-moss"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {generationScope === "job" ? (
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
        ) : null}

        <label className="block space-y-2">
          <span className="label">Preset theme</span>
          <select name="theme" className="field" defaultValue="impact">
            {NARRATIVE_THEMES.map((theme) => (
              <option key={theme} value={theme}>
                {NARRATIVE_THEME_LABELS[theme]}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="label">Manual theme</span>
          <input
            name="manualTheme"
            className="field"
            placeholder={
              generationScope === "career"
                ? "e.g. Scaling teams through operational clarity"
                : "e.g. Rebuilding trust through reliable delivery"
            }
          />
        </label>
        <button type="submit" className="button" disabled={isPending}>
          {isPending
            ? "Generating..."
            : `Generate ${generationScope === "career" ? "career" : "job"} narrative`}
        </button>
      </form>
    </section>
  );
}
