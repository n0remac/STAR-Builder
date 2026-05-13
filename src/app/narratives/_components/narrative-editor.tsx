"use client";

import type { NarrativeScope } from "@prisma/client";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import {
  regenerateNarrativeScoreAction,
  requestNarrativeFeedbackAction,
  updateNarrativeAction
} from "@/app/narratives/actions";
import { Badge, Button, Panel } from "@/components/ui";
import {
  NARRATIVE_SCOPE_LABELS,
  getNarrativeScoreLabel,
  narrativeThemeLabel
} from "@/lib/narrative";

type NarrativeEditorState = {
  draft: {
    title: string;
    positioning: string;
    fullNarrative: string;
    shortVersion: string;
    interviewGuidance: string;
  };
  feedback: string;
  score: number | null;
  scoreRationale: string;
  scoreIsStale: boolean;
};

type NarrativeEditorProps = {
  id: string;
  scope: NarrativeScope;
  theme: string;
  initialState: NarrativeEditorState;
};

function SubmitButton({
  children,
  formAction,
  variant = "primary"
}: {
  children: ReactNode;
  formAction: (formData: FormData) => void | Promise<void>;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      formAction={formAction}
      disabled={pending}
    >
      {children}
    </Button>
  );
}

export function NarrativeEditor({
  id,
  initialState,
  scope,
  theme
}: NarrativeEditorProps) {
  const state = initialState;

  return (
    <Panel>
      <form action={updateNarrativeAction} className="space-y-5">
        <input type="hidden" name="id" value={id} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="label">Narrative</p>
            <h1 className="mt-3 text-4xl font-black">
              {state.draft.title}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{NARRATIVE_SCOPE_LABELS[scope]}</Badge>
              <Badge>{narrativeThemeLabel(theme)}</Badge>
              <Badge>{getNarrativeScoreLabel(state)}</Badge>
            </div>
            {state.scoreRationale ? (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
                {state.scoreRationale}
              </p>
            ) : null}
          </div>
          <SubmitButton
            formAction={requestNarrativeFeedbackAction}
            variant="secondary"
          >
            Request Feedback
          </SubmitButton>
        </div>

        {state.feedback ? (
          <div className="rounded-[1.5rem] border border-ink/10 bg-paper/70 p-4">
            <p className="label">Feedback</p>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              {state.feedback}
            </p>
          </div>
        ) : null}

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
          <span className="label">Positioning</span>
          <textarea
            name="positioning"
            className="field min-h-28"
            defaultValue={state.draft.positioning}
          />
        </label>

        <label className="block space-y-2">
          <span className="label">Full narrative</span>
          <textarea
            name="fullNarrative"
            className="field min-h-56"
            defaultValue={state.draft.fullNarrative}
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="label">Short version</span>
          <textarea
            name="shortVersion"
            className="field min-h-28"
            defaultValue={state.draft.shortVersion}
          />
        </label>

        <label className="block space-y-2">
          <span className="label">Interview guidance</span>
          <textarea
            name="interviewGuidance"
            className="field min-h-36"
            defaultValue={state.draft.interviewGuidance}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <SubmitButton formAction={updateNarrativeAction}>
            Save narrative
          </SubmitButton>
          <SubmitButton
            formAction={regenerateNarrativeScoreAction}
            variant="secondary"
          >
            Regenerate score
          </SubmitButton>
        </div>
      </form>
    </Panel>
  );
}
