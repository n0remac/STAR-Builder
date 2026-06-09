import { notFound } from "next/navigation";

import { deleteNarrativeAction } from "@/app/narratives/actions";
import { NarrativeEditor } from "@/app/narratives/_components/narrative-editor";
import { DeleteSubmitButton } from "@/components/delete-submit-button";
import { Badge, ButtonLink, CardLink, Panel } from "@/components/ui";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import {
  NARRATIVE_SCOPE_LABELS,
  narrativeThemeLabel
} from "@/lib/narrative";
import { STAR_CATEGORY_LABELS } from "@/lib/star";

export default async function NarrativeDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const narrative = await prisma.narrative.findFirst({
    where: {
      id,
      userId: user.id
    },
    include: {
      position: true,
      targetJob: true,
      sources: {
        include: {
          starResponse: {
            include: {
              position: true
            }
          }
        },
        orderBy: {
          starResponseId: "asc"
        }
      }
    }
  });

  if (!narrative) {
    notFound();
  }

  const draft = {
    title: narrative.title,
    positioning: narrative.positioning,
    fullNarrative: narrative.fullNarrative,
    shortVersion: narrative.shortVersion,
    interviewGuidance: narrative.interviewGuidance
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <NarrativeEditor
        id={narrative.id}
        scope={narrative.scope}
        theme={narrative.theme}
        initialState={{
          draft,
          feedback: narrative.feedback,
          score: narrative.score,
          scoreRationale: narrative.scoreRationale,
          scoreIsStale: narrative.scoreIsStale
        }}
      />

      <aside className="space-y-6">
        <Panel className="h-fit">
          <p className="label">Narrative context</p>
          <h2 className="mt-3 text-3xl font-black">
            {NARRATIVE_SCOPE_LABELS[narrative.scope]}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>
              {narrativeThemeLabel(narrative.theme)}
            </Badge>
            <Badge>
              {narrative.sources.length} source
              {narrative.sources.length === 1 ? "" : "s"}
            </Badge>
          </div>
          {narrative.position ? (
            <div className="mt-5">
              <p className="font-semibold text-moss">
                {narrative.position.company}
              </p>
              <p className="mt-1 text-lg font-black">
                {narrative.position.title}
              </p>
            </div>
          ) : null}
          {narrative.targetJob ? (
            <div className="mt-5">
              <p className="font-semibold text-moss">
                {narrative.targetJob.company}
              </p>
              <p className="mt-1 text-lg font-black">
                {narrative.targetJob.title}
              </p>
              <p className="mt-3 line-clamp-5 text-sm leading-6 text-ink/60">
                {narrative.targetJob.description}
              </p>
            </div>
          ) : null}
          <ButtonLink
            href="/narratives"
            variant="secondary"
            className="mt-6"
          >
            Back to narratives
          </ButtonLink>
          <form action={deleteNarrativeAction} className="mt-3">
            <input type="hidden" name="id" value={narrative.id} />
            <DeleteSubmitButton
              confirmationMessage={`Delete narrative "${narrative.title}"?`}
            >
              Delete narrative
            </DeleteSubmitButton>
          </form>
        </Panel>

        <Panel>
          <p className="label">Source STAR answers</p>
          <div className="mt-4 grid gap-3">
            {narrative.sources.map((source) => (
              <CardLink
                key={source.id}
                href={`/answers/${source.starResponseId}`}
                variant="plain"
              >
                <div className="flex flex-wrap gap-2">
                  <Badge>
                    {STAR_CATEGORY_LABELS[source.starResponse.category]}
                  </Badge>
                  <Badge>{source.roleInNarrative}</Badge>
                </div>
                <h3 className="mt-3 font-black">
                  {source.starResponse.title}
                </h3>
                <p className="mt-1 text-sm font-semibold text-moss">
                  {source.starResponse.position.title} at{" "}
                  {source.starResponse.position.company}
                </p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink/60">
                  {source.starResponse.result ||
                    source.starResponse.situation ||
                    "No detail captured yet."}
                </p>
              </CardLink>
            ))}
          </div>
        </Panel>
      </aside>
    </div>
  );
}
