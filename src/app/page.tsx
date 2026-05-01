import Link from "next/link";

import { getResumeStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { resumes, answers } = await getResumeStats();

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="card overflow-hidden">
        <div className="max-w-3xl">
          <p className="label">Focused behavioral interview prep</p>
          <h1 className="mt-4 text-5xl font-black leading-[0.95] text-ink sm:text-7xl">
            Turn resume fragments into STAR answers.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/70">
            Paste resume content, save job-linked STAR drafts, refine partial
            stories, and get AI help without maintaining separate source cards.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/resume" className="button">
              Paste resume
            </Link>
            <Link href="/jobs" className="button-secondary">
              Add STAR answers
            </Link>
          </div>
        </div>
      </section>

      <aside className="grid gap-4">
        {[
          ["Resumes imported", resumes],
          ["STAR answers", answers]
        ].map(([label, value]) => (
          <div key={label} className="card">
            <p className="label">{label}</p>
            <p className="mt-3 text-5xl font-black tracking-[-0.08em] text-moss">
              {value}
            </p>
          </div>
        ))}
      </aside>
    </div>
  );
}
