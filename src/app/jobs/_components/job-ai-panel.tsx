"use client";

import { useActionState } from "react";

import {
  createJobDraftStarsAction,
  generateJobQuestionsAction
} from "@/app/jobs/actions";
import { initialJobQuestionsState } from "@/app/jobs/state";
import { Badge, Button, Panel } from "@/components/ui";

export function JobAiPanel({ jobId }: { jobId: string }) {
  const [state, formAction, isPending] = useActionState(
    generateJobQuestionsAction,
    initialJobQuestionsState
  );

  return (
    <Panel className="space-y-5">
      <div>
        <p className="label">AI workflow</p>
        <h2 className="mt-3 text-3xl font-black">Find more stories.</h2>
        <p className="mt-3 text-sm leading-6 text-ink/65">
          Generate directed prompts from this job, answer the useful ones, and
          turn those answers into partial STAR answers.
        </p>
      </div>

      <form action={formAction}>
        <input type="hidden" name="jobId" value={jobId} />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Generating..." : "Generate directed questions"}
        </Button>
      </form>

      {state.error ? (
        <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {state.error}
        </p>
      ) : null}

      {state.output ? (
        <form action={createJobDraftStarsAction} className="space-y-4">
          <input type="hidden" name="jobId" value={jobId} />
          <input
            type="hidden"
            name="questions"
            value={JSON.stringify(state.output)}
          />

          <div className="grid gap-4">
            {state.output.questions.map((question, index) => (
              <label
                key={`${question.question}-${index}`}
                className="block rounded-[1.5rem] border border-ink/10 bg-paper/75 p-4"
              >
                <Badge>{question.focus || "Story"}</Badge>
                <span className="mt-3 block font-black">
                  {question.question}
                </span>
                {question.rationale ? (
                  <span className="mt-2 block text-sm leading-6 text-ink/60">
                    {question.rationale}
                  </span>
                ) : null}
                <textarea
                  name="answers"
                  className="field mt-3 min-h-28"
                  placeholder="Answer with what happened, what you did, and what changed..."
                />
              </label>
            ))}
          </div>

          <Button type="submit">
            Create draft STAR answers
          </Button>
        </form>
      ) : null}
    </Panel>
  );
}
