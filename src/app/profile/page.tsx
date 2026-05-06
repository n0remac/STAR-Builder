import Link from "next/link";

import {
  generateProfileMetaNarrativeAction,
  uploadProfileResumeAction
} from "@/app/profile/actions";
import { requireCurrentUser } from "@/lib/current-user";
import {
  DEFAULT_RESUME_PATH,
  parseProfileLinks,
  parseProfileMetaNarrativeJson,
  profileDisplayName,
  profileReferenceHref
} from "@/lib/profile";
import { getOrCreateProfile } from "@/lib/profile.server";

export const dynamic = "force-dynamic";

function formatGeneratedAt(date: Date | null) {
  if (!date) {
    return "Not generated yet";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export default async function ProfilePage() {
  const user = await requireCurrentUser();
  const profile = await getOrCreateProfile(user.id, user.name);
  const links = parseProfileLinks(profile.links);
  const displayName = profileDisplayName({
    displayName: profile.displayName,
    userName: user.name
  });
  const resumePath = profile.resumePath || DEFAULT_RESUME_PATH;
  const contactEmail = profile.contactEmail || user.email || "";
  const metaNarrative = parseProfileMetaNarrativeJson(
    profile.metaNarrativeJson
  );

  return (
    <div className="space-y-8">
      <section className="card">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.55fr] lg:items-start">
          <div>
            <p className="label">Engineer profile</p>
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

        <div className="mt-8 flex flex-col gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:flex-wrap sm:items-end">
          <form action={generateProfileMetaNarrativeAction}>
            <button type="submit" className="button">
              Regenerate narrative
            </button>
          </form>
          <form
            action={uploadProfileResumeAction}
            encType="multipart/form-data"
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <label className="block space-y-2">
              <span className="label">Upload resume PDF</span>
              <input
                type="file"
                name="resume"
                accept="application/pdf,.pdf"
                className="field max-w-sm"
                required
              />
            </label>
            <button type="submit" className="button-secondary">
              Upload resume
            </button>
          </form>
          <Link href="/profile/edit" className="button-secondary">
            Edit contact
          </Link>
          <Link href="/profile/publish" className="button-secondary">
            Publish settings
          </Link>
        </div>
      </section>

      <section className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="label">Career narrative</p>
            <h2 className="mt-3 text-4xl font-black">
              {metaNarrative?.title ?? "Meta narrative"}
            </h2>
          </div>
          <span className="pill">
            Updated {formatGeneratedAt(profile.metaNarrativeGeneratedAt)}
          </span>
        </div>

        {metaNarrative ? (
          <div className="mt-8 max-w-4xl space-y-6 text-lg leading-9 text-ink/75">
            {metaNarrative.paragraphs.map((paragraph, paragraphIndex) => (
              <p key={paragraphIndex}>
                {paragraph.segments.map((segment, segmentIndex) =>
                  segment.reference ? (
                    <Link
                      key={segmentIndex}
                      href={profileReferenceHref(segment.reference)}
                      className="font-bold text-moss underline decoration-moss/30 underline-offset-4 transition hover:text-ochre hover:decoration-ochre/60"
                    >
                      {segment.text}
                    </Link>
                  ) : (
                    <span key={segmentIndex}>{segment.text}</span>
                  )
                )}
              </p>
            ))}
          </div>
        ) : profile.summary ? (
          <p className="mt-8 max-w-4xl whitespace-pre-line text-lg leading-9 text-ink/75">
            {profile.summary}
          </p>
        ) : (
          <div className="mt-8 rounded-[1.5rem] border border-dashed border-ink/15 p-6 text-sm leading-6 text-ink/55">
            Generate a career narrative to synthesize your STAR answers, jobs,
            target job descriptions, resume text, and saved narratives into one
            linked profile story.
          </div>
        )}
      </section>
    </div>
  );
}
