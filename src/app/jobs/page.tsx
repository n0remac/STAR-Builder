import { createJobAction } from "@/app/jobs/actions";
import { Badge, Button, CardLink, EmptyState, Panel } from "@/components/ui";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatDateRange(start?: string | null, end?: string | null) {
  return [start, end].filter(Boolean).join(" - ") || "Dates not set";
}

function formatLatestUpdate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export default async function JobsPage() {
  const user = await requireCurrentUser();
  const jobs = await prisma.position.findMany({
    where: {
      resume: {
        userId: user.id
      }
    },
    include: {
      starResponses: {
        select: {
          title: true,
          situation: true,
          task: true,
          actions: true,
          result: true,
          score: true,
          scoreIsStale: true,
          updatedAt: true
        }
      }
    },
    orderBy: [
      { end: "desc" },
      { start: "desc" },
      { updatedAt: "desc" },
      { createdAt: "desc" }
    ]
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
      <Panel as="aside" className="h-fit space-y-5">
        <div>
          <p className="label">Manual job</p>
          <h1 className="mt-3 text-4xl font-black">Add a job.</h1>
          <p className="mt-3 text-sm leading-6 text-ink/65">
            Create a role first, then capture manual or AI-assisted STAR
            answers under that job.
          </p>
        </div>

        <form action={createJobAction} className="space-y-4">
          <label className="block space-y-2">
            <span className="label">Company</span>
            <input
              name="company"
              className="field"
              placeholder="Acme Labs"
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="label">Title</span>
            <input
              name="title"
              className="field"
              placeholder="Senior Product Engineer"
              required
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="label">Start</span>
              <input name="start" className="field" placeholder="2022" />
            </label>
            <label className="block space-y-2">
              <span className="label">End</span>
              <input name="end" className="field" placeholder="Present" />
            </label>
          </div>
          <Button type="submit">
            Create job
          </Button>
        </form>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="label">Jobs</p>
            <h2 className="mt-3 text-4xl font-black">Role library.</h2>
          </div>
          <Badge>{jobs.length} total</Badge>
        </div>

        {jobs.length === 0 ? (
          <EmptyState>
            No jobs yet. Paste a resume or add a job manually.
          </EmptyState>
        ) : (
          <div className="mt-6 grid gap-4">
            {jobs.map((job) => {
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
              const latestUpdate = job.starResponses.reduce(
                (latest, answer) =>
                  answer.updatedAt > latest ? answer.updatedAt : latest,
                job.updatedAt
              );

              return (
                <CardLink
                  key={job.id}
                  href={`/jobs/${job.id}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-moss">{job.company}</p>
                      <h3 className="mt-2 text-2xl font-black group-hover:text-moss">
                        {job.title}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-ink/55">
                        {formatDateRange(job.start, job.end)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-moss">Open</span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
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
                    <Badge>
                      Updated {formatLatestUpdate(latestUpdate)}
                    </Badge>
                  </div>
                </CardLink>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
