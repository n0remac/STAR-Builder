"use client";

import { useActionState } from "react";

import {
  extractResumeAction,
  saveExtractionAction
} from "@/app/resume/actions";
import { initialResumeExtractionState } from "@/app/resume/state";

export function ResumeIngestionForm() {
  const [state, formAction, isPending] = useActionState(
    extractResumeAction,
    initialResumeExtractionState
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <form action={formAction} className="card space-y-5">
        <div>
          <p className="label">Resume ingestion</p>
          <h1 className="mt-3 text-4xl font-black text-ink">
            Paste resume content.
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink/65">
            The extractor returns position records and STAR answer drafts. Without
            an API key it uses deterministic mock output so the rest of the
            product remains testable.
          </p>
        </div>

        <input type="hidden" name="source" value={state.source || "paste"} />
        <label className="block space-y-2">
          <span className="label">Resume text</span>
          <textarea
            name="resumeText"
            className="field min-h-96"
            defaultValue={state.resumeText}
            placeholder="Paste resume bullets, roles, projects, and impact here..."
          />
        </label>

        {state.error ? (
          <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {state.error}
          </p>
        ) : null}

        <button type="submit" className="button" disabled={isPending}>
          {isPending ? "Extracting..." : "Extract STAR drafts"}
        </button>
      </form>

      <section className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="label">Extraction preview</p>
            <h2 className="mt-3 text-3xl font-black">Review before saving.</h2>
          </div>
          {state.extraction ? (
            <span className="pill">
              {state.extraction.positions.length} position
              {state.extraction.positions.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>

        {!state.extraction ? (
          <div className="mt-10 rounded-[1.5rem] border border-dashed border-ink/20 p-8 text-center text-ink/55">
            Extracted positions and STAR answer drafts will appear here.
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {state.extraction.positions.map((position, positionIndex) => (
              <article
                key={`${position.title}-${positionIndex}`}
                className="rounded-[1.5rem] border border-ink/10 bg-paper/70 p-5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-black">{position.title}</h3>
                    <p className="font-semibold text-moss">
                      {position.company}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-ink/50">
                    {[position.start, position.end].filter(Boolean).join(" - ")}
                  </span>
                </div>
                <div className="mt-4 grid gap-3">
                  {position.starAnswers.map((answer, answerIndex) => (
                    <div
                      key={`${answer.title}-${answerIndex}`}
                      className="rounded-2xl bg-white/75 p-4"
                    >
                      <span className="pill">{answer.category}</span>
                      <h4 className="mt-3 font-black text-ink">
                        {answer.title}
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-ink/65">
                        {answer.situation || "No situation captured yet."}
                      </p>
                      <p className="mt-3 text-sm text-ink/55">
                        <strong>Task:</strong> {answer.task || "Not captured"}
                      </p>
                      <p className="text-sm text-ink/55">
                        <strong>Result:</strong> {answer.result || "Not captured"}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}

            <form action={saveExtractionAction}>
              <input type="hidden" name="resumeText" value={state.resumeText} />
              <input type="hidden" name="source" value={state.source} />
              <input
                type="hidden"
                name="extraction"
                value={JSON.stringify(state.extraction)}
              />
              <button type="submit" className="button">
                Save STAR drafts
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
