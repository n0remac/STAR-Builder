import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { STAR_CATEGORY_LABELS } from "@/lib/star";

export const dynamic = "force-dynamic";

export default async function PublicAnswerPage({
  params
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const answer = await prisma.starResponse.findFirst({
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
      position: true
    }
  });

  if (!answer) {
    notFound();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.55fr]">
      <section className="card">
        <p className="label">Public STAR answer</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="pill">{STAR_CATEGORY_LABELS[answer.category]}</span>
        </div>
        <h1 className="mt-4 text-5xl font-black">{answer.title}</h1>
        <div className="mt-8 grid gap-5">
          {[
            ["Situation", answer.situation],
            ["Task", answer.task],
            ["Actions", answer.actions],
            ["Result", answer.result]
          ].map(([label, value]) => (
            <section
              key={label}
              className="rounded-[1.5rem] border border-ink/10 bg-paper/70 p-5"
            >
              <p className="label">{label}</p>
              <p className="mt-3 whitespace-pre-line leading-7 text-ink/70">
                {value || "Not captured."}
              </p>
            </section>
          ))}
        </div>
      </section>

      <aside className="card h-fit">
        <p className="label">Job context</p>
        <h2 className="mt-3 text-3xl font-black">{answer.position.title}</h2>
        <p className="mt-2 text-lg font-semibold text-moss">
          {answer.position.company}
        </p>
        <p className="mt-2 text-sm font-semibold text-ink/55">
          {[answer.position.start, answer.position.end]
            .filter(Boolean)
            .join(" - ") || "Dates not set"}
        </p>
        <Link href={`/u/${slug}`} className="button-secondary mt-6">
          Back to profile
        </Link>
      </aside>
    </div>
  );
}
