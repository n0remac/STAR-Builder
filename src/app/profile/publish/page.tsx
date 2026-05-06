import Link from "next/link";

import { updateProfileCurationAction } from "@/app/profile/actions";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { normalizePublicSlug, profileDisplayName } from "@/lib/profile";
import { getOrCreateProfile } from "@/lib/profile.server";
import {
  NARRATIVE_SCOPE_LABELS,
  narrativeThemeLabel
} from "@/lib/narrative";
import { STAR_CATEGORY_LABELS } from "@/lib/star";

export const dynamic = "force-dynamic";

export default async function PublishProfilePage() {
  const user = await requireCurrentUser();
  const profile = await getOrCreateProfile(user.id, user.name);
  const displayName = profileDisplayName({
    displayName: profile.displayName,
    userName: user.name
  });
  const suggestedSlug =
    profile.publicSlug || normalizePublicSlug(displayName) || user.id;
  const [positions, answers, narratives] = await Promise.all([
    prisma.position.findMany({
      where: {
        resume: {
          userId: user.id
        }
      },
      include: {
        _count: {
          select: {
            starResponses: true
          }
        }
      },
      orderBy: [
        { profileOrder: "asc" },
        { end: "desc" },
        { start: "desc" },
        { updatedAt: "desc" }
      ]
    }),
    prisma.starResponse.findMany({
      where: {
        userId: user.id
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
        userId: user.id
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

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="label">Public profile</p>
            <h1 className="mt-3 text-5xl font-black">Publish settings.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/60">
              Choose exactly which profile sections, STAR answers, and
              narratives are visible on your public profile.
            </p>
          </div>
          {profile.isPublic && profile.publicSlug ? (
            <Link href={`/u/${profile.publicSlug}`} className="button-secondary">
              View public profile
            </Link>
          ) : null}
        </div>
      </section>

      <form action={updateProfileCurationAction} className="space-y-6">
        <section className="card space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex items-center gap-3 rounded-[1.5rem] border border-ink/10 bg-paper/70 p-4">
              <input
                type="checkbox"
                name="isPublic"
                defaultChecked={profile.isPublic}
                className="h-5 w-5 rounded border-ink/20 text-moss focus:ring-moss"
              />
              <span>
                <span className="block font-black">Public profile</span>
                <span className="text-sm text-ink/55">Enable /u URL</span>
              </span>
            </label>

            <label className="block space-y-2">
              <span className="label">Public slug</span>
              <input
                name="publicSlug"
                className="field"
                defaultValue={suggestedSlug}
                placeholder="cameron"
              />
            </label>

            <label className="flex items-center gap-3 rounded-[1.5rem] border border-ink/10 bg-paper/70 p-4">
              <input
                type="checkbox"
                name="publicResumeVisible"
                defaultChecked={profile.publicResumeVisible}
                className="h-5 w-5 rounded border-ink/20 text-moss focus:ring-moss"
              />
              <span>
                <span className="block font-black">Show resume</span>
                <span className="text-sm text-ink/55">Expose resume link</span>
              </span>
            </label>
          </div>
        </section>

        <section className="card">
          <p className="label">Jobs</p>
          <h2 className="mt-3 text-3xl font-black">Visible job context.</h2>
          <div className="mt-5 grid gap-4">
            {positions.map((position) => (
              <div
                key={position.id}
                className="rounded-[1.5rem] border border-ink/10 bg-paper/70 p-5"
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_7rem_0.8fr] lg:items-start">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="positionVisible"
                      value={position.id}
                      defaultChecked={position.profileVisible}
                      className="mt-1 h-5 w-5 rounded border-ink/20 text-moss focus:ring-moss"
                    />
                    <span>
                      <span className="block text-xl font-black">
                        {position.title}
                      </span>
                      <span className="text-sm font-semibold text-moss">
                        {position.company}
                      </span>
                      <span className="mt-1 block text-sm text-ink/55">
                        {position._count.starResponses} STAR answer
                        {position._count.starResponses === 1 ? "" : "s"}
                      </span>
                    </span>
                  </label>
                  <label className="block space-y-2">
                    <span className="label">Order</span>
                    <input
                      type="number"
                      name={`positionOrder:${position.id}`}
                      className="field"
                      defaultValue={position.profileOrder}
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="label">Public summary</span>
                    <textarea
                      name={`positionSummary:${position.id}`}
                      className="field min-h-24"
                      defaultValue={position.profileSummary}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <p className="label">STAR answers</p>
          <h2 className="mt-3 text-3xl font-black">Visible stories.</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {answers.map((answer) => (
              <div
                key={answer.id}
                className="rounded-[1.5rem] border border-ink/10 bg-paper/70 p-5"
              >
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="answerVisible"
                    value={answer.id}
                    defaultChecked={answer.profileVisible}
                    className="mt-1 h-5 w-5 rounded border-ink/20 text-moss focus:ring-moss"
                  />
                  <span>
                    <span className="pill">
                      {STAR_CATEGORY_LABELS[answer.category]}
                    </span>
                    <span className="mt-3 block text-xl font-black">
                      {answer.title}
                    </span>
                    <span className="mt-1 block text-sm font-semibold text-moss">
                      {answer.position.title} at {answer.position.company}
                    </span>
                  </span>
                </label>
                <label className="mt-4 block space-y-2">
                  <span className="label">Order</span>
                  <input
                    type="number"
                    name={`answerOrder:${answer.id}`}
                    className="field max-w-32"
                    defaultValue={answer.profileOrder}
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <p className="label">Narratives</p>
          <h2 className="mt-3 text-3xl font-black">Visible narratives.</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {narratives.map((narrative) => (
              <div
                key={narrative.id}
                className="rounded-[1.5rem] border border-ink/10 bg-paper/70 p-5"
              >
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="narrativeVisible"
                    value={narrative.id}
                    defaultChecked={narrative.profileVisible}
                    className="mt-1 h-5 w-5 rounded border-ink/20 text-moss focus:ring-moss"
                  />
                  <span>
                    <span className="flex flex-wrap gap-2">
                      <span className="pill">
                        {NARRATIVE_SCOPE_LABELS[narrative.scope]}
                      </span>
                      <span className="pill">
                        {narrativeThemeLabel(narrative.theme)}
                      </span>
                    </span>
                    <span className="mt-3 block text-xl font-black">
                      {narrative.title}
                    </span>
                    {narrative.position ? (
                      <span className="mt-1 block text-sm font-semibold text-moss">
                        {narrative.position.title} at{" "}
                        {narrative.position.company}
                      </span>
                    ) : null}
                  </span>
                </label>
                <label className="mt-4 block space-y-2">
                  <span className="label">Order</span>
                  <input
                    type="number"
                    name={`narrativeOrder:${narrative.id}`}
                    className="field max-w-32"
                    defaultValue={narrative.profileOrder}
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="button">
            Save publishing settings
          </button>
          <Link href="/profile" className="button-secondary">
            Back to profile
          </Link>
        </div>
      </form>
    </div>
  );
}
