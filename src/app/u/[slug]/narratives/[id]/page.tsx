import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import {
  NARRATIVE_SCOPE_LABELS,
  narrativeThemeLabel
} from "@/lib/narrative";

export const dynamic = "force-dynamic";

export default async function PublicNarrativePage({
  params
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const narrative = await prisma.narrative.findFirst({
    where: {
      id,
      profileVisible: true,
      user: {
        profile: {
          publicSlug: slug,
          isPublic: true
        }
      }
    },
    include: {
      position: true,
      sources: {
        where: {
          starResponse: {
            profileVisible: true
          }
        },
        include: {
          starResponse: {
            include: {
              position: true
            }
          }
        }
      }
    }
  });

  if (!narrative) {
    notFound();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.65fr]">
      <section className="card">
        <p className="label">Public narrative</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="pill">
            {NARRATIVE_SCOPE_LABELS[narrative.scope]}
          </span>
          <span className="pill">{narrativeThemeLabel(narrative.theme)}</span>
        </div>
        <h1 className="mt-4 text-5xl font-black">{narrative.title}</h1>
        {narrative.positioning ? (
          <p className="mt-5 text-xl font-semibold leading-8 text-moss">
            {narrative.positioning}
          </p>
        ) : null}
        <div className="mt-8 space-y-6 text-lg leading-9 text-ink/75">
          <p className="whitespace-pre-line">{narrative.fullNarrative}</p>
          {narrative.shortVersion ? (
            <section className="rounded-[1.5rem] border border-ink/10 bg-paper/70 p-5">
              <p className="label">Short version</p>
              <p className="mt-3 whitespace-pre-line leading-7 text-ink/70">
                {narrative.shortVersion}
              </p>
            </section>
          ) : null}
        </div>
      </section>

      <aside className="space-y-6">
        <section className="card h-fit">
          <p className="label">Context</p>
          {narrative.position ? (
            <>
              <h2 className="mt-3 text-3xl font-black">
                {narrative.position.title}
              </h2>
              <p className="mt-2 text-lg font-semibold text-moss">
                {narrative.position.company}
              </p>
            </>
          ) : (
            <h2 className="mt-3 text-3xl font-black">Career-wide narrative</h2>
          )}
          <Link href={`/u/${slug}`} className="button-secondary mt-6">
            Back to profile
          </Link>
        </section>

        {narrative.sources.length > 0 ? (
          <section className="card">
            <p className="label">Visible source STAR answers</p>
            <div className="mt-4 grid gap-3">
              {narrative.sources.map((source) => (
                <Link
                  key={source.id}
                  href={`/u/${slug}/answers/${source.starResponseId}`}
                  className="rounded-[1.5rem] border border-ink/10 bg-paper/70 p-4 transition hover:border-moss/40 hover:bg-white/80"
                >
                  <h3 className="font-black">{source.starResponse.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-moss">
                    {source.starResponse.position.title} at{" "}
                    {source.starResponse.position.company}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </aside>
    </div>
  );
}
