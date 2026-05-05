import Link from "next/link";
import { notFound } from "next/navigation";

import { NarrativeEditor } from "@/app/narratives/_components/narrative-editor";
import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/default-user";
import {
  NARRATIVE_SCOPE_LABELS,
  getNarrativeFingerprint,
  narrativeThemeLabel
} from "@/lib/narrative";
import { STAR_CATEGORY_LABELS } from "@/lib/star";

export default async function NarrativeDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getDefaultUser();
  const narrative = await prisma.narrative.findFirst({
    where: {
      id,
      userId: user.id
    },
    include: {
      position: true,
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
  const sourceIds = narrative.sources.map((source) => source.starResponseId);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <NarrativeEditor
        id={narrative.id}
        scope={narrative.scope}
        theme={narrative.theme}
        sourceIds={sourceIds}
        initialState={{
          draft,
          feedback: narrative.feedback,
          score: narrative.score,
          scoreRationale: narrative.scoreRationale,
          scoreIsStale: narrative.scoreIsStale,
          sourceHash:
            narrative.sourceHash ??
            getNarrativeFingerprint({
              ...draft,
              scope: narrative.scope,
              theme: narrative.theme,
              sourceIds
            })
        }}
      />

      <aside className="space-y-6">
        <section className="card h-fit">
          <p className="label">Narrative context</p>
          <h2 className="mt-3 text-3xl font-black">
            {NARRATIVE_SCOPE_LABELS[narrative.scope]}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="pill">
              {narrativeThemeLabel(narrative.theme)}
            </span>
            <span className="pill">
              {narrative.sources.length} source
              {narrative.sources.length === 1 ? "" : "s"}
            </span>
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
          <Link href="/narratives" className="button-secondary mt-6">
            Back to narratives
          </Link>
        </section>

        <section className="card">
          <p className="label">Source STAR answers</p>
          <div className="mt-4 grid gap-3">
            {narrative.sources.map((source) => (
              <Link
                key={source.id}
                href={`/answers/${source.starResponseId}`}
                className="rounded-[1.5rem] border border-ink/10 bg-paper/70 p-4 transition hover:border-moss/40 hover:bg-white/80"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="pill">
                    {STAR_CATEGORY_LABELS[source.starResponse.category]}
                  </span>
                  <span className="pill">{source.roleInNarrative}</span>
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
              </Link>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
