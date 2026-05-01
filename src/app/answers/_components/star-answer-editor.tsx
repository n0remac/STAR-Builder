"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import {
  regenerateStarScoreAction,
  requestStarFeedbackAction,
  updateStarAnswerAction
} from "@/app/answers/actions";
import type { StarAnswerEditorState } from "@/app/answers/state";
import { CopyAnswerButton } from "@/app/answers/_components/copy-answer-button";
import {
  STAR_CATEGORIES,
  STAR_CATEGORY_LABELS,
  getStarScoreLabel
} from "@/lib/star";

type StarAnswerEditorProps = {
  id: string;
  initialState: StarAnswerEditorState;
};

const STAR_SECTIONS = [
  ["situation", "Situation"],
  ["task", "Task"],
  ["actions", "Actions"],
  ["result", "Result"]
] as const;

function copyText(draft: StarAnswerEditorState["draft"]) {
  return [
    draft.title,
    "",
    `Situation: ${draft.situation}`,
    "",
    `Task: ${draft.task}`,
    "",
    `Actions: ${draft.actions}`,
    "",
    `Result: ${draft.result}`
  ].join("\n");
}

function SubmitButton({
  children,
  className,
  formAction
}: {
  children: ReactNode;
  className: string;
  formAction: (formData: FormData) => void | Promise<void>;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      formAction={formAction}
      disabled={pending}
    >
      {children}
    </button>
  );
}

export function StarAnswerEditor({ id, initialState }: StarAnswerEditorProps) {
  const state = initialState;
  const scoreLabel = getStarScoreLabel(state);

  return (
    <section className="card">
      <form action={updateStarAnswerAction} className="space-y-5">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="score" value={state.score ?? ""} />
        <input
          type="hidden"
          name="scoreRationale"
          value={state.scoreRationale}
        />
        <input
          type="hidden"
          name="scoreIsStale"
          value={String(state.scoreIsStale)}
        />
        <input
          type="hidden"
          name="scoreDraftHash"
          value={state.scoreDraftHash}
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="label">STAR answer</p>
            <h1 className="mt-3 text-4xl font-black">{state.draft.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="pill">
                {STAR_CATEGORY_LABELS[state.draft.category]}
              </span>
              <span className="pill">{scoreLabel}</span>
            </div>
            {state.scoreRationale ? (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
                {state.scoreRationale}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <SubmitButton
              className="button-secondary"
              formAction={requestStarFeedbackAction}
            >
              Request Feedback
            </SubmitButton>
            <CopyAnswerButton text={copyText(state.draft)} />
          </div>
        </div>

        <label className="block space-y-2">
          <span className="label">Title</span>
          <input
            name="title"
            className="field"
            defaultValue={state.draft.title}
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="label">Category</span>
          <select
            name="category"
            className="field"
            defaultValue={state.draft.category}
          >
            {STAR_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {STAR_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>

        {STAR_SECTIONS.map(([name, label]) => (
          <section key={name} className="space-y-2">
            <div className="space-y-1">
              <span className="label">{label}</span>
              {state.feedback[name] ? (
                <p className="text-sm leading-6 text-ink/65">
                  {state.feedback[name]}
                </p>
              ) : null}
            </div>
            <textarea
              name={name}
              className="field min-h-28"
              defaultValue={state.draft[name]}
            />
          </section>
        ))}

        <div className="flex flex-wrap gap-2">
          <SubmitButton className="button" formAction={updateStarAnswerAction}>
            Save answer
          </SubmitButton>
          <SubmitButton
            className="button-secondary"
            formAction={regenerateStarScoreAction}
          >
            Regenerate score
          </SubmitButton>
        </div>
      </form>
    </section>
  );
}
