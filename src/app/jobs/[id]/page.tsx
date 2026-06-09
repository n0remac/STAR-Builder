import { notFound } from "next/navigation";

import { createJobStarAction, deleteJobAction } from "@/app/jobs/actions";
import { JobAiPanel } from "@/app/jobs/_components/job-ai-panel";
import { DeleteSubmitButton } from "@/components/delete-submit-button";
import { Badge, Button, CardLink, EmptyState, Panel } from "@/components/ui";
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
      <Panel>
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
          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Badge>
                {job.starResponses.length} STAR answer
                {job.starResponses.length === 1 ? "" : "s"}
              </Badge>
              <Badge>
                {averageScore === null
                  ? "Unscored"
                  : `Avg score ${averageScore}/10`}
              </Badge>
              {staleCount > 0 ? (
                <Badge>{staleCount} stale</Badge>
              ) : null}
            </div>
            <form action={deleteJobAction}>
              <input type="hidden" name="jobId" value={job.id} />
              <DeleteSubmitButton
                confirmationMessage={`Delete ${job.title} at ${job.company}? This will also delete its STAR answers.`}
              >
                Delete job
              </DeleteSubmitButton>
            </form>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="label">STAR answers</p>
              <h2 className="mt-3 text-3xl font-black">Saved for this job.</h2>
            </div>
            <Badge>{job.starResponses.length} total</Badge>
          </div>

          {job.starResponses.length === 0 ? (
            <EmptyState>
              No STAR answers for this job yet.
            </EmptyState>
          ) : (
            <div className="mt-6 grid gap-4">
              {job.starResponses.map((answer) => (
                <CardLink
                  key={answer.id}
                  href={`/answers/${answer.id}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge>
                          {STAR_CATEGORY_LABELS[answer.category]}
                        </Badge>
                        <Badge>{getStarScoreLabel(answer)}</Badge>
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
                </CardLink>
              ))}
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel className="space-y-5">
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
              <Button type="submit">
                Create STAR answer
              </Button>
            </form>
          </Panel>

          <JobAiPanel jobId={job.id} />
        </div>
      </div>
    </div>
  );
}
