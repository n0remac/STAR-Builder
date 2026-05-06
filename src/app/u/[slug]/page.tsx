import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import {
  DEFAULT_RESUME_PATH,
  parseProfileLinks,
  parseProfileMetaNarrativeJson,
  profileDisplayName,
  publicProfileReferenceHref
} from "@/lib/profile";
import {
  NARRATIVE_SCOPE_LABELS,
  narrativeThemeLabel
} from "@/lib/narrative";
import { STAR_CATEGORY_LABELS } from "@/lib/star";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await prisma.profile.findFirst({
    where: {
      publicSlug: slug,
      isPublic: true
    },
    include: {
      user: true
    }
  });

  if (!profile) {
    notFound();
  }

  const [positions, answers, narratives] = await Promise.all([
    prisma.position.findMany({
      where: {
        profileVisible: true,
        resume: {
          userId: profile.userId
        }
      },
      orderBy: [
        { profileOrder: "asc" },
        { end: "desc" },
        { start: "desc" }
      ]
    }),
    prisma.starResponse.findMany({
      where: {
        userId: profile.userId,
        profileVisible: true
      },
      include: {
        position: true
      },
      orderBy: [
        { profileOrder: "asc" },
        { updatedAt: "desc" }
      ]
    }),
    prisma.narrative.findMany({
      where: {
        userId: profile.userId,
        profileVisible: true
      },
      include: {
        position: true
      },
      orderBy: [
        { profileOrder: "asc" },
        { updatedAt: "desc" }
      ]
    })
  ]);
  const displayName = profileDisplayName({
    displayName: profile.displayName,
    userName: profile.user.name
  });
  const links = parseProfileLinks(profile.links);
  const contactEmail = profile.contactEmail || profile.user.email || "";
  const resumePath = profile.resumePath || DEFAULT_RESUME_PATH;
  const metaNarrative = parseProfileMetaNarrativeJson(
    profile.metaNarrativeJson
  );
  const visibleAnswerIds = new Set(answers.map((answer) => answer.id));
  const visibleJobIds = new Set(positions.map((position) => position.id));
  const visibleNarrativeIds = new Set(
    narratives.map((narrative) => narrative.id)
  );

  return (
    <div className="space-y-8">
      <section className="card">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.55fr] lg:items-start">
          <div>
            <p className="label">Public engineer profile</p>
            <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.95] text-ink sm:text-7xl">
              {displayName}
            </h1>
            {profile.headline ? (
              <p className="mt-5 max-w-3xl text-xl font-semibold leading-8 text-moss">
                {profile.headline}
              </p>
            ) : null}
          </div>

          <aside className="rounded-[1.5rem] border border-ink/10 bg-paper/70 p-5">
            <p className="label">Contact</p>
            <div className="mt-4 space-y-4">
              {contactEmail ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink/45">
                    Email
                  </p>
                  <Link
                    href={`mailto:${contactEmail}`}
                    className="mt-1 inline-flex font-bold text-moss hover:text-ochre"
                  >
                    {contactEmail}
                  </Link>
                </div>
              ) : null}
              {profile.location ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink/45">
                    Location
                  </p>
                  <p className="mt-1 font-bold text-ink">{profile.location}</p>
                </div>
              ) : null}
              {profile.publicResumeVisible ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink/45">
                    Resume
                  </p>
                  <Link
                    href={resumePath}
                    className="mt-1 inline-flex font-bold text-moss hover:text-ochre"
                  >
                    View resume
                  </Link>
                </div>
              ) : null}
              {links.length > 0 ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink/45">
                    Links
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {links.map((link) => (
                      <Link
                        key={`${link.label}:${link.url}`}
                        href={link.url}
                        className="pill transition hover:border-moss/40 hover:text-moss"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </section>

      <section className="card">
        <p className="label">Career narrative</p>
        <h2 className="mt-3 text-4xl font-black">
          {metaNarrative?.title ?? "Career narrative"}
        </h2>
        {metaNarrative ? (
          <div className="mt-8 max-w-4xl space-y-6 text-lg leading-9 text-ink/75">
            {metaNarrative.paragraphs.map((paragraph, paragraphIndex) => (
              <p key={paragraphIndex}>
                {paragraph.segments.map((segment, segmentIndex) => {
                  const reference = segment.reference;
                  const isVisible =
                    reference?.type === "answer"
                      ? visibleAnswerIds.has(reference.id)
                      : reference?.type === "job"
                        ? visibleJobIds.has(reference.id)
                        : reference?.type === "narrative"
                          ? visibleNarrativeIds.has(reference.id)
                          : false;

                  return reference && isVisible ? (
                    <Link
                      key={segmentIndex}
                      href={publicProfileReferenceHref(slug, reference)}
                      className="font-bold text-moss underline decoration-moss/30 underline-offset-4 transition hover:text-ochre hover:decoration-ochre/60"
                    >
                      {segment.text}
                    </Link>
                  ) : (
                    <span key={segmentIndex}>{segment.text}</span>
                  );
                })}
              </p>
            ))}
          </div>
        ) : profile.summary ? (
          <p className="mt-8 max-w-4xl whitespace-pre-line text-lg leading-9 text-ink/75">
            {profile.summary}
          </p>
        ) : null}
      </section>

      {positions.length > 0 ? (
        <section className="card">
          <p className="label">Experience</p>
          <h2 className="mt-3 text-4xl font-black">Selected roles.</h2>
          <div className="mt-6 grid gap-4">
            {positions.map((position) => (
              <article
                key={position.id}
                id={`job-${position.id}`}
                className="rounded-[1.5rem] border border-ink/10 bg-paper/70 p-5"
              >
                <h3 className="text-2xl font-black">{position.title}</h3>
                <p className="mt-1 font-semibold text-moss">
                  {position.company}
                </p>
                <p className="mt-1 text-sm font-semibold text-ink/55">
                  {[position.start, position.end].filter(Boolean).join(" - ")}
                </p>
                {position.profileSummary ? (
                  <p className="mt-4 whitespace-pre-line text-sm leading-6 text-ink/65">
                    {position.profileSummary}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {answers.length > 0 ? (
        <section className="card">
          <p className="label">STAR answers</p>
          <h2 className="mt-3 text-4xl font-black">Selected stories.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {answers.map((answer) => (
              <Link
                key={answer.id}
                href={`/u/${slug}/answers/${answer.id}`}
                className="rounded-[1.5rem] border border-ink/10 bg-paper/70 p-5 transition hover:border-moss/40 hover:bg-white/80"
              >
                <span className="pill">
                  {STAR_CATEGORY_LABELS[answer.category]}
                </span>
                <h3 className="mt-3 text-2xl font-black">{answer.title}</h3>
                <p className="mt-1 text-sm font-semibold text-moss">
                  {answer.position.title} at {answer.position.company}
                </p>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink/65">
                  {answer.result || answer.situation}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {narratives.length > 0 ? (
        <section className="card">
          <p className="label">Narratives</p>
          <h2 className="mt-3 text-4xl font-black">Selected narratives.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {narratives.map((narrative) => (
              <Link
                key={narrative.id}
                href={`/u/${slug}/narratives/${narrative.id}`}
                className="rounded-[1.5rem] border border-ink/10 bg-paper/70 p-5 transition hover:border-moss/40 hover:bg-white/80"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="pill">
                    {NARRATIVE_SCOPE_LABELS[narrative.scope]}
                  </span>
                  <span className="pill">
                    {narrativeThemeLabel(narrative.theme)}
                  </span>
                </div>
                <h3 className="mt-3 text-2xl font-black">
                  {narrative.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink/65">
                  {narrative.positioning || narrative.shortVersion}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
