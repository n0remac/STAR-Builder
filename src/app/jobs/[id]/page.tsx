import Link from "next/link";
import { notFound } from "next/navigation";

import { createJobStarAction } from "@/app/jobs/actions";
import { JobAiPanel } from "@/app/jobs/_components/job-ai-panel";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import {
  getStarScoreLabel,
  STAR_CATEGORIES,
  STAR_CATEGORY_LABELS
} from "@/lib/star";

function formatDateRange(start?: string | null, end?: string | null) {
  return [start, end].filter(Boolean).join(" - ") || "Dates not set";
}

export default async function JobDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const job = await prisma.position.findFirst({
    where: {
      id,
      resume: {
        userId: user.id
      }
    },
    include: {
      starResponses: {
        orderBy: {
          updatedAt: "desc"
        }
      }
    }
  });

  if (!job) {
    notFound();
  }

  const scoredAnswers = job.starResponses.filter(
    (answer) => answer.score !== null
  );
  const staleCount = scoredAnswers.filter(
    (answer) => answer.scoreIsStale
  ).length;
  const averageScore =
    scoredAnswers.length === 0
      ? null
      : Math.round(
          scoredAnswers.reduce(
            (total, answer) => total + (answer.score ?? 0),
            0
          ) / scoredAnswers.length
        );

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="label">Job detail</p>
            <h1 className="mt-3 text-5xl font-black">{job.title}</h1>
            <p className="mt-2 text-lg font-semibold text-moss">
              {job.company}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink/55">
              {formatDateRange(job.start, job.end)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="pill">
              {job.starResponses.length} STAR answer
              {job.starResponses.length === 1 ? "" : "s"}
            </span>
            <span className="pill">
              {averageScore === null
                ? "Unscored"
                : `Avg score ${averageScore}/10`}
            </span>
            {staleCount > 0 ? (
              <span className="pill">{staleCount} stale</span>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="label">STAR answers</p>
              <h2 className="mt-3 text-3xl font-black">Saved for this job.</h2>
            </div>
            <span className="pill">{job.starResponses.length} total</span>
          </div>

          {job.starResponses.length === 0 ? (
            <div className="mt-8 rounded-[1.5rem] border border-dashed border-ink/20 p-8 text-center text-ink/55">
              No STAR answers for this job yet.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {job.starResponses.map((answer) => (
                <Link
                  key={answer.id}
                  href={`/answers/${answer.id}`}
                  className="group rounded-[1.5rem] border border-ink/10 bg-paper/70 p-5 transition hover:-translate-y-0.5 hover:border-moss/40 hover:bg-white/80"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="pill">
                          {STAR_CATEGORY_LABELS[answer.category]}
                        </span>
                        <span className="pill">{getStarScoreLabel(answer)}</span>
                      </div>
                      <h3 className="mt-3 text-2xl font-black group-hover:text-moss">
                        {answer.title}
                      </h3>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink/65">
                        {answer.situation || "No situation yet."}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-moss">Edit</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="card space-y-5">
            <div>
              <p className="label">Manual STAR answer</p>
              <h2 className="mt-3 text-3xl font-black">Add a draft.</h2>
            </div>

            <form action={createJobStarAction} className="space-y-4">
              <input type="hidden" name="jobId" value={job.id} />
              <label className="block space-y-2">
                <span className="label">Title</span>
                <input
                  name="title"
                  className="field"
                  placeholder="Reduced support response time"
                  required
                />
              </label>
              <label className="block space-y-2">
                <span className="label">Category</span>
                <select
                  name="category"
                  className="field"
                  defaultValue="achievement"
                >
                  {STAR_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {STAR_CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </label>
              {[
                ["situation", "Situation", "Short draft of what happened..."],
                ["task", "Task", ""],
                ["actions", "Actions", ""],
                ["result", "Result", ""]
              ].map(([name, label, placeholder]) => (
                <label key={name} className="block space-y-2">
                  <span className="label">{label}</span>
                  <textarea
                    name={name}
                    className="field min-h-24"
                    placeholder={placeholder}
                  />
                </label>
              ))}
              <button type="submit" className="button">
                Create STAR answer
              </button>
            </form>
          </section>

          <JobAiPanel jobId={job.id} />
        </div>
      </div>
    </div>
  );
}
