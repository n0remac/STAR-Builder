import Link from "next/link";

import { updateProfileAction } from "@/app/profile/actions";
import { requireCurrentUser } from "@/lib/current-user";
import { DEFAULT_RESUME_PATH } from "@/lib/profile";
import { getOrCreateProfile } from "@/lib/profile.server";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const user = await requireCurrentUser();
  const profile = await getOrCreateProfile(user.id, user.name);

  return (
    <div className="mx-auto max-w-3xl">
      <section className="card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="label">Profile settings</p>
            <h1 className="mt-3 text-4xl font-black">Edit contact.</h1>
          </div>
          <Link href="/profile" className="button-secondary">
            View profile
          </Link>
        </div>

        <form action={updateProfileAction} className="mt-6 space-y-4">
          <label className="block space-y-2">
            <span className="label">Display name</span>
            <input
              name="displayName"
              className="field"
              defaultValue={profile.displayName || user.name || ""}
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="label">Headline</span>
            <input
              name="headline"
              className="field"
              defaultValue={profile.headline}
              placeholder="Senior software engineer building fast, reliable product systems"
            />
          </label>
          <label className="block space-y-2">
            <span className="label">Contact email</span>
            <input
              type="email"
              name="contactEmail"
              className="field"
              defaultValue={profile.contactEmail || user.email || ""}
              placeholder="you@example.com"
            />
          </label>
          <label className="block space-y-2">
            <span className="label">Location</span>
            <input
              name="location"
              className="field"
              defaultValue={profile.location}
              placeholder="San Francisco, CA"
            />
          </label>
          <label className="block space-y-2">
            <span className="label">Resume path</span>
            <input
              name="resumePath"
              className="field"
              defaultValue={profile.resumePath || DEFAULT_RESUME_PATH}
              placeholder={DEFAULT_RESUME_PATH}
            />
          </label>
          <label className="block space-y-2">
            <span className="label">Links</span>
            <textarea
              name="links"
              className="field min-h-28"
              defaultValue={profile.links}
              placeholder={
                "GitHub | https://github.com/username\nLinkedIn | https://linkedin.com/in/username"
              }
            />
          </label>
          <label className="block space-y-2">
            <span className="label">Fallback summary</span>
            <textarea
              name="summary"
              className="field min-h-52"
              defaultValue={profile.summary}
              placeholder="Used only when no structured meta narrative has been generated."
            />
          </label>
          <button type="submit" className="button">
            Save contact
          </button>
        </form>
      </section>
    </div>
  );
}
